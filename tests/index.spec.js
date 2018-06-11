const url = require('url')
const createEvent = require('./helpers/create-event')
const { createHandler } = require('../src')

describe('redirects', () => {
  describe('string matches', () => {
    test('vanity url', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '/new',
        type: 'redirect'
      }])
      const event = createEvent({ uri: '/old' })
      const response = await handler(event)
      expectRedirect(response, '/new')
    })

    test('ignores trailing slash on request uri', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '/new',
        type: 'redirect'
      }])
      const event = createEvent({ uri: '/old/' })
      const response = await handler(event)
      expectRedirect(response, '/new')
    })

    test('supports trailing slash on response uri', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '/new/',
        type: 'redirect'
      }])
      const event = createEvent({ uri: '/old' })
      const response = await handler(event)
      expectRedirect(response, '/new/')
    })

    test('supports full url in replacement', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: 'http://example.com',
        type: 'redirect'
      }])
      const event = createEvent({ uri: '/old' })
      const response = await handler(event)
      expectRedirect(response, 'http://example.com')
    })

    test('2-level path exact match', async () => {
      const handler = createHandler([{
        pattern: '/old/sub-page',
        replacement: '/new/sub-page',
        type: 'redirect'
      }])
      const event = createEvent({ uri: '/old/sub-page' })
      const response = await handler(event)
      expectRedirect(response, '/new/sub-page')
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

  describe('regex matches', () => {
    test('anything after match goes to same place', async () => {
      const handler = createHandler([{
        pattern: '/old/?(.+)',
        replacement: '/new',
        type: 'redirect',
        regex: true
      }])
      const event = createEvent({ uri: '/old/foo' })
      const response = await handler(event)
      expectRedirect(response, '/new')
    })

    test('include the rest of the path', async () => {
      const handler = createHandler([{
        pattern: '/old/?(.+)',
        replacement: '/new/$1',
        type: 'redirect',
        regex: true
      }])
      const event = createEvent({ uri: '/old/sub-page/foo' })
      const response = await handler(event)
      expectRedirect(response, '/new/sub-page/foo')
    })
  })
})

describe('rewrites', () => {
  describe('string matches', () => {
    test('basic rewrite, same origin', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '/new',
        type: 'rewrite'
      }])
      const event = createEvent({ uri: '/old' })
      const request = await handler(event)
      expect(request.uri).toBe('/new')
      expect(request.origin).not.toHaveProperty('custom')
    })

    test('sets custom origin', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '',
        origin: 'http://example.com',
        type: 'rewrite'
      }])
      const event = createEvent({ uri: '/old' })
      const request = await handler(event)
      expect(request.uri).toBe('/')
      expect(request.origin).toHaveProperty('custom')
      expect(request.origin.custom).toMatchObject({
        domainName: 'example.com',
        protocol: 'http',
        port: 80,
        path: ''
      })
    })

    test('strips trailing slashes from origin path', async () => {
      const handler = createHandler([{
        pattern: '/old',
        replacement: '',
        origin: 'http://example.com/new/',
        type: 'rewrite'
      }])
      const event = createEvent({ uri: '/old' })
      const request = await handler(event)
      expect(request.origin.custom.path).toBe('/new')
    })
  })

  describe('regex matches', () => {
    test('change origin and replace path', async () => {
      const handler = createHandler([{
        pattern: '/old(/.+)?',
        regex: true,
        replacement: '$1',
        origin: 'http://example.com/new',
        type: 'rewrite'
      }])
      const event = createEvent({ uri: '/old/foo' })
      const request = await handler(event)
      expect(request.uri).toBe('/foo')
      expect(request.origin.custom).toMatchObject({
        domainName: 'example.com',
        path: '/new'
      })
    })
  })
})

describe('other', () => {
  it('converts non-matched requests to lowercase', async () => {
    const handler = createHandler([])
    const event = createEvent({ uri: '/Testing' })
    const request = await handler(event)
    expect(request.uri).toBe('/testing')
  })
})

function expectRedirect (response, expectedUri) {
  expect(response.status).toBe('301')
  expect(response.headers.location).toHaveLength(1)
  const locationHeader = response.headers.location[0]
  expect(locationHeader.key).toBe('Location')
  expect(locationHeader.value).toBe(expectedUri)
}
