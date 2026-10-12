const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const realFs = require('node:fs')
const { beforeEach, describe, test } = require('node:test')

const helperPath = require.resolve('../../node_helper.js')
const realSetTimeout = global.setTimeout
const state = {
  addressBooks: [],
  calendars: [],
  calendarObjects: {},
  credentials: null,
  fetchedAddressBooks: [],
  fetchedCalendars: [],
  fetchError: null,
  errors: [],
  loginCalls: 0,
  parsedCards: {},
  vcards: {},
}
const writes = []
let writeFile = async () => {}

class MockDavClient {
  constructor({ credentials }) {
    state.credentials = credentials
  }

  async login() {
    state.loginCalls += 1
  }

  async fetchAddressBooks() {
    return state.addressBooks
  }

  async fetchCalendars() {
    return state.calendars
  }

  async fetchCalendarObjects({ calendar }) {
    state.fetchedCalendars.push(calendar.displayName)
    if (state.fetchError) throw state.fetchError
    return state.calendarObjects[calendar.displayName] || []
  }

  async fetchVCards({ addressBook }) {
    state.fetchedAddressBooks.push(addressBook.displayName)
    return state.vcards[addressBook.displayName] || []
  }
}

const mockedFs = {
  existsSync: () => false,
  promises: {
    writeFile: (...args) => writeFile(...args),
  },
  createReadStream: realFs.createReadStream,
}

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (parent?.filename === helperPath) {
    if (request === 'node_helper') return { create: (definition) => definition }
    if (request === 'tsdav') return { DAVClient: MockDavClient }
    if (request === 'vcard-parser') {
      return { parse: (value) => state.parsedCards[value] }
    }
    if (request === 'fs') return mockedFs
  }
  return originalLoad.call(this, request, parent, isMain)
}

let helper
try {
  helper = require('../../node_helper.js')
} finally {
  Module._load = originalLoad
}

beforeEach(() => {
  state.addressBooks = []
  state.calendars = []
  state.calendarObjects = {}
  state.credentials = null
  state.fetchedAddressBooks = []
  state.fetchedCalendars = []
  state.fetchError = null
  state.errors = []
  state.loginCalls = 0
  state.parsedCards = {}
  state.vcards = {}
  writes.length = 0
  writeFile = async (filePath, content) => {
    writes.push({ filePath, content })
  }
})

function startFetcher(t, server) {
  let finishWork
  let timerScheduled = false
  const finished = new Promise((resolve) => {
    finishWork = resolve
  })
  t.mock.method(global, 'setTimeout', (callback, delay, ...args) => {
    if (delay === server.updateInterval) {
      timerScheduled = true
      finishWork()
      return 1
    }
    return realSetTimeout.call(global, callback, delay, ...args)
  })
  t.mock.method(console, 'log', () => {})
  t.mock.method(console, 'error', (...args) => state.errors.push(args))

  helper.socketNotificationReceived.call({ fetchers: [] }, 'REGISTER', {
    servers: [server],
  })

  return { finished, timerScheduled: () => timerScheduled }
}

function snapshotEnvironment(keys) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]))
}

function restoreEnvironment(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

describe('MMM-CalDAV node helper', () => {
  test('filters calendars and awaits writing the matching ICS feed', async (t) => {
    let releaseWrite
    let signalWriteStarted
    const writeStarted = new Promise((resolve) => {
      signalWriteStarted = resolve
    })
    const writeBarrier = new Promise((resolve) => {
      releaseWrite = resolve
    })
    writeFile = async (filePath, content) => {
      writes.push({ filePath, content })
      signalWriteStarted()
      await writeBarrier
    }
    state.calendars = [
      { displayName: 'Family' },
      { displayName: 'Work' },
    ]
    state.calendarObjects.Family = [{
      data: Buffer.from([
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'UID:family-event',
        'SUMMARY:Family event',
        'END:VEVENT',
        'BEGIN:VTODO',
        'UID:ignored-task',
        'END:VTODO',
        'END:VCALENDAR',
      ].join('\r\n')),
    }]
    state.calendarObjects.Work = [{
      data: Buffer.from('BEGIN:VEVENT\r\nUID:work-event\r\nEND:VEVENT'),
    }]

    const run = startFetcher(t, {
      envPrefix: 'UNIT_CALDAV_',
      serverUrl: 'https://caldav.example.test',
      defaultAccountType: 'caldav',
      timeRangeStart: 0,
      timeRangeEnd: 1,
      expand: true,
      useMultiGet: true,
      updateInterval: 60000,
      targets: [{ displayName: 'Family', icsName: 'family-feed' }],
    })

    await writeStarted
    try {
      assert.equal(run.timerScheduled(), false)
    } finally {
      releaseWrite()
    }
    await run.finished

    assert.deepEqual(state.fetchedCalendars, ['Family'])
    assert.equal(writes.length, 1)
    assert.equal(path.basename(writes[0].filePath), '.UNIT_CALDAV_family_feed.ics')
    assert.match(writes[0].content, /BEGIN:VCALENDAR[\s\S]*UID:family-event[\s\S]*END:VCALENDAR/)
    assert.doesNotMatch(writes[0].content, /ignored-task|work-event/)
  })

  test('writes an empty feed when the selected calendar has no events', async (t) => {
    state.calendars = [{ displayName: 'Empty' }]
    state.calendarObjects.Empty = [{
      data: Buffer.from('BEGIN:VCALENDAR\r\nEND:VCALENDAR'),
    }]

    const run = startFetcher(t, {
      envPrefix: 'UNIT_CALDAV_',
      defaultAccountType: 'caldav',
      timeRangeStart: 0,
      timeRangeEnd: 1,
      updateInterval: 60000,
      targets: [{ displayName: 'Empty' }],
    })
    await run.finished

    assert.deepEqual(state.errors, [])
    assert.deepEqual(state.fetchedCalendars, ['Empty'])
    assert.equal(writes.length, 1)
    assert.equal(writes[0].content, [
      'BEGIN:VCALENDAR',
      'PRODID:-//github.com/MMRIZE/MMM-CalDAV',
      'VERSION:2.0',
      'END:VCALENDAR',
      '',
    ].join('\r\n'))
  })

  test('does not overwrite a feed when fetching events fails', async (t) => {
    state.calendars = [{ displayName: 'Family' }]
    state.fetchError = new Error('network unavailable')

    const run = startFetcher(t, {
      envPrefix: 'UNIT_CALDAV_',
      defaultAccountType: 'caldav',
      timeRangeStart: 0,
      timeRangeEnd: 1,
      updateInterval: 60000,
      targets: [{ displayName: 'Family' }],
    })
    await run.finished

    assert.equal(state.errors.length, 1)
    assert.equal(state.errors[0][0], state.fetchError)
    assert.equal(writes.length, 0)
  })

  test('reports missing OAuth environment keys before login without exposing values', async (t) => {
    const envPrefix = 'MMM_CALDAV_MISSING_OAUTH_TEST_'
    const credentialNames = ['username', 'refreshToken', 'clientId', 'clientSecret', 'tokenUrl']
    const keys = credentialNames.map((name) => `${envPrefix}${name}`)
    const previousEnvironment = snapshotEnvironment(keys)
    for (const key of keys) delete process.env[key]
    process.env[`${envPrefix}clientSecret`] = 'do-not-log-this-secret'

    try {
      const run = startFetcher(t, {
        envPrefix,
        authMethod: 'Oauth',
        defaultAccountType: 'caldav',
        timeRangeStart: 0,
        timeRangeEnd: 1,
        updateInterval: 60000,
        targets: [],
      })
      await run.finished

      assert.equal(state.loginCalls, 0)
      assert.equal(state.errors.length, 1)
      assert.match(state.errors[0][0].message, /MMM_CALDAV_MISSING_OAUTH_TEST_username/)
      assert.match(state.errors[0][0].message, /MMM_CALDAV_MISSING_OAUTH_TEST_refreshToken/)
      assert.doesNotMatch(state.errors[0][0].message, /do-not-log-this-secret/)
    } finally {
      restoreEnvironment(previousEnvironment)
    }
  })

  test('maps prefixed OAuth environment keys to tsdav credentials', async (t) => {
    const envPrefix = 'MMM_CALDAV_VALID_OAUTH_TEST_'
    const values = {
      username: 'user@example.test',
      refreshToken: 'test-refresh-token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenUrl: 'https://accounts.google.com/o/oauth2/token',
    }
    const keys = Object.keys(values).map((name) => `${envPrefix}${name}`)
    const previousEnvironment = snapshotEnvironment(keys)

    try {
      for (const [name, value] of Object.entries(values)) {
        process.env[`${envPrefix}${name}`] = value
      }

      const run = startFetcher(t, {
        envPrefix,
        authMethod: 'Oauth',
        defaultAccountType: 'caldav',
        timeRangeStart: 0,
        timeRangeEnd: 1,
        updateInterval: 60000,
        targets: [],
      })
      await run.finished

      assert.deepEqual(state.errors, [])
      assert.equal(state.loginCalls, 1)
      assert.deepEqual(state.credentials, values)
    } finally {
      restoreEnvironment(previousEnvironment)
    }
  })

  test('generates a yearly all-day event for a CardDAV birthday', async (t) => {
    const previousTimezone = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      state.addressBooks = [{ displayName: 'Contacts' }]
      state.vcards.Contacts = [{ data: Buffer.from('contact-1') }]
      state.parsedCards['contact-1'] = {
        bday: [{ value: '2000-06-15' }],
        uid: [{ value: 'birthday-1' }],
        rev: [{ value: '2024-01-02T03:04:05.000Z' }],
        fn: [{ value: 'Ada Lovelace' }],
      }

      const run = startFetcher(t, {
        envPrefix: 'UNIT_CALDAV_',
        defaultAccountType: 'carddav',
        updateInterval: 60000,
        targets: [{ displayName: 'Contacts', icsName: 'birthdays' }],
      })
      await run.finished

      assert.deepEqual(state.errors, [])
      assert.deepEqual(state.fetchedAddressBooks, ['Contacts'])
      assert.equal(writes.length, 1)
      assert.equal(path.basename(writes[0].filePath), '.UNIT_CALDAV_birthdays.ics')
      assert.match(writes[0].content, /UID:birthday-1/)
      assert.match(writes[0].content, /SUMMARY:Ada Lovelace/)
      assert.match(writes[0].content, /DTSTART;VALUE=DATE:20000615/)
      assert.match(writes[0].content, /DTEND;VALUE=DATE:20000616/)
      assert.match(writes[0].content, /RRULE:FREQ=YEARLY/)
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = previousTimezone
      }
    }
  })
})
