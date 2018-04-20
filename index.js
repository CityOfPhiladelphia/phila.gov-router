'use strict';
console.log("Loading json file.");
var json = JSON.parse(require('fs').readFileSync('redirects.json', 'utf8'));

exports.handler = (event, context, callback) => {
    /*
     * Generate HTTP redirect response with 302 status code and Location header.
     */
    const request = event.Records[0].cf.request;
    console.log("Searching for path " + request.uri);
    var match = json.find((it) => {
     return it.OriginalURL === request.uri;
    });
    
    var response;
    
    if (match != null){
        response = {
            status: '302',
            statusDescription: 'Found',
            headers: {
                location: [{
                    key: 'Location',
                    value: match.NewURL,
                }],
            },
        };
    }
    else{
        response = {
            status: '302',
            statusDescription: 'Found',
            headers: {
                location: [{
                    key: 'Location',
                    value: 'https://www.google.com',
                }],
            },
        };
    }
    callback(null, response);
};
