# Contributing to hello world

Every phrase here started as an AI draft. The whole point of
this project is to replace those drafts with words a **native
or fluent speaker** vouches for — and, eventually, with
recordings of real voices. If you speak one of these
languages, you are exactly who we need.

There are four ways to help. The first two need nothing but a
GitHub account; the last two are short pull requests.

- [Correct a phrase](#1-correct-a-phrase) — something is off
- [Verify a phrase](#2-verify-a-phrase) — confirm a draft is right
- [Add your language](#3-add-your-language) — a new language file
- [Record audio](#4-record-audio) — a clip of you saying it

Data lives in plain JSON under `data/`. The site is fully
static — no build step, no backend. Two scripts keep the data
honest; run them before you open a pull request:

```bash
python3 scripts/build_index.py data   # regenerate the index
python3 scripts/validate.py data      # schema + script checks
python3 -m unittest discover tests    # the test suite
```

Style: **tabs** for indentation, keep lines readable. The
validator is the source of truth — if it passes, your data
fits the schema.

---

## 1. Correct a phrase

Found a translation, respelling, or note that's wrong or
unnatural? You don't need to touch any code.

**Easiest:** on the site, tap **"suggest a fix"** under the
entry. It opens a GitHub issue with the language and phrase
already filled in — just describe the correct version and
submit.

You can also open a [correction
issue](https://github.com/aryakaul/hello-world/issues/new?template=correct-entry.yml)
directly, or edit the JSON yourself and open a pull request
(see the file layout in the [README](README.md)).

A maintainer applies the change with credit to you.

## 2. Verify a phrase

Entries drafted by AI show an **"unverified"** badge. If you're
a native or fluent speaker and an entry is correct as written,
confirming it flips that badge to **"verified"**.

On the site, tap **"I speak this — verify it"** under an
unverified entry, or open a [verify
issue](https://github.com/aryakaul/hello-world/issues/new?template=verify-entry.yml).
Tell us the phrase is right and, if you'd like credit, how you
want to be named. A maintainer sets the entry's `status` to
`verified` and records your attribution:

```json
"hello": {
	"native": "Hola",
	"respelling": "OH-lah",
	"status": "verified",
	"verified_by": {"handle": "yourname", "note": "native, Lima"}
}
```

One native speaker's confirmation plus a maintainer merge is
all it takes. The `note` is optional.

## 3. Add your language

Don't see your language? Add it with the scaffolder, which
writes a stub with every phrase ready to fill in:

```bash
python3 scripts/new_language.py <slug> \
	--name "Your Language" --native-name "Endonym"
```

For example, `python3 scripts/new_language.py tagalog --name
Tagalog --native-name "Wikang Tagalog"` creates
`data/languages/tagalog.json`. Then:

1. Fill in `native` (the phrase in its own script) and
   `respelling` (an anglicized pronunciation with the stressed
   syllable in CAPS, e.g. `GRAH-see-ahs`) for each phrase.
   Leave `status` as `"ai"` unless you're a speaker vouching
   for your own entry — then use `"verified"` with a
   `verified_by`.
2. Add a `LANG_SCRIPT` entry for your slug in
   `scripts/validate.py` naming its writing system (e.g.
   `latin`, `cyrillic`, `arabic`). If the script isn't listed
   in `SCRIPT_RANGES` yet, add its Unicode ranges too.
3. List the language in the relevant country files under
   `data/countries/`, ordered by prevalence, each with a
   one-line `guidance` note.
4. Run `build_index.py`, then `validate.py`. The validator
   tells you exactly which fields are still blank.

An optional `slang` layer (a colloquial variant with a
**required** register note) can accompany any entry — see an
existing file like `data/languages/spanish.json` for the
shape.

## 4. Record audio

Recordings live in the repo and play straight from the site —
no upload service, no external requests. One clip per phrase:

```
data/audio/<language-slug>/<phrase-id>.opus
```

Keep clips short (just the phrase), mono, and small (**under
50 KB** — trivial for a second or two of Opus). See
[`data/audio/README.md`](data/audio/README.md) for a one-line
`ffmpeg` recipe that produces a compliant file.

To credit yourself, add an optional
`data/audio/<language-slug>/credits.json`:

```json
{"hello": {"by": "yourname"}}
```

Then regenerate the manifest and validate:

```bash
python3 scripts/build_index.py data
python3 scripts/validate.py data
```

`build_index.py` records your clip in `data/index.json` so the
site knows to show a play button — you don't edit the language
file to add audio. Open a pull request with the clip (and
`credits.json`, if you added one).

---

Thank you. Small courtesies, in someone's own language, go a
long way — and so does helping them land right.
