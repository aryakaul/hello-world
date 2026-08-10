# hello world! 🌍

I have been incredibly fortunate to have traveled to various countries 
across the world, and although large swaths of the world have proficient 
knowledge of a lingua franca (English, French, Hindi, etc.); in my experience, 
making the effort to learn even small phrases in a local language brings
significant joy to others. 

I have long wanted a site like this to exist, and I eventually got frustrated
enough to build it myself. This site is *not* meant to be a comprehensive
learning resource for any particular language; it is meant to be a quick travel 
companion for the global citizen. I have settled on 17 phrases that in my travels
I found myself consistently repeating. I might expand beyond these, but I would need a very compelling reason. 

Currently it is assuming the user is fluent in English, but I would eventually
like to expand it for other lingua francas. The languages for each country were a 
mixture of the country's officially recognized languages along with if Wikipedia
said more than 10% of the country's population spoke it. I see no reason why this
site cannot be comprehensive across all languages so if you do not see your language
included and would like to include it, please see 'How to Contribute'.

 **tl;dr** - this is a simple phrasebook site capturing how to say a handful of 
 phrases in various languages around the world. Currently assumes the user is
 English-speaking.

<a href="https://aryakaul.github.io/hello-world">LOOK AT IT HERE</a>

## How to Contribute

I would love & be eternally grateful if any native speakers to contribute either:
- New languages/regional variants not currently represented
- Suggest fixes for languages/regional variants marked as 'Unverified'
- Add audio recordings for any phrase

The current phrases across the site were generated from a combination of 
Google Translate along with Youtube transcripts, Wiktionary, HiNative, 
& WordRef. Note that this fails pretty badly on smaller languages (Sundanese 
is a good example of this). Since these are machine generated, I have spot-checked some languages I am familiar with; however, I would be grateful for any 
native speakers to contribute if they can. Check out [CONTRIBUTING.md](CONTRIBUTING.md) for more info!

You will need a Github account to do this, but I promise it's not too hard
to make one! If you have any issues or it's unclear at any point, please ask
any nerdy computer friends you have to make an issue for me. 

## Developer Section

### Running locally

The site is fully static. You can `cd` to the project dir and run 

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Globe rendering uses the 
libraries vendored in `vendor/` (d3-geo, topojson-client, 
world-atlas); a Noto Sans Ethiopic font subset is vendored 
too, so Ge'ez script renders on any device. It all works 
offline and makes no external requests.

### Validating the data

```bash
python3 scripts/validate.py data      # schema check
python3 -m unittest tests.test_validate -v
python3 scripts/build_index.py        # rebuild data/index.json
```

### Project layout

- `index.html`, `styles.css`, `app.js` — the site (vanilla JS,
  hash routing)
- `globe.js` — the canvas globe view
- `data/phrases.json` — the canonical phrase list
- `data/languages/<slug>.json` — per-language phrase entries
- `data/countries/<slug>.json` — countries, their languages by
  prevalence, and regional variants (overrides)
-  `data/audio` — per-phrase audio entries (currently empty!! Help out!)
- `data/index.json` — search index
- `vendor/` — third-party libraries, committed verbatim
