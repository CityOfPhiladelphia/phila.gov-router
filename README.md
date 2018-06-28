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
/parksandrec/(.*)         301 /departments/philadelphia-parks-recreation/
/revenue/(.*)             301 /departments/department-of-revenue/$1
/li/zoning-appeals$       301 /li/zoning-appeals/
/li/zoning-appeals/(.*)   200 https://cityofphiladelphia.github.io/zoning-appeals/$1
/contracts/data$          301 /contracts/data/
/contracts/data/(.*)      200 https://cityofphiladelphia.github.io/contracts/$1
/httpbin/(.*)             200 https://httpbin.org/anything/$1
```

Use status code `301` for a redirect, and `200` for a rewrite.

Patterns are converted to regexes with the following enhancements:

- Case-insensitive
- `^` is prepended (unless it already starts with `^`)
- `/?$` is appended (unless it already ends with `$`)

## formatting
You can use [tsv-pretty](https://ebay.github.io/tsv-utils-dlang/#tsv-pretty) to
format the file to be more readable.

## deployment
Deployment should happen automatically by the [Travis CI configuration](.travis.yml), assuming `claudia.json` is correct and Travis CI has the authentication and cloudfront ID environment varibles set. You can also manually deploy:

- Verify the information in `claudia.json` is correct
- [Create an `.aws/credentials` file](https://claudiajs.com/tutorials/installing.html#configuring-access-credentials)
- Run the following command, filling in the CloudFront Distribution ID as an environment variable

```bash
AWS_CLOUDFRONT_ID=xxxxxx npm run deploy
```
