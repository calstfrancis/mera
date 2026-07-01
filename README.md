# Tab Cap

A Firefox extension that sets a hard limit on the number of open tabs.

When you try to open a tab past the limit, the new tab is immediately closed and a notification tells you to close one first. The limit is yours to set.

## Features

- Hard tab limit — enforced the moment a new tab opens
- Excludes pinned tabs from the count (pinned tabs are persistent tools, not clutter)
- Per-window mode — enforce the limit on each window independently instead of globally
- Live badge — shows your current tab count in the toolbar at all times, turns red at the limit
- Daily block count — the popup shows how many times you've hit the limit today
- Adapts to your Firefox theme — light, dark, or any custom theme
- Keyboard shortcut: `Alt+Shift+T` (rebindable in Add-ons Manager)

## Install

**[Firefox Add-ons (AMO)](https://addons.mozilla.org)** — coming soon.

Or install manually from the [latest release](../../releases/latest):

1. Download `tab-cap-X.Y.Z.zip`
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**
3. Select the downloaded zip

> Temporary installs are removed when Firefox restarts. For a permanent install, use AMO.

## Usage

Click the Tab Cap icon in your toolbar (or press `Alt+Shift+T`) to open the settings panel:

- Use **−** / **+** to adjust the limit — saves immediately
- Toggle **Enforce per window** to switch between global and per-window mode
- The progress bar shows how full you are; it turns orange above 80% and red at the limit

## Development

```bash
git clone https://github.com/calstfrancis/tab-cap
cd tab-cap

# Load in Firefox
# about:debugging → This Firefox → Load Temporary Add-on → manifest.json
```

No build step. Edit the files and reload the extension in `about:debugging`.

To regenerate icons after editing the SVG sources in `icons/`:

```bash
for size in 16 32 48 96; do
  rsvg-convert -w $size -h $size icons/icon-dark.svg  -o icons/icon-${size}.png
  rsvg-convert -w $size -h $size icons/icon-dark.svg  -o icons/icon-dark-${size}.png
  rsvg-convert -w $size -h $size icons/icon-light.svg -o icons/icon-light-${size}.png
done
```

## License

MIT
