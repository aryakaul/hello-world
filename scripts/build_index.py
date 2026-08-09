#!/usr/bin/env python3
"""Regenerate data/index.json from data files."""

import json
import sys
from pathlib import Path

AUDIO_EXTS = {"opus", "ogg", "mp3"}


def _scan_audio(data_dir):
	"""Build the audio manifest from data/audio/.

	Mirrors validate._check_audio's inclusion rules for valid
	data: {lang_slug: {phrase_id: {"ext", optional "by"}}}.
	"""
	audio_dir = data_dir / "audio"
	audio = {}
	if not audio_dir.is_dir():
		return audio
	for lang_path in sorted(audio_dir.iterdir()):
		if not lang_path.is_dir():
			continue
		clips = {}
		for f in sorted(lang_path.iterdir()):
			if not f.is_file() or f.name == "credits.json":
				continue
			ext = f.suffix.lstrip(".").lower()
			if ext in AUDIO_EXTS:
				clips[f.stem] = {"ext": ext}
		credits = lang_path / "credits.json"
		if credits.is_file():
			data = json.loads(
				credits.read_text(encoding="utf-8"))
			for pid, info in data.items():
				if (pid in clips
						and isinstance(info, dict)
						and info.get("by")):
					clips[pid]["by"] = info["by"]
		if clips:
			audio[lang_path.name] = clips
	return audio


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
	audio = _scan_audio(data_dir)
	if audio:
		index["audio"] = audio
	out = data_dir / "index.json"
	out.write_text(
		json.dumps(index, ensure_ascii=False,
			indent="\t") + "\n",
		encoding="utf-8")
	print(f"wrote {out}")


if __name__ == "__main__":
	build(sys.argv[1] if len(sys.argv) > 1 else "data")
