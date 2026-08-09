"use strict";

const REPO_URL = "https://github.com/aryakaul/hello-world";

const cache = new Map();

let navGen = 0;

async function loadJson(path) {
	if (cache.has(path)) {
		return cache.get(path);
	}
	const res = await fetch(path);
	if (!res.ok) {
		throw new Error("Failed to load " + path);
	}
	const data = await res.json();
	cache.set(path, data);
	return data;
}

function loadIndex() {
	return loadJson("data/index.json");
}

function loadPhrases() {
	return loadJson("data/phrases.json");
}

function loadCountry(slug) {
	return loadJson("data/countries/" + slug + ".json");
}

function loadLanguage(slug) {
	return loadJson("data/languages/" + slug + ".json");
}

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) {
		node.className = className;
	}
	if (text !== undefined) {
		node.textContent = text;
	}
	return node;
}

const RTL_RE = /[֐-׿؀-ۿ܀-ݏݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;

// Direction is read off the text, not off a slug list, so a
// language added by a contributor renders correctly with no
// change here.
function applyDirection(node, text) {
	if (RTL_RE.test(text)) {
		node.setAttribute("dir", "rtl");
	}
	return node;
}

function setTitle(text) {
	document.title = text
		? text + " · hello, world"
		: "hello, world";
}

function announce(text) {
	const status = document.getElementById("route-status");
	if (status) {
		status.textContent = text;
	}
}

// The footer lives outside <main> in the shell so it is a real
// contentinfo landmark and survives route re-renders. Filled
// once; routes no longer append their own copy.
function fillFooter() {
	const footer = document.getElementById("site-footer");
	if (!footer || footer.childElementCount) {
		return;
	}
	footer.append(el("p", null,
		"Every phrase here began as an AI draft." +
		" Native speakers are reviewing them."));
	if (REPO_URL !== "") {
		const p = el("p");
		const link = el("a", null,
			"Spot an error? Help fix it on GitHub");
		link.href = REPO_URL +
			"/blob/main/CONTRIBUTING.md";
		p.append(link);
		footer.append(p);
	}
}

// Flags are decoration next to the name they accompany; left
// unhidden a screen reader reads "flag of India India".
function flag(emoji) {
	const span = el("span", "flag", emoji);
	span.setAttribute("aria-hidden", "true");
	return span;
}

// Drawn, not a glyph: "▾" is a text character that inherits font
// quirks and cannot be rotated cleanly.
function chevron() {
	const NS = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(NS, "svg");
	svg.setAttribute("class", "chevron");
	svg.setAttribute("viewBox", "0 0 12 12");
	svg.setAttribute("width", "12");
	svg.setAttribute("height", "12");
	svg.setAttribute("aria-hidden", "true");
	const path = document.createElementNS(NS, "path");
	path.setAttribute("d", "M2 4.5 L6 8.5 L10 4.5");
	path.setAttribute("fill", "none");
	path.setAttribute("stroke", "currentColor");
	path.setAttribute("stroke-width", "2");
	path.setAttribute("stroke-linecap", "round");
	path.setAttribute("stroke-linejoin", "round");
	svg.append(path);
	return svg;
}

// "Tagalog (Tagalog)" reads as a mistake.
function languageTitle(language) {
	if (!language.native_name
			|| language.native_name === language.name) {
		return language.name;
	}
	return language.name + " (" + language.native_name + ")";
}

function renderNotFound(app, msg) {
	app.replaceChildren();
	const box = el("div", "not-found");
	box.append(el("h1", null, msg || "We don’t have that page"));
	const lead = el("p");
	lead.append(document.createTextNode(
		"It may be a country or language we haven’t" +
		" covered yet. Search from the home page, or "));
	if (REPO_URL !== "") {
		const add = el("a", null, "add the language yourself");
		add.href = REPO_URL +
			"/blob/main/CONTRIBUTING.md#3-add-your-language";
		lead.append(add);
		lead.append(document.createTextNode("."));
	} else {
		lead.append(document.createTextNode(
			"try a different spelling."));
	}
	box.append(lead);
	const home = el("a", "back-link", "← Search from home");
	home.href = "#/";
	box.append(home);
	app.append(box);
	setTitle("Not found");
	announce("Page not found.");
}

// A failed fetch is not a missing page. Telling someone their
// connection dropped that we "haven't covered that yet" sends
// them off to add a language that already exists.
function renderLoadError(app) {
	app.replaceChildren();
	const box = el("div", "not-found");
	box.append(el("h1", null, "We couldn’t load that page"));
	box.append(el("p", null,
		"Something went wrong fetching it — most likely the" +
		" connection. The page itself is fine."));
	const retry = el("button", "retry-btn", "Try again");
	retry.type = "button";
	retry.addEventListener("click", function () {
		route();
	});
	box.append(retry);
	const home = el("a", "back-link", "← Search from home");
	home.href = "#/";
	box.append(home);
	app.append(box);
	setTitle("Couldn’t load");
	announce("Couldn’t load that page. Try again.");
}

// Accents are decoration in Latin, Greek and Cyrillic, so
// "francais" should find Français. They are not decoration in
// Devanagari or Khmer, where stripping the virama rewrites the
// word — so folding is limited to scripts whose base letter says
// it is safe, and every other script is matched byte for byte.
const FOLDABLE_BASE = /[A-Za-zͰ-ϿЀ-ӿ]/;

function foldChar(ch) {
	const decomposed = ch.normalize("NFD");
	if (!FOLDABLE_BASE.test(decomposed[0])) {
		return ch.toLowerCase();
	}
	return decomposed.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

function fold(text) {
	let out = "";
	for (const ch of text) {
		out += foldChar(ch);
	}
	return out;
}

// Folding can change length, so highlighting needs to map a
// position in the folded string back to the original.
function foldWithMap(text) {
	let out = "";
	const map = [];
	let at = 0;
	for (const ch of text) {
		const folded = foldChar(ch);
		for (let i = 0; i < folded.length; i += 1) {
			map.push(at);
		}
		out += folded;
		at += ch.length;
	}
	map.push(text.length);
	return {folded: out, map: map};
}

// Ranked so the fastest path — type a few letters, press
// Enter — cannot land on a country that merely speaks a
// matching language. Lower rank wins.
function matchRank(name, q) {
	const n = fold(name);
	if (n === q) {
		return 0;
	}
	if (n.startsWith(q)) {
		return 1;
	}
	if (n.split(/[\s-]+/).some(function (w) {
		return w.startsWith(q);
	})) {
		return 2;
	}
	if (n.includes(q)) {
		return 3;
	}
	return -1;
}

function highlight(text, q) {
	const frag = document.createDocumentFragment();
	const mapped = foldWithMap(text);
	const at = mapped.folded.indexOf(q);
	if (at === -1) {
		frag.append(document.createTextNode(text));
		return frag;
	}
	const start = mapped.map[at];
	const end = mapped.map[at + q.length];
	frag.append(document.createTextNode(text.slice(0, start)));
	frag.append(el("mark", null, text.slice(start, end)));
	frag.append(document.createTextNode(text.slice(end)));
	return frag;
}

const MAX_RESULTS = 8;

function searchMatches(index, q) {
	const hits = [];
	for (const c of index.countries) {
		let rank = matchRank(c.name, q);
		let why = "";
		// An alias sits just behind the same quality of match
		// on the country's own name, so "korea" still prefers a
		// country actually called Korea if one existed, while
		// "deutschland" and "espana" reach Germany and Spain.
		for (const alias of c.aliases || []) {
			const aliasRank = matchRank(alias, q);
			if (aliasRank === -1) {
				continue;
			}
			if (rank === -1 || aliasRank + 0.25 < rank) {
				rank = aliasRank + 0.25;
				why = alias;
			}
		}
		if (rank !== -1) {
			hits.push({rank: rank, label: c.name,
				flag: c.flag, href: "#/" + c.slug,
				why: why});
			continue;
		}
		const via = c.languages.find(function (l) {
			return matchRank(l, q) !== -1;
		});
		if (via) {
			hits.push({rank: 5, label: c.name,
				flag: c.flag, href: "#/" + c.slug,
				why: "speaks " + via});
		}
	}
	for (const l of index.languages) {
		let rank = matchRank(l.name, q);
		let why = "language";
		if (rank === -1 && l.native_name) {
			rank = matchRank(l.native_name, q);
			why = l.native_name;
		}
		if (rank !== -1) {
			hits.push({rank: rank + 0.5, label: l.name,
				flag: "", href: "#/lang/" + l.slug,
				why: why});
		}
	}
	hits.sort(function (a, b) {
		return a.rank - b.rank ||
			a.label.localeCompare(b.label);
	});
	return hits;
}

async function renderHome(app) {
	const gen = navGen;
	const index = await loadIndex();
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	setTitle("");
	announce("Home. Search countries or languages.");
	const header = el("header", "home-header");
	header.append(el("h1", null, "hello, world"));
	// The surface never said what it was; the first prose a
	// visitor met was the footer's AI-draft caveat. Counts are
	// read from the index so this cannot drift.
	header.append(el("p", "tagline",
		"Say hello, thank you and cheers in the languages of " +
		index.countries.length + " countries — written the way" +
		" they sound."));
	const searchWrap = el("div", "search-wrap");
	const search = el("input", "search");
	search.type = "search";
	search.placeholder =
		"Search countries or languages…";
	search.setAttribute("aria-label",
		"Search countries or languages");
	search.setAttribute("enterkeyhint", "search");
	search.setAttribute("autocomplete", "off");
	search.setAttribute("role", "combobox");
	search.setAttribute("aria-expanded", "false");
	search.setAttribute("aria-controls", "search-listbox");
	search.setAttribute("aria-autocomplete", "list");
	const results = el("div", "search-results");
	results.hidden = true;
	// The listbox holds options and nothing else; status copy
	// is a sibling, since a <p> is not a permitted child of
	// role="listbox".
	const listbox = el("div", "search-listbox");
	listbox.id = "search-listbox";
	listbox.setAttribute("role", "listbox");
	listbox.setAttribute("aria-label", "Search results");
	const resultNote = el("p", "result-empty");
	resultNote.setAttribute("role", "status");
	resultNote.hidden = true;
	results.append(listbox, resultNote);
	searchWrap.append(search, results);
	header.append(searchWrap);
	app.append(header);
	// Early in the DOM so a keyboard user reaches it in a few
	// tabs once it appears, rather than after every link on
	// the page. It is position:fixed, so order costs nothing
	// visually.
	app.append(jumpControl([
		{id: "home-countries", label: "Countries"},
		{id: "home-languages", label: "Languages"}
	]));

	const slot = el("div", "globe-slot");
	app.append(slot);

	const countrySection = el("section", "lang-section");
	countrySection.id = "home-countries";
	countrySection.append(el("h2", null, "Countries"));
	const countryList = el("div", "lang-list");
	const countries = index.countries.slice().sort(
		function (a, b) {
			return a.name.localeCompare(b.name);
		});
	for (const c of countries) {
		const pill = el("a", "lang-pill");
		pill.href = "#/" + c.slug;
		const pillName = el("span", "lang-name");
		pillName.append(flag(c.flag),
			document.createTextNode(" " + c.name));
		pill.append(pillName);
		pill.append(el("span", "pill-sub",
			c.languages.join(", ")));
		countryList.append(pill);
	}
	countrySection.append(countryList);
	app.append(countrySection);

	const langSection = el("section", "lang-section");
	langSection.id = "home-languages";
	langSection.append(el("h2", null, "Languages"));
	const langList = el("div", "lang-list");
	const langs = index.languages.slice().sort(
		function (a, b) {
			return a.name.localeCompare(b.name);
		});
	for (const l of langs) {
		const pill = el("a", "lang-pill");
		pill.href = "#/lang/" + l.slug;
		pill.append(el("span", "lang-name", l.name));
		pill.append(el("span", "lang-native",
			l.native_name));
		langList.append(pill);
	}
	langSection.append(langList);
	if (REPO_URL !== "") {
		const cta = el("p", "add-lang-cta");
		const link = el("a", null,
			"Don’t see your language? Add it →");
		link.href = REPO_URL +
			"/blob/main/CONTRIBUTING.md#3-add-your-language";
		cta.append(link);
		langSection.append(cta);
	}
	app.append(langSection);

	let options = [];
	let active = -1;

	function setActive(next) {
		if (options[active]) {
			options[active].classList.remove("is-active");
			options[active].setAttribute("aria-selected",
				"false");
		}
		active = next;
		const row = options[active];
		if (!row) {
			search.removeAttribute("aria-activedescendant");
			return;
		}
		row.classList.add("is-active");
		row.setAttribute("aria-selected", "true");
		search.setAttribute("aria-activedescendant", row.id);
		row.scrollIntoView({block: "nearest"});
	}

	function closeResults() {
		results.hidden = true;
		resultNote.hidden = true;
		search.setAttribute("aria-expanded", "false");
		search.removeAttribute("aria-activedescendant");
		options = [];
		active = -1;
	}

	// One live region for every search outcome: a visible
	// sentence when there is something to read, an
	// announced-only count otherwise.
	function setNote(text, visible) {
		resultNote.textContent = text;
		resultNote.hidden = false;
		resultNote.classList.toggle("sr-only", !visible);
	}

	function fillResults(q) {
		listbox.replaceChildren();
		options = [];
		active = -1;
		const hits = searchMatches(index, q);
		for (const hit of hits.slice(0, MAX_RESULTS)) {
			const row = el("a", "result-row");
			row.id = "result-" + options.length;
			row.href = hit.href;
			row.setAttribute("role", "option");
			row.setAttribute("aria-selected", "false");
			row.tabIndex = -1;
			if (hit.flag) {
				row.append(flag(hit.flag));
			}
			const name = el("span");
			name.append(highlight(hit.label, q));
			row.append(name);
			if (hit.why) {
				row.append(el("span", "match-why",
					hit.why));
			}
			listbox.append(row);
			options.push(row);
		}
		if (!options.length) {
			// Must clear, not just repoint: the attribute
			// would otherwise reference a removed node.
			search.removeAttribute("aria-activedescendant");
			setNote("No countries or languages match “" +
				search.value.trim() + "”. Try a country" +
				" name, or a language like “Tamil”.", true);
			return;
		}
		if (hits.length > MAX_RESULTS) {
			setNote("Showing the closest " + MAX_RESULTS +
				" of " + hits.length + " matches.", true);
		} else {
			setNote(hits.length === 1
				? "1 result"
				: hits.length + " results", false);
		}
		setActive(0);
	}

	search.addEventListener("input", function () {
		const q = fold(search.value.trim());
		if (q === "") {
			closeResults();
			return;
		}
		fillResults(q);
		results.hidden = false;
		search.setAttribute("aria-expanded", "true");
	});
	search.addEventListener("keydown", function (ev) {
		if (results.hidden || !options.length) {
			if (ev.key === "Escape") {
				closeResults();
			}
			return;
		}
		if (ev.key === "ArrowDown") {
			ev.preventDefault();
			setActive((active + 1) % options.length);
		} else if (ev.key === "ArrowUp") {
			ev.preventDefault();
			setActive((active - 1 + options.length) %
				options.length);
		} else if (ev.key === "Home") {
			ev.preventDefault();
			setActive(0);
		} else if (ev.key === "End") {
			ev.preventDefault();
			setActive(options.length - 1);
		} else if (ev.key === "Enter") {
			ev.preventDefault();
			const row = options[active] || options[0];
			if (row) {
				closeResults();
				row.click();
			}
		} else if (ev.key === "Escape") {
			closeResults();
		}
	});
	// focusout with relatedTarget, not blur+timeout: a
	// keyboard user moving into the list must not have it
	// closed underneath them.
	searchWrap.addEventListener("focusout", function (ev) {
		if (!searchWrap.contains(ev.relatedTarget)) {
			closeResults();
		}
	});

	// Names the way out: the Countries list below is the same
	// set of links, so a failed globe is a degraded page rather
	// than a blocked one.
	function globeFailed() {
		if (gen !== navGen) {
			return;
		}
		const box = el("div", "globe-error");
		box.append(el("p", "globe-hint",
			"The globe didn’t load. Every country is in the" +
			" list below."));
		const again = el("button", "retry-btn", "Try again");
		again.type = "button";
		again.addEventListener("click", function () {
			slot.replaceChildren();
			mountGlobe(slot).catch(globeFailed);
		});
		box.append(again);
		slot.replaceChildren(box);
	}
	mountGlobe(slot).catch(globeFailed);
}

// A page-level control for long pages. The sticky h2 already
// answers "which language am I in"; this answers "get me
// somewhere else", which was otherwise impossible below the
// first screen of a 20,000px page.
function jumpControl(entries) {
	const wrap = el("div", "jump");
	const toTop = function () {
		window.scrollTo(0, 0);
		const h1 = document.querySelector("#app h1");
		if (h1) {
			h1.tabIndex = -1;
			h1.focus();
		}
	};

	if (!entries.length) {
		const only = el("button", "jump-toggle", "Back to top");
		only.type = "button";
		only.addEventListener("click", toTop);
		wrap.append(only);
	} else {
		const toggle = el("button", "jump-toggle", "Jump to…");
		toggle.type = "button";
		toggle.setAttribute("aria-expanded", "false");
		toggle.setAttribute("aria-controls", "jump-panel");
		const panel = el("div", "jump-panel");
		panel.id = "jump-panel";
		panel.hidden = true;
		const list = el("ul", "jump-list");

		const close = function (refocus) {
			panel.hidden = true;
			toggle.setAttribute("aria-expanded", "false");
			if (refocus) {
				toggle.focus();
			}
		};
		const addItem = function (label, run) {
			const li = el("li");
			const btn = el("button", null, label);
			btn.type = "button";
			btn.addEventListener("click", function () {
				close(false);
				run();
			});
			li.append(btn);
			list.append(li);
		};

		addItem("Back to top", toTop);
		for (const entry of entries) {
			addItem(entry.label, function () {
				const target = document.getElementById(
					entry.id);
				if (!target) {
					return;
				}
				target.scrollIntoView({block: "start"});
				// Jumping to a section the reader collapsed
				// would land them on a bare heading, so open
				// it on the way in.
				const toggle = target.querySelector(
					".section-toggle");
				if (toggle) {
					if (toggle.getAttribute(
							"aria-expanded") === "false") {
						toggle.click();
					}
					toggle.focus();
					return;
				}
				const head = target.querySelector("h2");
				if (head) {
					head.tabIndex = -1;
					head.focus();
				}
			});
		}
		panel.append(list);
		toggle.addEventListener("click", function () {
			const open = panel.hidden;
			panel.hidden = !open;
			toggle.setAttribute("aria-expanded",
				open ? "true" : "false");
			if (open) {
				const first = panel.querySelector("button");
				if (first) {
					first.focus();
				}
			}
		});
		wrap.addEventListener("keydown", function (ev) {
			if (ev.key === "Escape" && !panel.hidden) {
				close(true);
			}
		});
		document.addEventListener("pointerdown",
			function (ev) {
				if (!wrap.isConnected) {
					return;
				}
				if (!panel.hidden
						&& !wrap.contains(ev.target)) {
					close(false);
				}
			});
		wrap.append(panel, toggle);
	}

	// Listener removes itself once this render is replaced, so
	// route changes cannot accumulate handlers.
	let ticking = false;
	const onScroll = function () {
		if (!wrap.isConnected) {
			window.removeEventListener("scroll", onScroll);
			return;
		}
		if (ticking) {
			return;
		}
		ticking = true;
		window.requestAnimationFrame(function () {
			ticking = false;
			const show =
				window.scrollY > window.innerHeight * 1.5;
			// Closing on the way out matters: a display:none
			// element cannot hold focus, so leaving the panel
			// open while the control hides would strand it.
			if (!show && wrap.contains(document.activeElement)) {
				document.activeElement.blur();
			}
			if (!show) {
				const panel = wrap.querySelector(".jump-panel");
				const toggle = wrap.querySelector(".jump-toggle");
				if (panel && !panel.hidden) {
					panel.hidden = true;
					toggle.setAttribute("aria-expanded",
						"false");
				}
			}
			wrap.classList.toggle("is-visible", show);
		});
	};
	window.addEventListener("scroll", onScroll, {passive: true});
	return wrap;
}

// Home lists both directories, so the label names whichever one
// the visitor came from instead of claiming "countries" on a
// language page.
function backLink(kind) {
	const link = el("a", "back-link",
		kind === "languages"
			? "← All languages"
			: "← All countries");
	link.href = "#/";
	return link;
}

function issueUrl(template, params) {
	const p = new URLSearchParams();
	p.set("template", template);
	for (const key of Object.keys(params)) {
		if (params[key]) {
			p.set(key, params[key]);
		}
	}
	return REPO_URL + "/issues/new?" + p.toString();
}

function statusBadge(status, verifiedBy) {
	if (status === "ai") {
		return el("span", "badge", "unverified");
	}
	if (status === "verified" && verifiedBy
			&& verifiedBy.handle) {
		const badge = el("span", "badge badge-verified");
		badge.append(document.createTextNode("verified by "));
		const handle = verifiedBy.handle;
		if (/^[A-Za-z0-9-]+$/.test(handle)) {
			const link = el("a", null, "@" + handle);
			link.href = "https://github.com/" + handle;
			badge.append(link);
		} else {
			badge.append(document.createTextNode(handle));
		}
		if (verifiedBy.note) {
			badge.title = verifiedBy.note;
		}
		return badge;
	}
	return null;
}

function audioButton(langSlug, phraseId, clip) {
	const btn = el("button", "audio-btn", "▶");
	btn.type = "button";
	btn.setAttribute("aria-label",
		"Play pronunciation of " + phraseId + " in "
		+ langSlug);
	if (clip.by) {
		btn.title = "recorded by " + clip.by;
	}
	const src = "data/audio/" + langSlug + "/" + phraseId
		+ "." + clip.ext;
	btn.addEventListener("click", function () {
		new Audio(src).play().catch(function () {});
	});
	return btn;
}

// One quiet affordance per row. The verify path moved to the
// section footer: contribution must not out-shout the phrase
// the visitor came to say.
function entryActions(langSlug, phraseId, current) {
	const actions = el("div", "entry-actions");
	const fix = el("a", "entry-action", "suggest a fix");
	fix.href = issueUrl("correct-entry.yml", {
		language: langSlug, phrase: phraseId,
		current: current});
	fix.setAttribute("aria-label",
		"Suggest a fix for " + phraseId + " in " + langSlug);
	actions.append(fix);
	return actions;
}

function sectionActions(language, linkToLanguage) {
	const p = el("p", "section-actions");
	if (linkToLanguage) {
		const all = el("a", null,
			"See all " + language.name + " phrases →");
		all.href = "#/lang/" + language.slug;
		p.append(all);
	}
	const verify = el("a", null,
		"I speak " + language.name +
		" — help verify these →");
	verify.href = issueUrl("verify-entry.yml", {
		language: language.slug});
	p.append(verify);
	return p;
}

function phraseTable(phrases, language, overrides, audioMap) {
	const table = el("table", "phrase-table");
	const audio = audioMap || {};
	const head = el("thead", "sr-only");
	const headRow = el("tr");
	for (const label of ["English", "In " + language.name,
			"How to say it"]) {
		const th = el("th", null, label);
		th.setAttribute("scope", "col");
		headRow.append(th);
	}
	head.append(headRow);
	table.append(head);
	const body = el("tbody");
	table.append(body);
	for (const phrase of phrases.phrases) {
		const base = language.entries[phrase.id];
		const over = overrides[phrase.id];
		const entry = over && base
			? Object.assign({}, base, over)
			: (over || base);
		if (!entry) {
			continue;
		}
		const row = el("tr");
		const eng = el("td", "english", phrase.english);
		if (phrase.context) {
			eng.append(el("div", "context",
				phrase.context));
		}
		const native = el("td", "native", entry.native);
		applyDirection(native, entry.native);
		const clip = audio[phrase.id];
		if (clip) {
			native.append(audioButton(
				language.slug, phrase.id, clip));
		}
		const resp = el("td", "respelling",
			entry.respelling);
		if (entry.note) {
			resp.append(el("div", "note", entry.note));
		}
		const badge = statusBadge(
			entry.status, entry.verified_by);
		if (badge) {
			resp.append(badge);
		}
		if (entry.slang) {
			const sn = el("div", "slang-native",
				entry.slang.native);
			applyDirection(sn, entry.slang.native);
			native.append(sn);
			const sl = el("div", "slang-resp",
				entry.slang.respelling);
			sl.append(el("span", "chip-slang",
				"slang"));
			const sBadge = statusBadge(
				entry.slang.status,
				entry.slang.verified_by);
			if (sBadge) {
				sl.append(sBadge);
			}
			if (entry.slang.note) {
				sl.append(el("div", "note",
					entry.slang.note));
			}
			resp.append(sl);
		}
		resp.append(entryActions(
			language.slug, phrase.id, entry.native));
		row.append(eng, native, resp);
		body.append(row);
	}
	return table;
}

async function renderCountry(app, slug) {
	const gen = navGen;
	const index = await loadIndex();
	if (gen !== navGen) {
		return;
	}
	const known = index.countries.some(function (c) {
		return c.slug === slug;
	});
	if (!known) {
		renderNotFound(app);
		return;
	}
	// Fetched together, not one after another: the old page
	// stays on screen for the length of the slowest request,
	// so a 7-language country must not cost 7 round trips.
	const [country, phrases] = await Promise.all([
		loadCountry(slug), loadPhrases()]);
	if (gen !== navGen) {
		return;
	}
	const languages = await Promise.all(
		country.languages.map(function (item) {
			return loadLanguage(item.language);
		}));
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	setTitle(country.name);
	announce(country.name + ", " + languages.length +
		(languages.length === 1 ? " language." : " languages."));
	app.append(backLink("countries"));
	app.append(jumpControl(languages.map(function (language) {
		return {id: "lang-" + language.slug,
			label: language.name};
	})));
	const countryTitle = el("h1");
	countryTitle.append(flag(country.flag),
		document.createTextNode(" " + country.name));
	app.append(countryTitle);

	if (languages.length > 1) {
		const navWrap = el("nav", "lang-nav-wrap");
		navWrap.setAttribute("aria-label",
			"Languages on this page");
		const nav = el("ul", "lang-nav");
		// Buttons, not anchors: an in-page "#lang-x" hash
		// would be read by the router as a country slug
		// and render not-found.
		languages.forEach(function (language) {
			const li = el("li");
			const btn = el("button", null, language.name);
			btn.type = "button";
			// Distinguishes it from the h2 link of the same
			// name, which navigates away instead.
			btn.setAttribute("aria-label",
				"Scroll to " + language.name);
			btn.addEventListener("click", function () {
				const target = document.getElementById(
					"lang-" + language.slug);
				if (target) {
					target.scrollIntoView({
						block: "start"});
					const h = target.querySelector("h2 a");
					if (h) {
						h.focus();
					}
				}
			});
			li.append(btn);
			nav.append(li);
		});
		navWrap.append(nav);
		app.append(navWrap);
	}

	country.languages.forEach(function (item, i) {
		const language = languages[i];
		const section = el("section", "language-section");
		section.id = "lang-" + language.slug;
		const heading = el("h2");
		const toggle = el("button", "section-toggle");
		toggle.type = "button";
		toggle.setAttribute("aria-expanded", "true");
		toggle.setAttribute("aria-controls",
			"body-" + language.slug);
		toggle.append(chevron(),
			el("span", null, languageTitle(language)));
		heading.append(toggle);
		section.append(heading);
		// Guidance stays outside the collapsed region: which
		// language to use with whom is exactly what you want
		// while scanning a collapsed country.
		section.append(el("p", "guidance", item.guidance));
		const body = el("div", "language-body");
		body.id = "body-" + language.slug;
		const audioMap = (index.audio
			&& index.audio[item.language]) || {};
		body.append(phraseTable(phrases, language,
			item.overrides || {}, audioMap));
		body.append(sectionActions(language, true));
		section.append(body);
		toggle.addEventListener("click", function () {
			const open = body.hidden;
			body.hidden = !open;
			toggle.setAttribute("aria-expanded",
				open ? "true" : "false");
			section.classList.toggle("is-collapsed", !open);
		});
		app.append(section);
	});
}

async function renderLanguage(app, slug) {
	const gen = navGen;
	const index = await loadIndex();
	if (gen !== navGen) {
		return;
	}
	const known = index.languages.some(function (l) {
		return l.slug === slug;
	});
	if (!known) {
		renderNotFound(app);
		return;
	}
	const [language, phrases] = await Promise.all([
		loadLanguage(slug), loadPhrases()]);
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	setTitle(language.name);
	announce(language.name + " phrases.");
	app.append(backLink("languages"));
	app.append(jumpControl([]));
	app.append(el("h1", null, languageTitle(language)));
	const spoken = index.countries.filter(function (c) {
		return c.languages.indexOf(language.name) !== -1;
	});
	if (spoken.length > 0) {
		const p = el("p", "guidance");
		p.append(document.createTextNode("Spoken in: "));
		spoken.forEach(function (c, i) {
			if (i > 0) {
				p.append(document.createTextNode(
					", "));
			}
			const link = el("a", null);
			link.append(flag(c.flag),
				document.createTextNode(" " + c.name));
			link.href = "#/" + c.slug;
			p.append(link);
		});
		app.append(p);
	}
	const audioMap = (index.audio
		&& index.audio[slug]) || {};
	app.append(phraseTable(phrases, language, {}, audioMap));
	app.append(sectionActions(language, false));
}

async function route() {
	navGen += 1;
	const gen = navGen;
	const hash = location.hash.replace(/^#\/?/, "");
	const app = document.getElementById("app");
	fillFooter();
	// Only if the fetch is slow enough to notice, so a warm
	// cache never flashes a placeholder.
	const slow = setTimeout(function () {
		if (gen === navGen) {
			app.replaceChildren(
				el("p", "loading", "Loading…"));
			announce("Loading…");
		}
	}, 150);
	try {
		if (hash === "") {
			await renderHome(app);
		} else if (hash.startsWith("lang/")) {
			await renderLanguage(app, hash.slice(5));
		} else {
			await renderCountry(app, hash);
		}
	} catch (err) {
		if (gen === navGen) {
			renderLoadError(app);
		}
	} finally {
		clearTimeout(slow);
	}
	if (gen === navGen) {
		window.scrollTo(0, 0);
	}
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
