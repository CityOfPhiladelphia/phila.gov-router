const fs = require('fs')
const path = require('path')
const util = require('util')
const { URL } = require('url')
const IS_URL = /^https?:\/\//
const WHITESPACE = /\s+/
const RULES_FILE = '../rules.txt'
let rules

module.exports = {
  lambda, // used by lambda function
  handler, // others used by tests
  parseRulesBody,
  parseLine,
  enhancePattern
}

async function lambda (event) {
  if (!rules) {
    const filePath = path.join(__dirname, RULES_FILE)
    const rulesBody = fs.readFileSync(filePath, 'utf8')
    rules = parseRulesBody(rulesBody)
  }
  return handler(rules, event)
}

function handler (rules, event) {
  const request = event.Records[0].cf.request
  const requestPath = request.uri

  // Apply this function to every rule until a match is found
  const matchedRule = rules.find((rule) => rule.pattern.test(requestPath))

  if (matchedRule) {
    const { pattern, replacement, statusCode } = matchedRule
    const newLocation = requestPath.replace(pattern, replacement)

    if (statusCode >= 300 && statusCode < 400) {
      const response = createRedirect(newLocation, statusCode)
      log('redirect', response)
      return response
    } else if(IS_URL.test(newLocation)) {
      rewriteRequest(request, newLocation) // mutate request object
      log('full rewrite', request)
      return request
    } else {
      request.uri = newLocation // mutate request object
      log('uri rewrite', newLocation)
      return request
    }
  } else {
    request.uri = request.uri.toLowerCase() // mutate request object
    log('no match', request.uri)
    return request
  }
}

function parseRulesBody (body) {
  const lines = body.trim().split('\n')
  const rules = lines.map(parseLine)
  return rules
}

function parseLine (line) {
  const [ pattern, statusCode, replacement ] = line.trim().split(WHITESPACE)
  const enhancedPattern = enhancePattern(pattern)
  const regex = new RegExp(enhancedPattern, 'i') // TODO: rename variable to be more readable

  return {
    pattern: regex,
    replacement,
    statusCode
  }
}

function enhancePattern (pattern) {
  let newPattern = ''
  if (!pattern.startsWith('^')) newPattern += '^'
  newPattern += pattern
  if (!pattern.endsWith('$')) {
    if (!pattern.endsWith('/?$')) newPattern += '/?$'
    else newPattern += '$'
  }
  return newPattern
}

function createRedirect (newLocation, statusCode) {
  return {
    status: statusCode,
    statusDescription: 'Moved Permanently',
    headers: {
      location: [
        { key: 'Location', value: newLocation }
      ]
    }
  }
}

// Mutates request object, per AWS docs recommendation :(
function rewriteRequest (request, newLocation) {
  const url = new URL(newLocation)
  const protocol = url.protocol.slice(0, -1) // remove trailing colon

  request.uri = url.pathname
  request.origin = {
    custom: {
      domainName: url.hostname,
      protocol,
      port: (protocol === 'https') ? 443 : 80,
      path: '', // TODO: probably not ideal to put all this in request.uri
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

function log (label, data) {
  if (process.env.NODE_ENV === 'test') return
  // use util.inspect so objects aren't collapsed
  console.log(label, util.inspect(data, false, 10))
}
