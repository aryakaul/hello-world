#!/usr/bin/env python3
"""Regenerate data/index.json from data files."""

import json
import sys
from pathlib import Path


def build(data_dir):
	data_dir = Path(data_dir)
	langs = {}
	for path in sorted(
			(data_dir / "languages").glob("*.json")):
		lang = json.loads(
			path.read_text(encoding="utf-8"))
		langs[lang["slug"]] = lang
	countries = []
	for path in sorted(
			(data_dir / "countries").glob("*.json")):
		c = json.loads(
			path.read_text(encoding="utf-8"))
		countries.append({
			"slug": c["slug"], "name": c["name"],
			"flag": c["flag"],
			"iso_num": c["iso_num"],
			"continent": c["continent"],
			"languages": [
				langs[l["language"]]["name"]
				for l in c["languages"]],
		})
	index = {
		"countries": countries,
		"languages": [
			{"slug": s, "name": l["name"],
				"native_name": l["native_name"]}
			for s, l in sorted(langs.items())],
	}
	out = data_dir / "index.json"
	out.write_text(
		json.dumps(index, ensure_ascii=False,
			indent="\t") + "\n",
		encoding="utf-8")
	print(f"wrote {out}")


if __name__ == "__main__":
	build(sys.argv[1] if len(sys.argv) > 1 else "data")
