var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var config = require('./lib/config');
var searchController = require('./controllers/search');
var awsController = require('./controllers/awsContent');
var log = require('./log')(module);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

// Search routes
app.post('/search', searchController.getSearchData("search"));
app.post('/search/morerefs', searchController.getSearchData("morerefs"));

// AWS routes
app.get('/aws/type/:type/file/:file', awsController.getcontent);


app.listen(config.get('port'), function() {
    log.info('Express server listening on port ' + config.get('port'));
});

// Handle 404's and 500's
app.use(function(req, res, next){
    res.status(404);
    log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
});

module.exports = app;
