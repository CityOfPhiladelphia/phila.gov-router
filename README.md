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
Deployment will happen automatically via [Travis CI](https://travis-ci.org/CityOfPhiladelphia/phila.gov-router) based on [.travis.yml](.travis.yml):

- Pushes to the `staging` branch will deploy to the **staging** environment.
- Pushes to the `master` branch will deploy to the **production** environment.

You can skip deployment on a push by specifying `[no ci]` in the commit message.

Once you've run `npm install` locally, you can deploy the router manually using the [deploy script](deploy.sh):

```sh
$ ./deploy.sh $LAMBDA_NAME $LAMBDA_ROLE $S3_BUCKET $CLOUDFRONT_DISTRIBUTION_ID
```
