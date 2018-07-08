const { parseRules, enhancePattern } = require('../src/parser')

describe('parser', () => {
  describe('parseRules', () => {
    test('ignores blank lines', () => {
      const lines = `
        /old /new

        /foo /bar
      `
      const rules = parseRules(lines)
      expect(rules).toHaveLength(2)
    })

    test('ignores comment lines', () => {
      const lines = `
        # first section
        /old 301 /new
        # second section
        /old 301 /new
      `
      const rules = parseRules(lines)
      expect(rules).toHaveLength(2)
    })

    test('supports inline comments', () => {
      const lines = `
        /old 301 /new # comment
      `
      const rules = parseRules(lines)
      expect(rules).toHaveLength(1)
      expect(rules[0].pattern).toBe('/old')
      expect(rules[0].statusCode).toBe('301')
      expect(rules[0].replacement).toBe('/new')
    })
  })

  describe('enhancePattern', () => {
    test('adds leading ^ if absent', () => {
      const pattern = '/old'
      const newPattern = enhancePattern(pattern)
      expect(newPattern.startsWith('^/old')).toBeTruthy()
    })

    test('does not add leading ^ if already present', () => {
      const pattern = '^/old'
      const newPattern = enhancePattern(pattern)
      expect(newPattern.startsWith('^/old')).toBeTruthy()
    })

    test('adds trailing /?$ if absent', () => {
      const pattern = '/old'
      const newPattern = enhancePattern(pattern)
      expect(newPattern.endsWith('/old/?$')).toBeTruthy()
    })

    test('does not add trailing /?$ if already present', () => {
      const pattern = '/old/?$'
      const newPattern = enhancePattern(pattern)
      expect(newPattern.endsWith('/old/?$')).toBeTruthy()
    })

    test('does not add trailing /?$ if already ends with $', () => {
      const pattern = '/old$'
      const newPattern = enhancePattern(pattern)
      expect(newPattern.endsWith('/old$')).toBeTruthy()
    })
  })
})
