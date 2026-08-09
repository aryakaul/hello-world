# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — travelers and conversers.** Someone standing in a country,
or in conversation with a native speaker, who wants to greet, thank, or
compliment that person in their own language. The defining situation is
physical: a phone held out in front of another human being, seconds
available, one hand, possibly no signal. The job is not "learn a
language" — it is "get from pocket to a phrase I can say out loud,
right now, without embarrassing myself."

**Secondary — native-speaker contributors** (confirmed 2026-08-08).
Speakers of a covered language who correct a wrong entry, verify an AI
draft, add a missing language, or record audio. Every contribution act
is GitHub-native: issues, PRs, and scaffolder scripts, no backend and
no accounts of our own. Their entry points are real and must work, but
they stay unobtrusive — contribution never competes with the lookup
path for the primary user's attention.

## Product Purpose

A phone-first quick reference for courteous phrases across the world's
languages. It exists because phrasebooks and translation apps are too
slow for the moment of need — the user has already made eye contact.

Success is a phrase said out loud, correctly enough to land, in the
seconds before the moment passes. Secondary success is the data getting
truer over time as native speakers correct what AI drafted.

## Positioning

Three things a neighboring product could not truthfully copy without
becoming this one:

- **Country-first, not language-first.** The user knows where they are
  standing, not which languages are spoken there. Search a country, get
  its languages ordered by prevalence with one-line usage guidance
  ("official; use everywhere"), then phrase tables. A globe serves the
  same lookup by browse rather than by name.
- **Pronunciation optimized for saying, not for linguistics.**
  Anglicized respelling with stressed syllables capitalized ("Gracias"
  → GRAH-see-ahs), native script alongside. Deliberately not IPA.
- **Provenance stated rather than implied.** Every entry declares
  whether a human verified it. The product's honesty about what it does
  not yet know is a feature, not a disclaimer.

## Operating Context

- Used one-handed, at arm's length, often outdoors, sometimes offline.
  Works fully offline and makes no external requests at runtime.
- Static site served from the repo root via GitHub Pages; hash routes
  (`#/`, `#/<country-slug>`, `#/lang/<language-slug>`, not-found).
- Data authored as JSON in the repo. Languages own phrases; countries
  reference languages with optional field-merge overrides for regional
  variants (Argentine vos, Quebec French, Mexican slang).
- Contribution runs through GitHub issue templates, a PR template, a
  `new_language.py` scaffolder, and CI that validates data and audio on
  every push.

## Capabilities and Constraints

**Current coverage (verified 2026-08-08):** 49 countries, 68 languages,
17 phrases — 1330 entries.

**Durable invariants** (confirmed by the user 2026-08-08; future work
must not break these):

- **Fixed 17-phrase set,** identical across every language. New-phrase
  suggestions are out of scope.
- **Anglicized respelling with native script; no IPA.**
- **No backend, no build step, no CDN.** Vendored libraries only
  (d3-geo, topojson-client, world-atlas, a Noto Sans Ethiopic subset).
- **Honest provenance.** AI drafts always render "unverified";
  `verified` status always requires a real contributor handle, enforced
  by the validator. Verification and attribution are never fabricated.

**Coverage rule** (institutionalized 2026-08-04): a country lists every
language with ~10%+ national speaker share or major official/regional
status; English is excluded by design. Exclusions are recorded with
reasons, never silent. Spoken languages only — official sign languages
are acknowledged in country guidance, not phrase files.

**Explicitly undecided / open:**

- The official-status language tier (~22 further files) is deferred,
  not rejected.
- The contribution workflow is built on the `contribution-workflow`
  branch and not yet merged.
- The repository is private; going public and enabling Pages is
  pending, so there is no live URL yet.

## Brand Commitments

- Name: **hello-world**. Site title and H1: **"hello, world"**,
  lowercase (chosen 2026-08-01).
- Planned home: `aryakaul.github.io/hello-world`.
- Every page carries a "spot an error? fix it on GitHub" affordance.

## Evidence on Hand

**Real:** the data itself (`data/languages/`, `data/countries/`,
`data/phrases.json`), cross-checked against Google Translate as the
designated benchmark, with rival-form usage analysis for low-resource
languages where GT is treated as a hint rather than an oracle. A full
49-country coverage audit with fetched speaker-share evidence. 169
slang variants, each web-attested against two or more sources, with a
136-URL source audit. A data validator plus 33 unit tests.

**Absences future work must not paper over:**

- **All 1330 entries are `status: "ai"`.** Zero have been verified by a
  native speaker. Nothing may present this data as human-verified.
- **No audio recordings exist** (`data/audio/` holds only its README).
- No users, usage metrics, testimonials, press, or contributors to
  cite. None may be invented or implied.

## Product Principles

1. **The moment is the constraint.** Every decision answers to a person
   holding a phone toward a stranger. Depth that costs speed loses.
2. **Warmth is the point.** The phrase set is courtesies — greetings,
   thanks, compliments, toasts. The product exists to make a small
   human gesture possible, not to teach grammar.
3. **Say what we know and what we don't.** Provenance is surfaced, not
   buried. Uncertainty stated plainly beats confidence we haven't
   earned.
4. **The data gets truer through its speakers.** The AI pass is a
   starting point by design; contribution paths exist so native
   speakers can correct it, and attribution is honest by construction.
5. **Nothing between the user and the phrase.** No accounts, no
   network, no build, no framework. Constraints that keep it instant
   and offline are product features.

## Accessibility & Inclusion

No formal external standard is adopted (decided 2026-08-08). The
practical commitments already proven in the code stand as the bar:
mobile-first layout, large tap targets, phrase tables legible at arm's
length, an `aria-live` app region for route changes, and vendored font
subsets plus per-language Unicode script-range validation so no covered
script renders as tofu on any device.
