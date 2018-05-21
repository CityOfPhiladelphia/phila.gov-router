module.exports = function createFixture({
  host = "d111111abcdef8.cloudfront.net",
  userAgent = "curl/7.18.1",
  uri = "/picture.jpg",
  method = "GET"
}) {
  return {
    "Records": [
      {
        "cf": {
          "config": {
            "distributionDomainName": "d123.cloudfront.net",
            "distributionId": "EDFDVBD6EXAMPLE",
            "eventType": "viewer-request",
            "requestId": "MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE=="
          },
          "request": {
            "clientIp": "2001:0db8:85a3:0:0:8a2e:0370:7334",
            "querystring": "size=large",
            "uri": uri,
            "method": method,
            "headers": {
              "host": [
                {
                  "key": "Host",
                  "value": host
                }
              ],
              "user-agent": [
                {
                  "key": "User-Agent",
                  "value": userAgent
                }
              ]
            },
            "origin": {
              "custom": {
                "customHeaders": {
                  "my-origin-custom-header": [
                    {
                      "key": "My-Origin-Custom-Header",
                      "value": "Test"
                    }
                  ]
                },
                "domainName": "example.com",
                "keepaliveTimeout": 5,
                "path": "/custom_path",
                "port": 443,
                "protocol": "https",
                "readTimeout": 5,
                "sslProtocols": [
                  "TLSv1",
                  "TLSv1.1"
                ]
              },
              "s3": {
                "authMethod": "origin-access-identity",
                "customHeaders": {
                  "my-origin-custom-header": [
                    {
                      "key": "My-Origin-Custom-Header",
                      "value": "Test"
                    }
                  ]
                },
                "domainName": "my-bucket.s3.amazonaws.com",
                "path": "/s3_path",
                "region": "us-east-1"
              }
            }
          }
        }
      }
    ]
  }
}