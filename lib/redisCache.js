var redis = require('redis');
var config = require('../lib/config');
var log = require('../log')(module);
var redisClient = redis.createClient(config.get('redis:port'), config.get('redis:host'));

redisClient.on('error', function (err) {
    log.error('Redis error: %s', err.message);
});

redisClient.on('connect', function() {
    // do something
});

redisClient.on('setex', function() {
    log.debug('Redis worked!');
});

module.exports = redisClient;
