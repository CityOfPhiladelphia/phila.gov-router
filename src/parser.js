const LINE_BREAK = /\n/
const WHITESPACE = /\s+/

module.exports = {
  parseRules, // main export
  enhancePattern // used by tests
}

function parseRules (fileContents) {
  const lines = fileContents.trim().split(LINE_BREAK)
  const rules = []
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (isEmptyOrComment(trimmedLine)) continue

    const [ pattern, statusCode, replacement ] = trimmedLine.split(WHITESPACE)
    const enhancedPattern = enhancePattern(pattern)
    let regex
    try {
      regex = new RegExp(enhancedPattern, 'i') // case insensitive
    } catch (err) {
      console.error(err.message)
    }

    rules.push({
      pattern,
      regex,
      statusCode,
      replacement
    })
  }
  return rules
}

function isEmptyOrComment (line) {
  return line.length === 0 || line.startsWith('#')
}

function enhancePattern (pattern) {
  let newPattern = ''
  if (!pattern.startsWith('^')) {
    newPattern += '^'
  }

  newPattern += pattern

  if (!pattern.endsWith('$')) {
    if (pattern.endsWith('/?')) {
      newPattern += '$'
    } else {
      newPattern += '/?$'
    }
  }
  return newPattern
}
