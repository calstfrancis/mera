# Changelog

## [1.0.1] — AMO compliance

- Add `data_collection_permissions` to manifest as required by Firefox Add-ons

## [1.0.0] — Initial release

First public release.

### Features
- Hard tab limit enforced on new tab creation; blocked tabs are closed immediately with a notification
- Pinned tabs excluded from the count
- Per-window enforcement mode
- Live toolbar badge showing current tab count (red when at the limit)
- Daily block counter in the popup
- +/− stepper with auto-save (no Apply button needed)
- Firefox theme integration — adapts to any light or dark theme
- Keyboard shortcut: `Alt+Shift+T` (rebindable)
- Accessible from the Add-ons Manager via the Preferences button
