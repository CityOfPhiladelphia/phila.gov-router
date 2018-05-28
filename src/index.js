const { URL } = require('url')
const TRAILING_SLASH = /\/$/
let compiledRegexes = {}

exports.handler = createHandler(require('../rules.json')) // expose to lambda
exports.createHandler = createHandler // expose for testing

function createHandler (rules) {
  return async function (event) {
    const request = event.Records[0].cf.request
    const cleanPath = request.uri.toLowerCase().replace(TRAILING_SLASH, '')

    for (const rule of rules) {
      let newUrl

      if (rule.regex) {
        if (!compiledRegexes.hasOwnProperty(rule.pattern)) {
          compiledRegexes[rule.pattern] = new RegExp(rule.pattern)
        }

        const regex = compiledRegexes[rule.pattern]
        if (regex.test(cleanPath)) {
          newUrl = cleanPath.replace(regex, rule.replacement)
        }
      } else if (cleanPath === rule.pattern) {
        newUrl = rule.replacement
      }

      if (newUrl) {
        if (rule.type === 'rewrite') {
          addRewriteToRequest(request, newUrl)
          return request
        } else {
          return createRedirect(newUrl)
        }
      }
    }

    // If no matches, return unmodified request
    return request
  }
}

// Mutates request object
function addRewriteToRequest (request, newUrl) {
  const url = new URL(newUrl)
  const protocol = url.protocol.slice(0, -1) // remove trailing colon

  request.origin = {
    custom: {
      domainName: url.hostname,
      protocol: protocol,
      port: (protocol === 'https') ? 443 : 80,
      path: url.pathname,
      sslProtocols: ['TLSv1.2', 'TLSv1.1'],
      readTimeout: 5,
      keepaliveTimeout: 5,
      customHeaders: {}
    }
  }
  request.headers.host = [
    { key: 'host', value: url.hostname }
  ]
}

function createRedirect (newUri) {
  return {
    status: '301',
    statusDescription: 'Moved Permanently',
    headers: {
      location: [
        { key: 'Location', value: newUri }
      ]
    }
  }
}
