var Observable = require('FuseJS/Observable');
var FileSystem = require('FuseJS/FileSystem');
var sha1 = require('node_modules/js-sha1/build/sha1.min');

var image = cacheImage("https://jpeg.org/images/jpeg2000-home.jpg");

function cacheImage(strImageUrl, obs) {
    console.log('cacheImage');

    if (typeof strImageUrl !== 'string') {
        throw new Error('ImageCacheService::cacheImage should receive only string as URL');
    }
    strImageUrl = strImageUrl.trim();
    var defaultImage = 'Assets/Images/location-no-image.png';
    var errorImage = 'Assets/Images/failed-image.png';
    var imgPathObservable = obs || Observable();

    // This value is setting because if we pass obs then it's value nil
    // until we get image response
    imgPathObservable.value = defaultImage;

    var cachedFilePath = _urlToHashFilePath(strImageUrl);
    var cachedFileName = _urlToHashFileName(strImageUrl);

    FileSystem.exists(cachedFilePath)
        .then(function (isExists) {
            if (!isExists) {
                console.log('cache MISS:');
                console.log(cachedFilePath);

                var oReq = new XMLHttpRequest();
                oReq.open("GET", strImageUrl, true);
                oReq.responseType = "arraybuffer";

                oReq.onload = function () {
                    var arrayBuffer = oReq.response;
                    var contentType = oReq.getResponseHeader('Content-Type');
                    if (!contentType.match(/image/i)) {
                        console.log('ERROR: ' + strImageUrl + ' is not an Image');
                        // non supported image or not an image
                        // change default image to error image
                        imgPathObservable.value = errorImage;
                        return;
                    }
                    if (arrayBuffer) {
                        FileSystem.writeBufferToFile(cachedFilePath, arrayBuffer)
                            .then(function () {
                                console.log(cachedFileName + ': Loaded');
                                imgPathObservable.value = cachedFilePath;
                            })
                            .catch(function (reason) {
                                console.log('ERROR: unable to write buffer to file');
                                console.log(reason);
                            })
                    } else {
                        console.log('array buffer is undefined');
                    }
                };

                oReq.send(null);
            } else {
                imgPathObservable.value = cachedFilePath;
                console.log('cache HIT:');
                console.log(cachedFilePath);
            }

        }, function (error) {
            console.log("Unable to check if file exists");
            console.log(error);
        });

    console.log('imgPathObservable' + imgPathObservable);
    return imgPathObservable;
}

/**
 * Returns hashed file name for given URL. only file name, without path
 * @param {String} strUrl URL like https://server.com/image.jpg
 * @return {string} filename like 234123423fjsd23423.png
 * @private
 */
function _urlToHashFileName(strUrl) {
    // TODO adding .png should not be necessary, possible bug in fuseTools

    //
    // Try return '' + sha1(strUrl) + '.png'; it will work
    //
    return '' + sha1(strUrl) + '';

}

/**
 * Given URL returns hashed file path to given file in local file system
 * File may not exist
 * @param {String} strUrl URL like https://server.com/image2.png
 * @return {string} filename like /path/to/the/dir/234234j2l3kj4f32.png
 * @private
 */
function _urlToHashFilePath(strUrl) {
    var cacheDir = _getCacheDir();
    var cachedFileName = _urlToHashFileName(strUrl);
    var cachedFilePath;
    if (cacheDir.lastIndexOf('/') === cacheDir.length - 1) {
        // do not add / if it's there
        cachedFilePath = cacheDir + cachedFileName;
    } else {
        // add / if it's missing
        cachedFilePath = cacheDir + '/' + cachedFileName;
    }

    return cachedFilePath;
}

/**
 * Returns path to cache directory
 * @return {String}
 * @private
 */
function _getCacheDir() {
    return FileSystem.cacheDirectory;
}

module.exports = {
    image: image,
    cacheImage: cacheImage
}