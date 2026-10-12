# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
