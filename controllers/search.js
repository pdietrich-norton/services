var config = require('../lib/config');
var rp = require('request-promise');

// Search from searchandiser
exports.getSearchData = function(mode) {
    return function(req, res) {
        var uri,
            query;
        var searchParams = getSearchParams(req.body);
        if (searchParams.hasOwnProperty('error')) {
            return res.status(400).send({result: searchParams.error});
        }

        // Refinements query requires special request params
        if (mode === "morerefs") {
            if (!searchParams.hasOwnProperty("navigationName")) {
                return res.status(400).send({result: "Request parameters missing."});
            }

            uri = config.get('default:search:refinementsUri');
            query = {
                navigationName: searchParams.navigationName,
                originalQuery: {
                    clientKey: searchParams.clientKey,
                    collection: searchParams.collection,
                    area: searchParams.area
                }
            };

            if (searchParams.hasOwnProperty("query")) {
                query.originalQuery.query = searchParams.query;
            }
        } else {    // normal search query
            uri = config.get('default:search:searchUri');
            query = searchParams;
        }

        rp({
            method: "POST",
            uri: uri,
            body: query,
            json: true
        })
            .then((data) => {
                return res.send(data);
            })
            .catch((err) => {
                return res.send(err);
            })
    };
};

var getSearchParams = function(data) {
    var sortParam = {};
    var configParams = config.get('default:search:configurableParams');

    var defaultParams = {
        clientKey:  config.get('default:search:clientKey'),
        collection: config.get('default:search:collection'),
        area: config.get('default:search:area'),
        fields: config.get('default:search:fields'),
        pruneRefinements: config.get('default:search:pruneRefinements'),
        skip: config.get('default:search:skip'),
        pageSize: config.get('default:search:pageSize'),
        disableAutocorrection: config.get('default:search:disableAutocorrection'),
        matchStrategyName: config.get('default:search:matchStrategyName')
    };

    // Replace default values with any sent from request
    //   and handle special fields which are not simple substitutions
    for (var prop in data) {
        // Validate param is allowed
        if (configParams.indexOf(prop) < 0) {
            return {'error': "Invalid parameter - " + prop};
        }

        if (prop === "fields") {
            defaultParams.fields = defaultParams.fields.replace("*", data[prop]);
            continue;
        }
        if (prop.indexOf("sort[field]") >= 0) {
            sortParam.field = data[prop];
            continue;
        }
        if (prop.indexOf("sort[order]") >= 0) {
            sortParam.order = data[prop];
            continue;
        }
        if (prop === "refinements") {
            defaultParams.refinements = JSON.parse(data[prop]);
            continue;
        }
        defaultParams[prop] = data[prop];
    }

    if (Object.keys(sortParam).length !== 0) {
        defaultParams.sort = sortParam;

    }

    return defaultParams;
};
