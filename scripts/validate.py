#!/usr/bin/env python3
"""Validate the JSON data files against the site schema."""

import json
import re
import sys
from pathlib import Path

VALID_STATUS = {"ai", "verified"}
ENTRY_REQUIRED = ("native", "respelling", "status")
SLANG_REQUIRED = ("native", "respelling", "note", "status")

SCRIPT_RANGES = {
	"latin": ((0x41, 0x5A), (0x61, 0x7A),
		(0xC0, 0x24F), (0x1E00, 0x1EFF)),
	"devanagari": ((0x900, 0x97F),),
	"bengali": ((0x980, 0x9FF),),
	"gujarati": ((0xA80, 0xAFF),),
	"tamil": ((0xB80, 0xBFF),),
	"telugu": ((0xC00, 0xC7F),),
	"thai": ((0xE00, 0xE7F),),
	"greek": ((0x370, 0x3FF),),
	"cyrillic": ((0x400, 0x4FF),),
	"arabic": ((0x600, 0x6FF), (0x750, 0x77F),
		(0xFB50, 0xFDFF), (0xFE70, 0xFEFF)),
	"ethiopic": ((0x1200, 0x137F), (0x1380, 0x139F),
		(0x2D80, 0x2DDF), (0xAB00, 0xAB2F)),
	"hangul": ((0xAC00, 0xD7AF), (0x1100, 0x11FF),
		(0x3130, 0x318F)),
	"cjk": ((0x4E00, 0x9FFF), (0x3400, 0x4DBF),
		(0x3000, 0x303F), (0xFF00, 0xFFEF)),
	"japanese": ((0x3040, 0x30FF), (0x4E00, 0x9FFF),
		(0x3000, 0x303F), (0xFF00, 0xFFEF)),
	"hebrew": ((0x590, 0x5FF),),
	"khmer": ((0x1780, 0x17FF), (0x19E0, 0x19FF)),
	"sinhala": ((0xD80, 0xDFF),),
	"yoruba": ((0x41, 0x5A), (0x61, 0x7A),
		(0xC0, 0x24F), (0x1E00, 0x1EFF),
		(0x300, 0x36F)),
	"igbo": ((0x41, 0x5A), (0x61, 0x7A),
		(0xC0, 0x24F), (0x1E00, 0x1EFF),
		(0x300, 0x36F)),
	"hausa": ((0x41, 0x5A), (0x61, 0x7A),
		(0xC0, 0x24F), (0x1E00, 0x1EFF),
		(0x250, 0x2AF)),
}

LANG_SCRIPT = {
	"amharic": "ethiopic", "tigrinya": "ethiopic",
	"arabic_egyptian": "arabic", "urdu": "arabic",
	"bengali": "bengali", "gujarati": "gujarati",
	"hindi": "devanagari", "marathi": "devanagari",
	"tamil": "tamil", "telugu": "telugu",
	"thai": "thai", "greek": "greek",
	"hausa": "hausa", "igbo": "igbo",
	"russian": "cyrillic", "korean": "hangul",
	"mandarin": "cjk", "cantonese": "cjk",
	"japanese": "japanese",
	"dutch": "latin", "french": "latin",
	"german": "latin", "indonesian": "latin",
	"italian": "latin", "javanese": "latin",
	"kurdish": "latin", "oromo": "latin",
	"polish": "latin", "portuguese": "latin",
	"spanish": "latin", "swahili": "latin",
	"turkish": "latin", "vietnamese": "latin",
	"afrikaans": "latin", "arabic_moroccan": "arabic",
	"arabic_msa": "arabic", "catalan": "latin",
	"czech": "latin", "hebrew": "hebrew",
	"khmer": "khmer", "malay": "latin",
	"maori": "latin", "nigerian_pidgin": "latin",
	"persian": "arabic", "quechua": "latin",
	"sinhala": "sinhala", "swedish": "latin",
	"swiss_german": "latin", "tagalog": "latin",
	"tok_pisin": "latin", "ukrainian": "cyrillic",
	"yoruba": "yoruba", "zulu": "latin",
}


def _check_script(where, slug, text, errors):
	script = LANG_SCRIPT.get(slug)
	if script is None:
		errors.append(
			f"{where}: no script mapping for"
			f" '{slug}' (add to LANG_SCRIPT)")
		return
	ranges = SCRIPT_RANGES[script] + (
		(0x20, 0x7E), (0xA0, 0xA1), (0xBF, 0xBF),
		(0x200C, 0x200D), (0x2010, 0x2027))
	for ch in text:
		cp = ord(ch)
		if cp == 0xFFFD or not any(
				lo <= cp <= hi
				for lo, hi in ranges):
			errors.append(
				f"{where}: bad script char"
				f" U+{cp:04X} for '{slug}'")
			return


def _load(path, errors):
	try:
		return json.loads(path.read_text(encoding="utf-8"))
	except (OSError, json.JSONDecodeError) as exc:
		errors.append(f"{path.name}: cannot parse ({exc})")
		return None


def _check_entry(where, entry, errors):
	if not isinstance(entry, dict):
		errors.append(f"{where}: entry is not an object")
		return
	for field in ENTRY_REQUIRED:
		if not entry.get(field):
			errors.append(f"{where}: missing '{field}'")
	status = entry.get("status")
	if status and status not in VALID_STATUS:
		errors.append(f"{where}: bad status {status!r}")
	_check_slang(where, entry, errors)


def _check_slang(where, entry, errors):
	slang = entry.get("slang")
	if slang is None:
		return
	if not isinstance(slang, dict):
		errors.append(f"{where}: slang is not an object")
		return
	for field in SLANG_REQUIRED:
		if not slang.get(field):
			errors.append(
				f"{where}: slang missing '{field}'")
	sstatus = slang.get("status")
	if sstatus and sstatus not in VALID_STATUS:
		errors.append(
			f"{where}: bad slang status {sstatus!r}")


def _check_override(where, entry, errors):
	if not isinstance(entry, dict):
		errors.append(f"{where}: entry is not an object")
		return
	if entry.get("native") or entry.get("respelling"):
		_check_entry(where, entry, errors)
	elif entry.get("slang"):
		_check_slang(where, entry, errors)
	else:
		errors.append(
			f"{where}: override needs native+"
			f"respelling or slang")


def _entry_scripts(where, slug, entry, errors):
	if not isinstance(entry, dict):
		return
	if entry.get("native"):
		_check_script(where, slug, entry["native"], errors)
	slang = entry.get("slang")
	if isinstance(slang, dict) and slang.get("native"):
		_check_script(f"{where}:slang", slug,
			slang["native"], errors)


def _check_languages(data_dir, pid_set, errors):
	names = {}
	native_names = {}
	lang_dir = data_dir / "languages"
	for path in sorted(lang_dir.glob("*.json")):
		lang = _load(path, errors)
		if lang is None:
			continue
		if lang.get("slug") != path.stem:
			errors.append(
				f"{path.name}: slug != filename")
		for field in ("name", "native_name"):
			if not lang.get(field):
				errors.append(
					f"{path.name}: missing '{field}'")
		names[path.stem] = lang.get("name", path.stem)
		native_names[path.stem] = lang.get(
			"native_name", "")
		if lang.get("native_name"):
			_check_script(
				path.name, path.stem,
				lang["native_name"], errors)
		entries = lang.get("entries", {})
		for pid in sorted(pid_set - set(entries)):
			errors.append(
				f"{path.name}: missing phrase '{pid}'")
		for pid, entry in entries.items():
			if pid not in pid_set:
				errors.append(
					f"{path.name}: unknown phrase"
					f" '{pid}'")
				continue
			_check_entry(
				f"{path.name}:{pid}", entry, errors)
			_entry_scripts(
				f"{path.name}:{pid}", path.stem,
				entry, errors)
	return names, native_names


def _check_countries(data_dir, pid_set, lang_names, errors):
	rows = {}
	iso_num_map = {}
	for path in sorted((data_dir / "countries").glob("*.json")):
		country = _load(path, errors)
		if country is None:
			continue
		if country.get("slug") != path.stem:
			errors.append(
				f"{path.name}: slug != filename")
		for field in ("name", "flag", "iso", "continent"):
			if not country.get(field):
				errors.append(
					f"{path.name}: missing '{field}'")
		iso_num = country.get("iso_num")
		if (not isinstance(iso_num, str)
				or not re.fullmatch(
					r"[0-9]{3}", iso_num)):
			errors.append(
				f"{path.name}: iso_num must be a"
				f" 3-digit string")
		else:
			if iso_num in iso_num_map:
				errors.append(
					f"{path.name}: iso_num {iso_num}"
					f" duplicates {iso_num_map[iso_num]}")
			else:
				iso_num_map[iso_num] = path.name
		langs = country.get("languages")
		if not langs:
			errors.append(
				f"{path.name}: no languages listed")
			langs = []
		display = []
		for item in langs:
			slug = item.get("language")
			if slug not in lang_names:
				errors.append(
					f"{path.name}: unknown language"
					f" '{slug}'")
			else:
				display.append(lang_names[slug])
			if not item.get("guidance"):
				errors.append(
					f"{path.name}: '{slug}' missing"
					f" guidance")
			for pid, entry in item.get(
					"overrides", {}).items():
				if pid not in pid_set:
					errors.append(
						f"{path.name}: override"
						f" unknown phrase '{pid}'")
					continue
				_check_override(
					f"{path.name}:override:{pid}",
					entry, errors)
				_entry_scripts(
					f"{path.name}:override:{pid}",
					slug, entry, errors)
		rows[path.stem] = {
			"name": country.get("name"),
			"flag": country.get("flag"),
			"iso_num": country.get("iso_num"),
			"continent": country.get("continent"),
			"languages": display,
		}
	return rows


def _check_index(data_dir, country_rows, lang_names,
		native_names, errors):
	index = _load(data_dir / "index.json", errors)
	if index is None:
		return
	idx_countries = {
		c.get("slug"): c
		for c in index.get("countries", [])}
	for slug in sorted(
			set(country_rows) - set(idx_countries)):
		errors.append(f"index.json: missing country '{slug}'")
	for slug in sorted(
			set(idx_countries) - set(country_rows)):
		errors.append(f"index.json: extra country '{slug}'")
	for slug, row in idx_countries.items():
		want = country_rows.get(slug)
		if want is None:
			continue
		for field in ("name", "flag", "iso_num",
				"continent"):
			if row.get(field) != want[field]:
				errors.append(
					f"index.json: '{slug}' {field}"
					f" mismatch")
		if row.get("languages") != want["languages"]:
			errors.append(
				f"index.json: '{slug}' languages"
				f" mismatch")
	idx_langs = {
		l.get("slug"): (l.get("name"),
			l.get("native_name"))
		for l in index.get("languages", [])}
	want = {
		slug: (lang_names[slug], native_names[slug])
		for slug in lang_names}
	if idx_langs != want:
		errors.append("index.json: languages list mismatch")


def validate(data_dir):
	errors = []
	data_dir = Path(data_dir)
	phrases = _load(data_dir / "phrases.json", errors)
	pid_list = []
	if phrases is not None:
		pid_list = [
			p.get("id")
			for p in phrases.get("phrases", [])]
		if len(pid_list) != len(set(pid_list)):
			errors.append("phrases.json: duplicate ids")
		for p in phrases.get("phrases", []):
			if not p.get("id") or not p.get("english"):
				errors.append(
					"phrases.json: phrase missing"
					" id/english")
	pid_set = set(pid_list)
	lang_names, native_names = _check_languages(
		data_dir, pid_set, errors)
	country_rows = _check_countries(
		data_dir, pid_set, lang_names, errors)
	_check_index(data_dir, country_rows, lang_names,
		native_names, errors)
	return errors


def main():
	data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
	errors = validate(data_dir)
	for msg in errors:
		print(f"ERROR: {msg}")
	if errors:
		print(f"{len(errors)} error(s)")
		return 1
	print("All data files valid.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
