# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — travellers preparing.** Someone who expects to meet
speakers of a language and wants to arrive able to greet, thank, and
compliment them in it. They look this up **beforehand** — planning at
home, or in transit shortly before: hotel, plane, taxi. They are not
under time pressure and no one is waiting on them, so they read,
browse, and compare at leisure.

**This is deliberately not an in-the-moment tool** (ruling
2026-08-09). There is no stranger standing there, so the product owes
nothing to a "phone held toward a person" scenario: no teleprompter or
enlarged phrase view, no hand-over mode, no race from pocket to
pronunciation. Design work must not reintroduce that framing — an
earlier version of this record and of `AGENT_PROJECT.md` asserted it,
and it generated wrong conclusions.

The job is "learn a few of these well enough to use later," not
"retrieve one right now."

**Secondary — native-speaker contributors** (confirmed 2026-08-08).
Speakers of a covered language who correct a wrong entry, verify an AI
draft, add a missing language, or record audio. Every contribution act
is GitHub-native: issues, PRs, and scaffolder scripts, no backend and
no accounts of our own. Their entry points are real and must work, but
they stay unobtrusive — contribution never competes with the lookup
path for the primary user's attention.

## Product Purpose

A phone-first reference for courteous phrases across the world's
languages, read before you need them. It exists because a phrasebook
asks you to carry it and a translation app asks you to trust it, and
neither lets you browse what a country actually speaks and decide which
few phrases are worth arriving with.

Success is a traveller who arrives with two or three phrases they can
use, and who understood which language to use them in and with whom.
Secondary success is the data getting truer over time as native
speakers correct what AI drafted.

## Positioning

Three things a neighboring product could not truthfully copy without
becoming this one:

- **Country-first, not language-first.** The user knows where they are
  going, not which languages are spoken there. Search a country, get its
  languages ordered by prevalence with one-line usage guidance
  ("official; use everywhere"), then phrase tables. A globe serves the
  same lookup by browse rather than by name — and browsing is the
  primary mode, not a detour.
- **Pronunciation optimized for saying, not for linguistics.**
  Anglicized respelling with stressed syllables capitalized ("Gracias"
  → GRAH-see-ahs), native script alongside. Deliberately not IPA.
- **Provenance stated rather than implied.** Every entry declares
  whether a human verified it. The product's honesty about what it does
  not yet know is a feature, not a disclaimer.

## Operating Context

- Read at leisure, most often on a phone, sometimes on a laptop while
  planning. Unhurried: reading, comparing, and scrolling are normal, and
  long pages are acceptable if they stay navigable.
- Makes no external requests at runtime, so nothing is tracked and
  nothing breaks when a CDN does. It is **not** installable and does not
  survive a cold load without a connection; offline resilience is a
  nice-to-have, not a promise the product currently makes.
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
  **Per-entry, always** (ruling 2026-08-09): the badge sits on every
  row, including when every entry on the page is a draft. A design pass
  once replaced the repeated badges with a single page-level statement
  and the user reverted it. Repetition here is the point — the status
  belongs to the entry, not to the page. Do not propose collapsing,
  deduplicating, or summarising these badges again.

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

1. **Browsing is the job.** The reader has time and is deciding what to
   learn, not retrieving one thing under pressure. Navigability,
   comparison, and orientation across a lot of content matter more than
   shaving seconds off a lookup.
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
   tracking, no build, no framework, no runtime network calls. These
   constraints are product features, not limitations to engineer
   around.

## Accessibility & Inclusion

No formal external standard is adopted (decided 2026-08-08). The
practical commitments already proven in the code stand as the bar:
mobile-first layout, a 44px minimum on every interactive element, all
text at 4.5:1 or better and interactive borders at 3:1, a visible focus
ring on every control, a dedicated `role="status"` region announcing
route changes (not a live region wrapping the whole app), `dir` derived
from the text so RTL scripts render correctly, and vendored font subsets
plus per-language Unicode script-range validation so no covered script
renders as tofu on any device.

**Ruled out 2026-08-09: per-language `lang` attributes.** Native-script
content carries no `lang`, so a screen reader applies an English voice
to it. Doing this properly needs a BCP-47 code per language in the data
schema — a slug cannot be converted to a code by rule (`swiss_german`
is `gsw`, not `de-CH`; `northern_thai` is `nod`; `punjabi` is `pa-Arab`
because this data is Shahmukhi) — so it means 68 hand-researched codes
plus validation plus a new required field in the contributor
scaffolder. The user declined the work. This is a deliberate decision,
not an oversight: do not re-raise it as a finding.
