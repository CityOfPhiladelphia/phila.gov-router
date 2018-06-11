const { URL } = require('url')
const { inspect } = require('util')
const TRAILING_SLASH = /\/$/
let compiledRegexes = {}

exports.handler = createHandler(require('../rules.json')) // expose to lambda
exports.createHandler = createHandler // expose for testing

function createHandler (rules) {
  return async function (event) {
    const request = event.Records[0].cf.request
    const cleanPath = request.uri.toLowerCase().replace(TRAILING_SLASH, '')
    log(event)

    const matchedRule = rules.find((rule) => {
      if (rule.regex) {
        if (!compiledRegexes.hasOwnProperty(rule.pattern)) {
          compiledRegexes[rule.pattern] = new RegExp(rule.pattern)
        }
        return compiledRegexes[rule.pattern].test(cleanPath)
      } else {
        return (cleanPath === rule.pattern)
      }
    })

    if (matchedRule) {
      const newPath = (matchedRule.regex)
        ? cleanPath.replace(compiledRegexes[matchedRule.pattern], matchedRule.replacement)
        : matchedRule.replacement

      if (matchedRule.type === 'rewrite') {
        request.uri = newPath || '/'
        if (matchedRule.origin) setOrigin(request, matchedRule.origin)
        log(request)
        return request
      } else {
        const response = createRedirect(newPath)
        log(response)
        return response
      }
    } else {
      log('no match')
      request.uri = request.uri.toLowerCase()
      return request
    }
  }
}

// Mutates request object
function setOrigin (request, origin) {
  const url = new URL(origin)
  const protocol = url.protocol.slice(0, -1) // remove trailing colon
  const path = url.pathname.replace(TRAILING_SLASH, '')

  request.origin = {
    custom: {
      domainName: url.hostname,
      protocol,
      port: (protocol === 'https') ? 443 : 80,
      path,
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

function log (data) {
  if (process.env.NODE_ENV === 'test') return
  // use util.inspect so objects aren't collapsed
  console.log(inspect(data, false, 10))
}
