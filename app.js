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

function renderFooter() {
	const footer = el("footer", "site-footer");
	footer.append(el("p", null,
		"Pronunciations marked “unverified” were" +
		" AI-generated and await native-speaker review."));
	if (REPO_URL !== "") {
		const p = el("p");
		const link = el("a", null,
			"Spot an error? Help fix it on GitHub");
		link.href = REPO_URL +
			"/blob/main/CONTRIBUTING.md";
		p.append(link);
		footer.append(p);
	}
	return footer;
}

function renderNotFound(app, msg) {
	app.replaceChildren();
	const box = el("div", "not-found");
	box.append(el("p", null, msg || "Page not found."));
	const home = el("a", "back-link", "← Home");
	home.href = "#/";
	box.append(home);
	app.append(box);
}

async function renderHome(app) {
	const gen = navGen;
	const index = await loadIndex();
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	const header = el("header", "home-header");
	header.append(el("h1", null, "hello, world"));
	const searchWrap = el("div", "search-wrap");
	const search = el("input", "search");
	search.type = "search";
	search.placeholder =
		"Search countries or languages…";
	search.setAttribute("aria-label",
		"Search countries or languages");
	const results = el("div", "search-results");
	results.hidden = true;
	searchWrap.append(search, results);
	header.append(searchWrap);
	app.append(header);

	const slot = el("div", "globe-slot");
	app.append(slot);

	const langSection = el("section", "lang-section");
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
	app.append(renderFooter());

	function fillResults(q) {
		results.replaceChildren();
		for (const c of index.countries) {
			const hay = (c.name + " " +
				c.languages.join(" "))
				.toLowerCase();
			if (!hay.includes(q)) {
				continue;
			}
			const row = el("a", "result-row");
			row.href = "#/" + c.slug;
			row.append(el("span", "flag", c.flag));
			row.append(el("span", null, c.name));
			results.append(row);
		}
		for (const l of index.languages) {
			if (!l.name.toLowerCase().includes(q)) {
				continue;
			}
			const row = el("a", "result-row");
			row.href = "#/lang/" + l.slug;
			row.append(el("span", "flag", "🗣"));
			row.append(el("span", null, l.name));
			results.append(row);
		}
		if (!results.children.length) {
			results.append(el("p", "result-empty",
				"No matches."));
		}
	}

	search.addEventListener("input", function () {
		const q = search.value.trim().toLowerCase();
		if (q === "") {
			results.hidden = true;
			return;
		}
		fillResults(q);
		results.hidden = false;
	});
	search.addEventListener("keydown", function (ev) {
		if (ev.key === "Enter" && !results.hidden) {
			const first =
				results.querySelector("a");
			if (first) {
				first.click();
			}
		} else if (ev.key === "Escape") {
			results.hidden = true;
		}
	});
	results.addEventListener("pointerdown",
		function (ev) {
			ev.preventDefault();
		});
	search.addEventListener("blur", function () {
		setTimeout(function () {
			results.hidden = true;
		}, 150);
	});

	mountGlobe(slot).catch(function () {
		if (gen !== navGen) {
			return;
		}
		slot.replaceChildren(el("p", "globe-hint",
			"Globe failed to load."));
	});
}

function backLink() {
	const link = el("a", "back-link", "← All countries");
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

function entryActions(langSlug, phraseId, current, status) {
	const actions = el("div", "entry-actions");
	const fix = el("a", "entry-action", "suggest a fix");
	fix.href = issueUrl("correct-entry.yml", {
		language: langSlug, phrase: phraseId,
		current: current});
	actions.append(fix);
	if (status === "ai") {
		const verify = el("a", "entry-action",
			"I speak this — verify it");
		verify.href = issueUrl("verify-entry.yml", {
			language: langSlug, phrase: phraseId});
		actions.append(verify);
	}
	return actions;
}

function phraseTable(phrases, language, overrides, audioMap) {
	const table = el("table", "phrase-table");
	const audio = audioMap || {};
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
			native.append(el("div", "slang-native",
				entry.slang.native));
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
			language.slug, phrase.id, entry.native,
			entry.status));
		row.append(eng, native, resp);
		table.append(row);
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
	const country = await loadCountry(slug);
	if (gen !== navGen) {
		return;
	}
	const phrases = await loadPhrases();
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	app.append(backLink());
	app.append(el("h1", null,
		country.flag + " " + country.name));
	for (const item of country.languages) {
		const language = await loadLanguage(item.language);
		if (gen !== navGen) {
			return;
		}
		const section = el("section", "language-section");
		const title = language.name +
			" (" + language.native_name + ")";
		const heading = el("h2");
		const link = el("a", null, title);
		link.href = "#/lang/" + language.slug;
		heading.append(link);
		section.append(heading);
		section.append(el("p", "guidance", item.guidance));
		const audioMap = (index.audio
			&& index.audio[item.language]) || {};
		section.append(phraseTable(phrases, language,
			item.overrides || {}, audioMap));
		app.append(section);
	}
	app.append(renderFooter());
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
	const language = await loadLanguage(slug);
	if (gen !== navGen) {
		return;
	}
	const phrases = await loadPhrases();
	if (gen !== navGen) {
		return;
	}
	app.replaceChildren();
	app.append(backLink());
	app.append(el("h1", null, language.name +
		" (" + language.native_name + ")"));
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
			const link = el("a", null,
				c.flag + " " + c.name);
			link.href = "#/" + c.slug;
			p.append(link);
		});
		app.append(p);
	}
	const audioMap = (index.audio
		&& index.audio[slug]) || {};
	app.append(phraseTable(phrases, language, {}, audioMap));
	app.append(renderFooter());
}

async function route() {
	navGen += 1;
	const gen = navGen;
	const hash = location.hash.replace(/^#\/?/, "");
	const app = document.getElementById("app");
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
			renderNotFound(app);
		}
	}
	if (gen === navGen) {
		window.scrollTo(0, 0);
	}
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);
