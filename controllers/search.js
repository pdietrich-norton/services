var config = require('../lib/config');
var log = require('../log')(module);
var rp = require('request-promise');
var redis = require('../lib/redisCache');

// Search from searchandiser
exports.getSearchData = function(mode) {
    return function(req, res) {
        var uri,
            query,
            redisKey;

        var searchParams = getSearchParams(req.body);
        if (searchParams.hasOwnProperty('error')) {
            log.info('User error: %s', searchParams.error);
            return res.status(400).send({result: searchParams.error});
        }

        // Refinements query requires special request params
        if (mode === "morerefs") {
            if (!searchParams.hasOwnProperty("navigationName")) {
                log.info('User error: Request parameters missing.');
                return res.status(400).send({result: "Request parameters missing."});
            }

            uri = config.get('search:refinementsUri');
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
            uri = config.get('search:searchUri');
            query = searchParams;
        }

        redisKey = 'book_site-search-' + JSON.stringify(query);

        redis.get(redisKey, function(error, result) {
            if (result) {
                return res.send(result);
            } else {
                rp({
                    method: "POST",
                    uri: uri,
                    body: query,
                    json: true
                })
                    .then((data) => {
                        console.log(redisKey);console.log(data);
                        redis.setex(redisKey, config.get('redis:searchExpiry'), JSON.stringify(data));
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.send(err);
                    })

            }

        });
    }
};

var getSearchParams = function(data) {
    var sortParam = {};
    var configParams = config.get('search:configurableParams');

    var defaultParams = {
        clientKey:  config.get('search:clientKey'),
        collection: config.get('search:collection'),
        area: config.get('search:area'),
        fields: config.get('search:fields'),
        pruneRefinements: config.get('search:pruneRefinements'),
        skip: config.get('search:skip'),
        pageSize: config.get('search:pageSize'),
        disableAutocorrection: config.get('search:disableAutocorrection'),
        matchStrategyName: config.get('search:matchStrategyName')
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
