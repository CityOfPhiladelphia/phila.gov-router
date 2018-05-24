const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const { handler } = require('../src')
const createEvent = require('./helpers/create-event')
const rules = require('../rules.json')
const ruleTests = require('./rule-tests.json')

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