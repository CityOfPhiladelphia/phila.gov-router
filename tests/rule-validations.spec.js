const path = require('path')
const fs = require('fs')
const safeRegex = require('safe-regex')
const { parseRules, enhancePattern } = require('../src/parser')
const RULES_FILE = '../rules.txt'

const rulesFilePath = path.join(__dirname, RULES_FILE)
const rulesFileContents = fs.readFileSync(rulesFilePath, 'utf8')
const rules = parseRules(rulesFileContents)

describe('rule validations', () => {
  for (const rule of rules) {
    const ruleTitle = rule.pattern
    describe(ruleTitle, () => {
      test('does not include protocol in pattern', () => {
        expect(rule.pattern.startsWith('http')).toBeFalsy()
      })
      test('valid regex', () => {
        const enhancedPattern = enhancePattern(rule.pattern)
        expect(() => new RegExp(enhancedPattern)).not.toThrow()
      })

      // see: https://github.com/substack/safe-regex
      test('is safe regex', () => {
        const enhancedPattern = enhancePattern(rule.pattern)
        expect(safeRegex(enhancedPattern)).toBeTruthy()
      })

      test('has valid status code', () => {
        expect(rule.statusCode).toMatch(/200|301|302|404|500/)
      })

      test('has replacement value starting with http or /', () => {
        expect(rule.replacement).toBeTruthy()
        expect(rule.replacement).toMatch(/^http|\//)
      })
    })
  }
})
