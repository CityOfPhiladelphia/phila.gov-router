#!/bin/bash

# We need to deploy the lambda function, then update the
# cloudfront trigger to use the new lambda version. Claudia
# lets us do this with two commands if we have a JSON file
# in place, but we also have to pass a couple args via CLI.
# This deploy script is just a wrapper around those two commands
# so it can be called purely using CLI args. That way the travis
# config can pass it the appropriate environment variables and
# the way deployment works should hopefully be more explicit.

LAMBDA_NAME=$1
LAMBDA_ROLE=$2
S3_BUCKET=$3
CLOUDFRONT_DISTRIBUTION_ID=$4

if [ "$#" -ne 4 ]; then
  echo "Command requires 4 args: LAMBDA_NAME, LAMBDA_ROLE, S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID" >&2
  exit
fi

# Create clauda.json file using env vars
rm -f claudia.json
cat << EOF > claudia.json
{
  "lambda": {
    "role": "$LAMBDA_ROLE",
    "name": "$LAMBDA_NAME",
    "region": "us-east-1"
  }
}
EOF

echo "Deploying $LAMBDA_NAME to $CLOUDFRONT_DISTRIBUTION_ID"

# npx uses the local dependency if it's installed;
# otherwise it pulls the latest version from npm
npx claudia update \
  --version claudia \
  --use-s3-bucket $S3_BUCKET \
&& npx claudia set-cloudfront-trigger \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --event-types origin-request \
  --version claudia
