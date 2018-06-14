# phila.gov router [![Build Status](https://travis-ci.org/CityOfPhiladelphia/phila.gov-router.svg?branch=master)](https://travis-ci.org/CityOfPhiladelphia/phila.gov-router)
Lambda@Edge function for handling redirects and rewrites

## installation
```bash
npm install
```

## testing
```bash
npm test
```

## examples

### redirect based on path
```json
{
  "test": {
    "path_exact": "/old"
  },
  "redirect": {
    "location": "https://example.com/new"
  }
}
```

### redirect based on host header
```json
{
  "test": {
    "host_exact": "alpha.phila.gov",
    "path_pattern": "/(.*)"
  },
  "redirect": {
    "location": "https://www.phila.gov/$1"
  }
}
```

### rewrite based on path
```json
{
  "test": {
    "path_pattern": "/old/(.*)"
  },
  "rewrite": {
    "path": "/$1",
    "origin": "https://example.com/new"
  }
}
```

## api caveats
- A rule cannot have both `redirect` and `rewrite` properties
- A rule's test cannot have both `path_exact` and `path_pattern` properties

These caveats, along with some other edge cases, should be caught by the "rule tests"
in the test suite.
