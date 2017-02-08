var config = require('../lib/config');
var cfsign = require('aws-cloudfront-sign');

var signingParams = {
    keypairId: config.get('aws:keypairId'),
    privateKeyPath: __dirname + "/" + config.get('aws:keypairFileName'),
    expireTime: (new Date().getTime() + config.get('aws:expiryTime'))
};

// Generate a signed URL
exports.getSignedUrl = function(s3Object) {
    return cfsign.getSignedUrl(
        s3Object,
        signingParams
    );
};
