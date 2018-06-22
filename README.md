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

```
/otis                     301 http://www.phillyotis.com
/parksandrec/(.*)         301 https://beta.phila.gov/departments/philadelphia-parks-recreation/
/revenue/(.*)             301 /departments/department-of-revenue/$1
/li/zoning-appeals$       301 /li/zoning-appeals/
/li/zoning-appeals/(.*)   200 https://cityofphiladelphia.github.io/zoning-appeals/$1
/contracts/data$          301 /contracts/data/
/contracts/data/(.*)      200 https://cityofphiladelphia.github.io/contracts/$1
/httpbin/(.*)             200 https://httpbin.org/anything/$1
```

Use status code `301` for a redirect, and `200` for a rewrite.

Patterns and converted to case-insensitive regexes, `^` is prepended (unless it's already there)
and `/?$` is appended unless it or `$` is already there.
