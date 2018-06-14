const AWS = require('aws-sdk')
const processRequest = require('./index')

const s3 = new AWS.S3({ region: 'us-east-1' })
const RULES_TTL = 5
const RULES_BUCKET = 'test-router-rules-timwis'
const RULES_KEY = 'rules.json'
let rules
let rulesFetchedAt

exports.handler = async function (event) {
  const minsSinceLastFetch = getMinsSince(rulesFetchedAt)
  if (!rulesFetchedAt || minsSinceLastFetch >= RULES_TTL) {
    console.log(`Rules are ${minsSinceLastFetch} mins old. Fetching.`)
    const params = {
      Bucket: RULES_BUCKET,
      Key: RULES_KEY
    }
    if (rulesFetchedAt) {
      params.IfModifiedSince = rulesFetchedAt
    }

    try {
      const response = await s3.getObject(params).promise()
      console.log(`Fetched etag ${response.ETag}`)
      const body = response.Body.toString()
      rules = JSON.parse(body)
      rulesFetchedAt = new Date()
    } catch (err) {
      // AWS SDK treats a 304 as an error, oddly
      if (err.code === 'NotModified') {
        console.log('Rules not modified')
      } else {
        console.error(err)
      }
    }
  }
  return processRequest(rules, event)
}

function getMinsSince (date) {
  const ms = new Date() - date
  return Math.floor(ms / (1000 * 60))
}
