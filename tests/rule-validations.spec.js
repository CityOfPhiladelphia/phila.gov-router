const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const { handler } = require('../src')
const createEvent = require('./helpers/create-event')
const rules = require('../rules.json')

describe('rule validations', () => {
  for (const rule of rules) {
    const ruleName = rule.test.path_exact || rule.test.path_pattern
    describe(ruleName, () => {
      if (rule.test.path_pattern) {
        test('valid regex', () => {
          expect(() => new RegExp(rule.test.path_pattern)).not.toThrow()
        })

        test(`a test can't have both path_pattern and path_exact`, () => {
          expect(rule.test).not.toHaveProperty('path_exact')
        })
      } else if (rule.test.path_exact) {
        test('no regex matches in path_exact', () => {
          expect(rule.test.path_exact).not.toContain('(')
          expect(rule.test.path_exact).not.toContain('$')
          expect(rule.test.path_exact).not.toContain('^')
        })
      }

      if (rule.redirect) {
        test(`a redirect rule can't also have a rewrite rule`, () => {
          expect(rule).not.toHaveProperty('rewrite')
        })

        test('has a location property', () => {
          expect(rule.redirect).toHaveProperty('location')
        })

        test('does not have an origin property', () => {
          expect(rule.redirect).not.toHaveProperty('origin')
        })
      } else if (rule.rewrite) {
        test('has a path property', () => {
          expect(rule.rewrite).toHaveProperty('path')
        })

        test('does not have a location property', () => {
          expect(rule.rewrite).not.toHaveProperty('location')
        })
      }
    })
  }
})
