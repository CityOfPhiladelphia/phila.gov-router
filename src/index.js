const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const REDIRECTS_FILE = path.join(__dirname, '../redirects.yml')
const redirects = yaml.safeLoad(fs.readFileSync(REDIRECTS_FILE, 'utf8'))

exports.createHandler = createHandler
exports.handler = createHandler(redirects.rules)

function createHandler (rules) {
  return async function (event) {
    const { request } = event.Records[0].cf

    let i
    for (i = 0; i < rules.length; i++) {
      const rule = rules[i]
      const regex = new RegExp(rule.pattern)
      if (regex.test(request.uri)) {
        const newUri = request.uri.replace(regex, rule.replacement)

        if (rule.type === 'redirect') {
          return redirect(newUri)
        } else if (rule.type === 'rewrite') {
          request.uri = newUri
          return request
        }
      }
    }
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