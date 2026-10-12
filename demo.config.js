const path = require('path')
const existsSync = require('fs').existsSync
const envPath = path.resolve(__dirname, '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)

process.env.CALDAV_DEMO_username ||= 'U31d2e472'
process.env.CALDAV_DEMO_password ||= '3e772d60cf52430c80e439c568d9af28'
process.env.CALDAV_SERVICE_USERNAME ||= 'caldav-demo'
process.env.CALDAV_SERVICE_PASSWORD ||= 'caldav-demo'

const config = {
  address: 'localhost',
  port: 8080,
  language: 'de',
  logLevel: ['INFO', 'LOG', 'WARN', 'ERROR'],
  timeFormat: 24,
  units: 'metric',
  modules: [
    {
      module: 'clock',
      position: 'top_left',
    },
    {
      module: 'MMM-CalDAV',
      config: {
        servers: [
          {
            envPrefix: 'CALDAV_DEMO_',
            serverUrl: 'https://www.caldavserver.com/',
            targets: [{ displayName: 'Cal 1', icsName: 'Demo' }],
          },
        ],
      },
    },
    {
      module: 'calendar',
      position: 'top_left',
      header: 'Public CalDAV · Cal 1',
      config: {
        calendars: [
          {
            name: 'Öffentlicher CalDAV-Testkalender',
            url: 'http://localhost:8080/CALDAV/CALDAV_DEMO_Demo.ics',
            auth: {
              user: process.env.CALDAV_SERVICE_USERNAME,
              pass: process.env.CALDAV_SERVICE_PASSWORD,
              method: 'basic',
            },
            symbol: 'calendar-check',
          },
        ],
      },
    },
  ],
}

/** ************* DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== 'undefined') {
  module.exports = config
}
