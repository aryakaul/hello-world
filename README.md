# hello, world 🌍

A phone-first quick reference for saying warm, courteous phrases
— hello, thank you, delicious!, cheers! — in the languages of
the country you're standing in. Search for a country or spin
the globe, and read the pronunciation out loud.

Currently: 49 countries, 51 languages, 17 phrases each.
Pronunciations are anglicized respellings with stressed
syllables in CAPS ("Gracias" → GRAH-see-ahs). Entries marked
"unverified" were AI-generated (then cross-checked against
Google Translate) and await native-speaker review.

Some entries also carry an optional slang layer: a colloquial
variant shown as a second line with a "slang" chip and a
register note (German "Wunderbar!" pairs with slang "Geil!").
Slang can differ by region via country overrides — Mexico's
"¡Qué padre!", Chile's "¡Qué bacán!", Quebec's "C'est
écœurant!" — and, like the rest of the data, is AI-generated
and web-attested (two or more sources) but still carries the
"unverified" badge pending native review.

## Running locally

The site is fully static — no build step, no dependencies
beyond Python for a local server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The home page pairs a
search box (results drop down as you type) with a globe front
and center: drag to spin, pinch or scroll to zoom, hover a
country for its name and languages, and tap a highlighted
(green) country to see its language list appear below. Globe
rendering uses the libraries vendored in `vendor/` (d3-geo,
topojson-client, world-atlas); a Noto Sans Ethiopic font
subset is vendored too, so Ge'ez script renders on any device.
It all works offline and makes no external requests.

### Validating the data

```bash
python3 scripts/validate.py data      # schema check
python3 -m unittest tests.test_validate -v
python3 scripts/build_index.py        # rebuild data/index.json
```

## Project layout

- `index.html`, `styles.css`, `app.js` — the site (vanilla JS,
  hash routing)
- `globe.js` — the canvas globe view
- `data/phrases.json` — the canonical phrase list
- `data/languages/<slug>.json` — per-language phrase entries
- `data/countries/<slug>.json` — countries, their languages by
  prevalence, and regional overrides
- `data/index.json` — search index
- `vendor/` — third-party libraries, committed verbatim

## Contributing

TBD.
