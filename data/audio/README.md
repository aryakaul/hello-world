# Audio clips

Pronunciation recordings, one per phrase, played straight from
the site. Files live here in the repo — no upload service, no
external requests.

## Layout

```
data/audio/<language-slug>/<phrase-id>.opus
data/audio/<language-slug>/credits.json   (optional)
```

- `<language-slug>` matches a file in `data/languages/`.
- `<phrase-id>` matches an id in `data/phrases.json`
  (e.g. `hello`, `thank_you`, `cheers`).
- Allowed extensions: `.opus` or `.ogg` (preferred — best
  quality for the size) and `.mp3` (fallback).

## Rules the validator enforces

- The clip's language and phrase id must both be real.
- Under **50 KB** per clip.
- `credits.json` may only name phrases that actually have a
  clip in the same folder, and each entry needs a `by`.

## Making a compliant clip

Record the phrase (phone voice memo, `arecord`, anything),
then compress to a small mono Opus file with `ffmpeg`:

```bash
ffmpeg -i input.m4a -ac 1 -c:a libopus -b:a 24k \
	data/audio/spanish/hello.opus
```

`-ac 1` makes it mono; `-b:a 24k` is plenty for speech and
keeps a one- to two-second clip well under the size budget.
Trim silence first if the file is close to the limit.

## Crediting yourself (optional)

```json
{
	"hello": {"by": "yourname"},
	"thank_you": {"by": "yourname", "note": "Lima accent"}
}
```

## After adding clips

```bash
python3 scripts/build_index.py data   # writes the audio map
python3 scripts/validate.py data
```

`build_index.py` adds an `audio` map to `data/index.json` so
the site shows a play button wherever a clip exists. You do not
edit the language file to add audio.
