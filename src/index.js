const fs = require('fs')
const path = require('path')
const util = require('util')
const { URL } = require('url')
const pathToRegexp = require('path-to-regexp')
const zipObject = require('lodash/zipObject')
const IS_URL = /^https?:\/\//
const WHITESPACE = /\s+/
const RULES_FILE = '../rules.txt'
let rules

exports.lambda = lambda
exports.handler = handler
exports.parseRulesBody = parseRulesBody
exports.parseLine = parseLine

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

  // Apply this function to every rule until a match is found
  const matchedRule = rules.find((rule) => rule.test.pattern.test(request.uri))

  if (matchedRule) {
    const params = matchParams(matchedRule, request.uri)
    const replacement = matchedRule.replacementFn(params)

    if (matchedRule.statusCode >= 300 && matchedRule.statusCode < 400) {
      const response = createRedirect(replacement, matchedRule.statusCode)
      log('redirect', response)
      return response
    } else if(IS_URL.test(replacement)) {
      rewriteRequest(request, replacement) // mutate request object
      log('full rewrite', request)
      return request
    } else {
      request.uri = replacement // mutate request object
      log('uri rewrite', replacement)
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
  const keys = [] // will be mutated by path-to-regexp
  const regexp = pathToRegexp(pattern, keys)
  const replacementFn = pathToRegexp.compile(replacement)

  return {
    test: {
      pattern: regexp,
      keys: keys.map((key) => key.name)
    },
    replacementFn,
    statusCode
  }
}

function matchParams (rule, path) {
  if (rule.test.keys.length === 0) return {}
  const keyMatches = rule.test.pattern.exec(path)
    .slice(1) // drop first item (the full string)
    .filter((match) => match !== undefined) // RegExp.prototype.exec leaves `undefined` for non-matches
    .map((match) => match.split('/')) // necessary to recompile multi-level path
  return zipObject(rule.test.keys, keyMatches)
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
