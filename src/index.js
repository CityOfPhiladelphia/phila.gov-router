const { URL } = require('url')
const { inspect } = require('util')
const TRAILING_SLASH = /\/$/
let compiledRegexes = {}

exports.handler = createHandler(require('../rules.json')) // expose to lambda
exports.createHandler = createHandler // expose for testing

function createHandler (rules) {
  return async function (event) {
    const request = event.Records[0].cf.request
    const path = request.uri
    const lowercasePath = path.toLowerCase()
    const trimmedLowercasePath = lowercasePath.replace(TRAILING_SLASH, '')
    const hostname = request.headers.host[0].value
    log(event)

    const matchedRule = rules.find((rule) => {
      if (rule.test.host_exact) {
        return (hostname === rule.test.host_exact)
      } else if (rule.test.path_pattern) {
        return getRegex(rule.test.path_pattern).test(lowercasePath)
      } else if (rule.test.path_exact) {
        return (rule.test.path_exact === trimmedLowercasePath)
      }
    })

    if (matchedRule) {
      const newPath = getNewPath(path, matchedRule)

      if (matchedRule.redirect) {
        const response = createRedirect(newPath)
        log(response)
        return response
      } else if (matchedRule.rewrite) {
        request.uri = newPath || '/'
        const origin = matchedRule.rewrite.origin
        if (origin) setOrigin(request, origin)

        log(request)
        return request
      }
    } else {
      log('no match')
      request.uri = request.uri.toLowerCase()
      return request
    }
  }
}

function getRegex (pattern) {
  if (!compiledRegexes.hasOwnProperty(pattern)) {
    compiledRegexes[pattern] = new RegExp(pattern)
  }
  return compiledRegexes[pattern]
}

function getNewPath (path, rule) {
  const pattern = rule.test.path_pattern
  const replacement = (rule.redirect)
    ? rule.redirect.location
    : rule.rewrite.path

  const newPath = (pattern)
    ? path.replace(getRegex(pattern), replacement)
    : replacement

  return newPath
}

// Mutates request object
function setOrigin (request, origin) {
  const url = new URL(origin)
  const protocol = url.protocol.slice(0, -1) // remove trailing colon
  const path = url.pathname.replace(TRAILING_SLASH, '') // no trailing slash allowed by AWS

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
