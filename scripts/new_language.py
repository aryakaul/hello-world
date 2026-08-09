#!/usr/bin/env python3
"""Scaffold a new language file with every phrase stubbed.

Usage:
	python3 scripts/new_language.py <slug> [--name NAME] \\
		[--native-name NATIVE] [--data DIR]

Produces data/languages/<slug>.json ready to fill in. Native
and respelling are left blank on purpose: run validate.py and
it lists exactly which fields still need a native speaker's
words. See CONTRIBUTING.md for the full walkthrough.
"""

import argparse
import json
import re
import sys
from pathlib import Path

SLUG_RE = re.compile(r"[a-z0-9_]+")


def _phrase_ids(data_dir):
	phrases = json.loads(
		(data_dir / "phrases.json").read_text(
			encoding="utf-8"))
	return [p["id"] for p in phrases["phrases"]]


def scaffold(data_dir, slug, name=None, native_name=None):
	"""Write a stub language file and return its path.

	Raises FileExistsError if the file already exists.
	"""
	data_dir = Path(data_dir)
	if not SLUG_RE.fullmatch(slug):
		raise ValueError(
			"slug must be lowercase a-z, 0-9, underscore")
	out = data_dir / "languages" / (slug + ".json")
	if out.exists():
		raise FileExistsError(str(out))
	entries = {
		pid: {"native": "", "respelling": "", "status": "ai"}
		for pid in _phrase_ids(data_dir)}
	lang = {
		"slug": slug,
		"name": name or slug.replace("_", " ").title(),
		"native_name": native_name or "",
		"entries": entries,
	}
	out.parent.mkdir(parents=True, exist_ok=True)
	out.write_text(
		json.dumps(lang, ensure_ascii=False, indent="\t")
		+ "\n",
		encoding="utf-8")
	return out


def _next_steps(slug, out):
	return "\n".join([
		f"Created {out}",
		"",
		"Next steps:",
		f"  1. Fill in native + respelling for every phrase"
		f" (blank fields are flagged by validate.py).",
		f"  2. Set \"native_name\" if you left it blank.",
		f"  3. Add a LANG_SCRIPT entry for '{slug}' in"
		f" scripts/validate.py (pick its writing system).",
		f"  4. List '{slug}' in the relevant"
		f" data/countries/<country>.json.",
		"  5. python3 scripts/build_index.py data",
		"  6. python3 scripts/validate.py data",
	])


def main(argv=None):
	parser = argparse.ArgumentParser(
		description="Scaffold a new language file.")
	parser.add_argument("slug", help="lang slug, e.g. tagalog")
	parser.add_argument("--name", help="English display name")
	parser.add_argument(
		"--native-name", help="endonym, e.g. Español")
	parser.add_argument("--data", default="data")
	args = parser.parse_args(argv)
	try:
		out = scaffold(
			args.data, args.slug, args.name,
			args.native_name)
	except FileExistsError as exc:
		print(f"error: {exc} already exists", file=sys.stderr)
		return 1
	except ValueError as exc:
		print(f"error: {exc}", file=sys.stderr)
		return 1
	print(_next_steps(args.slug, out))
	return 0


if __name__ == "__main__":
	sys.exit(main())
