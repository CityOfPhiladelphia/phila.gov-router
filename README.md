# phila.gov router 
Lambda@Edge function for handling redirects and rewrites

## usage
Store your redirect and rewrite rules in `rules.txt`

```
/otis                     301 http://www.phillyotis.com
/parksandrec(.*)          301 /departments/philadelphia-parks-recreation/
/revenue/(.*)             301 /departments/department-of-revenue/$1
/contracts/data$          301 /contracts/data/
/contracts/data/(.*)      200 https://cityofphiladelphia.github.io/contracts/$1
```

Use status code `301` for a permanent redirect, and `200` for a rewrite.

Patterns are converted to regexes with the following enhancements:

- Case-insensitive
- `^` is prepended (unless it already starts with `^`)
- `/?$` is appended (unless it already ends with `$`)

## examples

Redirect `/otis` or `/otis/` to their external site:
```
/otis  301  http://phillyotis.com
```

Redirect `/eeocomplaint` and `/eeocomplaints` and `/eeo-complaints` to its service page:
```
/eeo-?complaints?  301  /services/working-jobs/file-a-sexual-harassment-complaint/
```

Redirect anything under `/parksandrec` to the new homepage:
```
/parksandrec/?.*  301  /departments/parks-and-recreation/
```

Redirect anything under `/oem` to its expanded route:
```
/oem/?(.*)  301  /departments/office-of-emergency-management/$1
```

Rewrite `/contracts/data` to mask a site on github pages (note the redirect for a missing trailing slash, which is otherwise handled by S3's static file hosting feature):
```
/contracts/data$      301  /contracts/data/
/contracts/data/(.*)  200  https://cityofphiladelphia.github.io/contracts/$1
```

## tips
- You can use sites like [regex101](https://regex101.com) to test your regular expressions.
- You can use [tsv-pretty](https://ebay.github.io/tsv-utils-dlang/#tsv-pretty) to format the file to be more readable.

## deployment
Deployment will happen automatically via github actions

- Pushes to the `staging` branch will deploy to the **staging** environment.
- Pushes to the `main` branch will deploy to the **production** environment.

You can skip deployment on a push by specifying `[skip ci]` in the commit message.

## local development

### install node.js dependencies
```bash
npm install
```

### run tests
```bash
npm test
```

### manual deployment
```bash
$ ./deploy.sh $LAMBDA_NAME $LAMBDA_ROLE $S3_BUCKET $CLOUDFRONT_DISTRIBUTION_ID
```
