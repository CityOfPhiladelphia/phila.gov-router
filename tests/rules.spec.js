const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const { handler } = require('../src')
const createEvent = require('./helpers/create-event')

const RULES_FILE = path.join(__dirname, '../rules.yml')
const rules = yaml.safeLoad(fs.readFileSync(RULES_FILE, 'utf8'))

const RULE_TESTS_FILE = path.join(__dirname, 'rule-tests.yml')
const ruleTests = yaml.safeLoad(fs.readFileSync(RULE_TESTS_FILE, 'utf8'))

describe('rule validations', () => {
  for (const rule of rules) {
    test(rule.pattern, () => {
      const validTypes = ['redirect', 'rewrite']
      expect(validTypes).toContain(rule.type)
      expect(() => new RegExp(rule.pattern)).not.toThrow()
    })
  }
})

describe('rule tests', () => {
  for (const ruleTest of ruleTests) {
    test(ruleTest.uri, async () => {
      const event = createEvent({ uri: ruleTest.uri })
      const result = await handler(event)
      if (result.status === '301') {
        expect(result.headers.location[0].value).toBe(ruleTest.expected)
      } else {
        expect(result.uri).toBe(ruleTest.expected)
      }
    })
  }
})