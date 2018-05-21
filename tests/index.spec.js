const url = require('url')
const createEvent = require('./helpers/create-event')
const { createHandler } = require('../src')

describe('redirects', () => {
  test('vanity url', async () => {
    const handler = createHandler([{
      pattern: '/old/?$',
      replacement: '/new/',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/old' })
    const response = await handler(event)
    expectRedirect(response, '/new/')
  })

  test('treats trailing slashes the same', async () => {
    const handler = createHandler([{
      pattern: '/old/?$',
      replacement: '/new/',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/old/' })
    const response = await handler(event)
    expectRedirect(response, '/new/')
  })

  test('2-level path', async () => {
    const handler = createHandler([{
      pattern: '/old/sub-page',
      replacement: '/new/sub-page/',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/old/sub-page' })
    const response = await handler(event)
    expectRedirect(response, '/new/sub-page/')
  })

  test('anything under path goes to same place', async () => {
    const handler = createHandler([{
      pattern: '/old/(.+)?',
      replacement: '/new/',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/old/foo' })
    const response = await handler(event)
    expectRedirect(response, '/new/')
  })

  test('include the rest of the path', async () => {
    const handler = createHandler([{
      pattern: '/old/(.+)?',
      replacement: '/new/$1',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/old/sub-page/foo' })
    const response = await handler(event)
    expectRedirect(response, '/new/sub-page/foo')
  })

  test('no matches returns original request', async () => {
    const handler = createHandler([{
      pattern: '/old',
      replacement: '/new',
      type: 'redirect'
    }])
    const event = createEvent({ uri: '/no-match' })
    const request = await handler(event)
    expect(request.uri).toBe('/no-match')
  })
})

describe('rewrites', () => {
  test('basic rewrite', async () => {
    const handler = createHandler([{
      pattern: '/old',
      replacement: 'http://example.com',
      type: 'rewrite'
    }])
    const event = createEvent({ uri: '/old' })
    const request = await handler(event)
    expect(request).toHaveProperty('uri')
    expect(request.uri).toBe('http://example.com')
  })

  test('pass additional paths', async () => {
    const handler = createHandler([{
      pattern: '/old(.+)?',
      replacement: 'http://example.com$1',
      type: 'rewrite'
    }])
    const event = createEvent({ uri: '/old/foo' })
    const request = await handler(event)
    expect(request.uri).toBe('http://example.com/foo')
  })
})

function expectRedirect (response, expectedUri) {
  expect(response.status).toBe('301')
  expect(response.headers.location).toHaveLength(1)
  const locationHeader = response.headers.location[0]
  expect(locationHeader.key).toBe('Location')
  expect(locationHeader.value).toBe(expectedUri)
}