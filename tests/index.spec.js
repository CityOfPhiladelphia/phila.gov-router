const url = require('url')
const createEvent = require('./helpers/create-event')
const processRequest = require('../src/index')

describe('redirects', () => {
  describe('string matches', () => {
    test('vanity url', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        redirect: {
          location: '/new'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new')
    })

    test('ignores trailing slash on request uri', async () => {
      const rules = [{
        test: {
          path_exact: '/old',
        },
        redirect: {
          location: '/new'
        }
      }]
      const event = createEvent({ uri: '/old/' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new')
    })

    test('supports trailing slash on response uri', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        redirect: {
          location: '/new/'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new/')
    })

    test('supports full url in replacement', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        redirect: {
          location: 'http://example.com'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const response = await processRequest(rules, event)
      expectRedirect(response, 'http://example.com')
    })

    test('2-level path exact match', async () => {
      const rules = [{
        test: {
          path_exact: '/old/sub-page'
        },
        redirect: {
          location: '/new/sub-page'
        }
      }]
      const event = createEvent({ uri: '/old/sub-page' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new/sub-page')
    })

    test('no matches returns original request', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        redirect: {
          location: '/new'
        }
      }]
      const event = createEvent({ uri: '/no-match' })
      const request = await processRequest(rules, event)
      expect(request.uri).toBe('/no-match')
    })
  })

  describe('regex matches', () => {
    test('anything after match goes to same place', async () => {
      const rules = [{
        test: {
          path_pattern: '/old/?(.*)'
        },
        redirect: {
          location: '/new'
        }
      }]
      const event = createEvent({ uri: '/old/foo' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new')
    })

    test('include the rest of the path', async () => {
      const rules = [{
        test: {
          path_pattern: '/old/?(.*)'
        },
        redirect: {
          location: '/new/$1'
        }
      }]
      const event = createEvent({ uri: '/old/sub-page/foo' })
      const response = await processRequest(rules, event)
      expectRedirect(response, '/new/sub-page/foo')
    })
  })
})

describe('rewrites', () => {
  describe('string matches', () => {
    test('basic rewrite, same origin', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        rewrite: {
          path: '/new'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const request = await processRequest(rules, event)
      expect(request.uri).toBe('/new')
      expect(request.origin).not.toHaveProperty('custom')
    })

    test('sets custom origin', async () => {
      const rules = [{
        test: {
          path_exact: '/old'
        },
        rewrite: {
          path: '',
          origin: 'http://example.com'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const request = await processRequest(rules, event)
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
      const rules = [{
        test: {
          path_pattern: '/old'
        },
        rewrite: {
          path: '',
          origin: 'http://example.com/new/'
        }
      }]
      const event = createEvent({ uri: '/old' })
      const request = await processRequest(rules, event)
      expect(request.origin.custom.path).toBe('/new')
    })
  })

  describe('regex matches', () => {
    test('change origin and replace path', async () => {
      const rules = [{
        test: {
          path_pattern: '/old(/.+)?'
        },
        rewrite: {
          path: '$1',
          origin: 'http://example.com/new'
        }
      }]
      const event = createEvent({ uri: '/old/foo' })
      const request = await processRequest(rules, event)
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
    const rules = []
    const event = createEvent({ uri: '/Testing' })
    const request = await processRequest(rules, event)
    expect(request.uri).toBe('/testing')
  })

  it('redirects requests of alpha.phila.gov to www.phila.gov', async () => {
    const rules = [{
      test: {
        host_exact: 'alpha.phila.gov',
        path_pattern: '/(.*)'
      },
      redirect: {
        location: 'https://www.phila.gov/$1'
      }
    }]
    const event = createEvent({ uri: '/testing', host: 'alpha.phila.gov' })
    const response = await processRequest(rules, event)
    expectRedirect(response, 'https://www.phila.gov/testing')
  })
})

function expectRedirect (response, expectedUri) {
  expect(response.status).toBe('301')
  expect(response.headers.location).toHaveLength(1)
  const locationHeader = response.headers.location[0]
  expect(locationHeader.key).toBe('Location')
  expect(locationHeader.value).toBe(expectedUri)
}
