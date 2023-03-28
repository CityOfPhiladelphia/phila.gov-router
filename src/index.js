const fs = require('fs')
const path = require('path')
const util = require('util')
const { URL } = require('url')
const { parseRules } = require('./parser')
const IS_URL = /^https?:\/\//
const RULES_FILE = '../rules.txt'
let rules
const LANGUAGES = [ '/zh/', '/es/' ]

module.exports = {
  lambda, // used by lambda function
  handler // used by tests
}

async function lambda (event) {
  if (!rules) {
    log('loading rules')
    const rulesFilePath = path.join(__dirname, RULES_FILE)
    const rulesFileContents = fs.readFileSync(rulesFilePath, 'utf8')
    rules = parseRules(rulesFileContents)
  } else {
    log('rules already loaded')
  }
  return handler(rules, event)
}

function handler (rules, event) {
  const request = event.Records[0].cf.request
  let translatedLang;
  let translatedUri;
  log('request', request)
  console.log(request.uri.slice(3));
  for (const lang of LANGUAGES) {
    if(request.uri.includes(lang)) {
      translatedLang = lang.slice(0,-1);
      console.log(translatedLang);
      translatedUri = request.uri.slice(3);
      break;
    }
  }

  // Apply this function to every rule until a match is found
  let matchedRule = rules.find((rule) => rule.regex.test(request.uri))
  if (translatedUri != undefined) {
    matchedRule = rules.find((rule) => rule.regex.test(translatedUri))
  }
  console.log(translatedUri);
  console.log(matchedRule);

  if (matchedRule) {
    const { regex, replacement, statusCode } = matchedRule
    let newLocation = request.uri.replace(regex, replacement)
    if (translatedUri) {
      newLocation = translatedUri.replace(regex, replacement)
    }

    if (statusCode >= 300 && statusCode < 400) {
      const response = createRedirect(newLocation, statusCode, translatedLang)
      log('redirect', response)
      return response
    } else if(IS_URL.test(newLocation)) {
      rewriteRequest(request, newLocation) // mutate request object
      log('full rewrite', request)
      return request
    } else {
      request.uri = newLocation
      log('uri rewrite', newLocation)
      return request
    }
  } else {//no match found
    if (request.uri.includes('/media/') ) {
      log('no match, mediaURL', request.uri)
      return request
    }else{
      request.uri = request.uri.toLowerCase() // mutate request object
      log('no match', request.uri)
      return request
      }
  }
}

function createRedirect (newLocation, statusCode, translatedLang) {
  if (translatedLang != undefined && newLocation.substring(0,3) != '/20') {
    newLocation = translatedLang+newLocation;
  }
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
      sslProtocols: ['TLSv1.2'],
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
  if (data) console.log(label, util.inspect(data, false, 10))
  else console.log(label)
}
