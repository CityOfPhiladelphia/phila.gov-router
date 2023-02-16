const LINE_BREAK = /\n/
const WHITESPACE = /\s+/
const LANGUAGES = [ '/zh', '/es','/ar', '/fr', '/ru', '/ms', '/hi', '/pt', '/bn', '/id', '/sw', '/ja', '/de', '/ko', '/it', '/fa', '/tr', '/nl', '/te', '/vi', '/ht' ]

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
    let translatedLines = [];
    translatedLines.push({
      'pattern':pattern, 
      'statusCode':statusCode, 
      'replacement':replacement
    })
    if (statusCode == '301' && replacement.charAt(0) == '/') {
      for (const lang of LANGUAGES) {
        translatedLines.push({
          'pattern':lang+pattern, 
          'statusCode':statusCode, 
          'replacement':lang+replacement
        })
      }
    }
    console.log('translated lines');
    console.log(translatedLines);
    
    // const translatedLines = addTranslations ( trimmedLine )
    for (const translatedLine of translatedLines) {
      const enhancedPattern = enhancePattern(translatedLine.pattern)
      const pattern = translatedLine.pattern;
      const statusCode = translatedLine.statusCode;
      const replacement = translatedLine.replacement;
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
  }
  console.log(rules)
  return rules
}

function addTranslations ( trimmedLine ) {
  const [ pattern, statusCode, replacement ] = trimmedLine.split(WHITESPACE)
  let translatedLines = [];
  translatedLines.push({
    'pattern':pattern, 
    'statusCode':statusCode, 
    'replacement':replacement
  })
  if (statusCode == '301' && replacement.charAt(0) == '/') {
    for (const lang of LANGUAGES) {
      translatedLines.push({
        'pattern':lang+pattern, 
        'statusCode':statusCode, 
        'replacement':lang+replacement
      })
    }
  }
  return translatedLines;
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
