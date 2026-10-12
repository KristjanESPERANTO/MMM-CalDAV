const assert = require('node:assert/strict')
const { describe, test } = require('node:test')

let caldavModule
const previousModule = global.Module
global.Module = {
  register(name, definition) {
    if (name === 'MMM-CalDAV') caldavModule = definition
  },
}
require('../../MMM-CalDAV.js')
if (previousModule === undefined) {
  delete global.Module
} else {
  global.Module = previousModule
}

function startModule(config) {
  const notifications = []
  const instance = {
    config,
    sendSocketNotification: (...args) => notifications.push(args),
  }
  caldavModule.start.call(instance)
  return { instance, notifications }
}

describe('MMM-CalDAV configuration', () => {
  test('defines the default configuration', () => {
    assert.deepEqual(caldavModule.defaults, {
      updateInterval: 15 * 60 * 1000,
      timeRangeStart: -365,
      timeRangeEnd: 365,
      servers: [],
    })
  })

  test('normalizes targets and preserves server overrides', () => {
    const config = {
      updateInterval: 60000,
      timeRangeStart: -30,
      timeRangeEnd: 90,
      servers: [{
        envPrefix: 'TEST_',
        serverUrl: 'https://caldav.example.test',
        timeRangeStart: -7,
        expand: true,
        targets: [
          'Family',
          { displayName: 'Work' },
          { displayName: 'Custom', icsName: 'custom-feed' },
          42,
        ],
      }],
    }

    const { instance, notifications } = startModule(config)
    const [server] = config.servers

    assert.equal(server.defaultAccountType, 'caldav')
    assert.equal(server.authMethod, 'Basic')
    assert.equal(server.expand, true)
    assert.equal(server.timeRangeStart, -7)
    assert.equal(server.timeRangeEnd, 90)
    assert.equal(server.updateInterval, 60000)
    assert.deepEqual(server.targets, [
      { displayName: 'Family', icsName: 'Family' },
      { displayName: 'Work', icsName: 'Work' },
      { displayName: 'Custom', icsName: 'custom-feed' },
      {},
    ])
    assert.deepEqual(notifications, [['REGISTER', instance.config]])
  })

  test('sets CardDAV type and replaces invalid targets with an empty list', () => {
    const config = {
      servers: [{ accountType: 'carddav', targets: 'Contacts' }],
    }

    startModule(config)

    assert.equal(config.servers[0].defaultAccountType, 'carddav')
    assert.equal(config.servers[0].expand, false)
    assert.deepEqual(config.servers[0].targets, [])
  })
})
