const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const RULES_FILE = path.join(__dirname, '../rules.yml')
const rules = yaml.safeLoad(fs.readFileSync(RULES_FILE, 'utf8'))

exports.createHandler = createHandler // expose for testing
exports.handler = createHandler(rules) // expose to lambda

function createHandler (rules) {
  return async function (event) {
    const { request } = event.Records[0].cf

    for (const rule of rules) {
      const regex = new RegExp(rule.pattern)
      if (regex.test(request.uri)) {
        const newUri = request.uri.replace(regex, rule.replacement)

        if (rule.type === 'rewrite') {
          request.uri = newUri
          return request
        } else {
          return redirect(newUri)
        }
      }
    }

    // If no matches, return unmodified request
    return request
  }
}

function redirect (newUri) {
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