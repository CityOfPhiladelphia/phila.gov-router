# phila.gov router
Lambda@Edge function for handling redirects and rewrites

## installation
```bash
npm install
```

## testing
```bash
npm test
```

## rule schema

### redirects
`replacement` must be a full URL.

```json
{
  "pattern": "/old",
  "replacement": "https://example.com/new",
  "type": "redirect"
}
```

### rewrites
```json
{
  "pattern": "/old(/.+)?",
  "regex": true,
  "replacement": "$1",
  "origin": "https://example.com/new",
  "type": "rewrite"
}
```
