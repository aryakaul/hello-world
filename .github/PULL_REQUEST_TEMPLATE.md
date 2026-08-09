<!--
Thanks for contributing! Delete the lines that don't apply and
check off what you did. See CONTRIBUTING.md for details.
-->

## What this changes

<!-- e.g. "Verify Spanish hello", "Add Tagalog", "Audio for Yoruba thank_you" -->

## Checklist

- [ ] Ran `python3 scripts/build_index.py data` (required if you
      touched `data/audio/` or added a language)
- [ ] Ran `python3 scripts/validate.py data` and it passed
- [ ] Ran `python3 -m unittest discover tests`
- [ ] If flipping an entry to `verified`, I set `verified_by`
      with a handle
- [ ] If adding audio: clip is mono, under 50 KB, at
      `data/audio/<lang>/<phrase>.opus`
- [ ] I'm a native or fluent speaker of any language I verified
