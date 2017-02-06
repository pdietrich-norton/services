var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var config = require('./lib/config');
var searchController = require('./controllers/search');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

// Routes
app.post('/search', searchController.getSearchData("search"));
app.post('/search/morerefs', searchController.getSearchData("morerefs"));


app.listen(config.get('port'));

module.exports = app;

