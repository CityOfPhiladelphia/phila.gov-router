const createEvent = require('./helpers/create-event')
const { handler } = require('../src/index')
const { parseRules } = require('../src/parser')

describe('redirects', () => {
  describe('exact matches', () => {
    test('vanity url', async () => {
      const rules = parseRules('/old 301 /new')
      const event = createEvent({ uri: '/old' })
      const response = handler(rules, event)
      expectRedirect(response, '/new')
    })

    test('ignores trailing slash on request uri', async () => {
      const rules = parseRules('/old 301 /new')
      const event = createEvent({ uri: '/old/' })
      const response = handler(rules, event)
      expectRedirect(response, '/new')
    })

    test('supports trailing slash on response uri', async () => {
      const rules = parseRules('/old 301 /new/')
      const event = createEvent({ uri: '/old' })
      const response = handler(rules, event)
      expectRedirect(response, '/new/')
    })

    test('supports full url in replacement', async () => {
      const rules = parseRules('/old 301 http://example.com')
      const event = createEvent({ uri: '/old' })
      const response = handler(rules, event)
      expectRedirect(response, 'http://example.com')
    })

    test('2-level path exact match', async () => {
      const rules = parseRules('/old/sub-page 301 /new/sub-page')
      const event = createEvent({ uri: '/old/sub-page' })
      const response = handler(rules, event)
      expectRedirect(response, '/new/sub-page')
    })

    test('no matches returns original request', async () => {
      const rules = parseRules('/old 301 /new')
      const event = createEvent({ uri: '/no-match' })
      const request = handler(rules, event)
      expect(request.uri).toBe('/no-match')
    })
  })

  describe('pattern matches', () => {
    test('anything after match goes to same place', async () => {
      const rules = parseRules('/old/(.*) 301 /new')
      const event = createEvent({ uri: '/old/foo' })
      const response = handler(rules, event)
      expectRedirect(response, '/new')
    })

    test('include the rest of the path', async () => {
      const rules = parseRules('/old/(.*) 301 /new/$1')
      const event = createEvent({ uri: '/old/sub-page/foo' })
      const response = handler(rules, event)
      expectRedirect(response, '/new/sub-page/foo')
    })
  })
})

describe('rewrites', () => {
  describe('exact matches', () => {
    test('basic rewrite, same origin', async () => {
      const rules = parseRules('/old 200 /new')
      const event = createEvent({ uri: '/old' })
      const request = handler(rules, event)
      expect(request.uri).toBe('/new')
      //expect(request.origin).not.toHaveProperty('custom')
    })

    test('sets custom origin', async () => {
      const rules = parseRules('/old 200 http://example.com')
      const event = createEvent({ uri: '/old' })
      const request = handler(rules, event)
      expect(request.uri).toBe('/')
      expect(request.origin).toHaveProperty('custom')
      expect(request.origin.custom).toMatchObject({
        domainName: 'example.com',
        protocol: 'http',
        port: 80,
        path: ''
      })
    })
  })

  describe('pattern matches', () => {
    test('change origin and replace uri', async () => {
      const rules = parseRules('/old/(.*) 200 http://example.com/new/$1')
      const event = createEvent({ uri: '/old/foo' })
      const request = handler(rules, event)
      expect(request.uri).toBe('/new/foo')
      expect(request.origin.custom).toMatchObject({
        domainName: 'example.com',
        path: ''
      })
    })

    test('maintains trailing slash', async () => {
      const rules = parseRules('/old/(.*) 200 /new/$1')
      const event = createEvent({ uri: '/old/' })
      const request = handler(rules, event)
      expect(request.uri).toBe('/new/')
    })
  })
})

describe('other', () => {
  it('converts non-matched requests to lowercase', async () => {
    const rules = []
    const event = createEvent({ uri: '/Testing' })
    const request = handler(rules, event)
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
