const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const { handler } = require('../src')
const createEvent = require('./helpers/create-event')
const rules = require('../rules.json')

describe('rule validations', () => {
  for (const rule of rules) {
    describe(rule.pattern, () => {
      test('valid type', () => {
        expect(rule.type).toMatch(/redirect|rewrite/)
      })

      if (rule.regex) {
        test('valid regex', () => {
          expect(() => new RegExp(rule.pattern)).not.toThrow()
        })
      } else {
        test('no regex matches in non-regex rule', () => {
          expect(rule.pattern).not.toContain('(')
          expect(rule.pattern).not.toContain('$')
          expect(rule.pattern).not.toContain('^')
        })
      }
    })
  }
})
