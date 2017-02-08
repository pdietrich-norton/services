var config = require('../lib/config');
var log = require('../log')(module);
var rp = require('request-promise');
var cloudfrontSignedUrls = require('../lib/cloudfrontSignedUrls');

exports.getcontent = function(req, res) {
    var type = req.params.type;
    var file = req.params.file;

    var fileInfo = getBucketInfo(file);

    if (fileInfo.status === "public") {
        if (type === "url") {
            res.json({uri: fileInfo.url});
        } else {
            res.redirect(fileInfo.url);
        }
        return;
    }

    // must be protected
    var signedUrl = cloudfrontSignedUrls.getSignedUrl(fileInfo.url);

    if (type === "url") {
        res.json({url: signedUrl});
    } else {
        res.redirect(signedUrl);
    }
    return;
};

// get bucket info for the file passed in. Also identify and add the aws path from it
function getBucketInfo(file) {
    var fnodes = file.split("/");
    // remove empty node
    fnodes.shift();
    var targetBucket = fnodes[0];
    var buckets = config.get('aws:s3Buckets')
    for (var i=0; i<buckets.length; i++) {
        if (buckets[i].name === targetBucket) {
            fnodes.shift();
            buckets[i].url = buckets[i].distrib  + fnodes.join("/");
            return buckets[i];
        }
    }

    return null;
}

//http://localhost:3000/aws/type/file/file/%2F
//   %2Fwwnorton.college.public%2Fbiology%2FBIOCHEM%2FProcess+Animations%2FMiesfeld_Animation_01_FINAL.mp4
//   %2Fnortoniigprotectedassets%2Fpsyc%2Fdoc%2FPSYLIFE2%2FChapter+7%2FPSYLIFE_Teaching+Video_Ch7.mp4