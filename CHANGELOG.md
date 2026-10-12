# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [2.2.0](https://github.com/MMRIZE/MMM-CalDAV/compare/v2.1.1...v2.2.0) (2026-10-12)

### Features

* add demo ([4aff575](https://github.com/MMRIZE/MMM-CalDAV/commit/4aff5759e6b2c6b447d42bf6b11df993dd9fc4a8))

### Bug Fixes

* **caldav:** await saveIcs calls ([e1a7649](https://github.com/MMRIZE/MMM-CalDAV/commit/e1a7649d25c4572db2844030bae2dd1e07c4afe3))
* **caldav:** guard optional name join ([2cd9636](https://github.com/MMRIZE/MMM-CalDAV/commit/2cd96365bc6a0bdc95dd0f01a6d0b1e5ad088dbf))
* **caldav:** preserve errors during retry scheduling ([b873ccc](https://github.com/MMRIZE/MMM-CalDAV/commit/b873ccc5b4f88d433a72501a49f0e878aad5f1e3))
* **caldav:** preserve recurrence rules by default ([53ffed4](https://github.com/MMRIZE/MMM-CalDAV/commit/53ffed40defd3b60831652bf9e99d8c67885b514))
* **carddav:** prevent birthday date shifts ([fb7f40f](https://github.com/MMRIZE/MMM-CalDAV/commit/fb7f40fb02d2fa701a6b6c2dbdc9d86d41515e02))
* **docs:** update screenshot URL ([7059dab](https://github.com/MMRIZE/MMM-CalDAV/commit/7059dab0430f75bebed96552832da5d6235211aa))
* **docs:** use npm install instead of npm update ([fe7c650](https://github.com/MMRIZE/MMM-CalDAV/commit/fe7c6502a9aa81c2c5b32daff914f29cf7fec18a))
* **ics:** write empty feeds after successful fetch ([9523904](https://github.com/MMRIZE/MMM-CalDAV/commit/95239044f0ecdbb4f12c92769f1966946e7d8596))
* **oauth:** report missing env credentials ([3a9a673](https://github.com/MMRIZE/MMM-CalDAV/commit/3a9a673ef5de87ea08e486dd6526857dc572f692))
* **setup:** preserve existing .env ([118c1b8](https://github.com/MMRIZE/MMM-CalDAV/commit/118c1b88689a2c6055568e913c08b1bcd95dede9))

## 2.1.1 (2024-11-30)

### Added

- Reveal the URL in the `google_auth` script so the browser can be opened manually.
- Document hidden configuration properties. (#9)
- Add ESLint configuration.

### Changed

- Update dependencies.

## 2.1.0 (2023-12-29)

### Added

- Enable birthday calendars with the CardDAV implementation.

### Changed

- Refactor code.
- Replace `calendars: []` with `targets: []`; existing `config.js` must be updated.

## 2.0.0 (2023-10-25)

### Added

- Rebuild the module from scratch.
- Support OAuth for Google Calendar.
- Support multiple calendars and servers in one module.

### Changed

- Improve security and efficiency.

## 1.0.0 (2021-09-29)

### Added

- Initial release.
