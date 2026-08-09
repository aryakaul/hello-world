#!/usr/bin/env python3
"""Deep audio checks via ffprobe (CI-only; needs ffmpeg).

Confirms each clip decodes to a single audio stream of an
allowed codec and stays under the duration budget. Path,
extension, and size are already enforced by validate.py, so this
focuses on what only a real decoder can tell us.
"""

import json
import subprocess
import sys
from pathlib import Path

AUDIO_EXTS = {".opus", ".ogg", ".mp3"}
OK_CODECS = {"opus", "vorbis", "mp3"}
MAX_DURATION_S = 8.0


def _probe(path):
	out = subprocess.run(
		["ffprobe", "-v", "error", "-show_streams",
			"-show_format", "-of", "json", str(path)],
		capture_output=True, text=True)
	if out.returncode != 0:
		return None, out.stderr.strip()
	return json.loads(out.stdout), None


def check(data_dir):
	audio_dir = Path(data_dir) / "audio"
	errors = []
	if not audio_dir.is_dir():
		return errors
	for path in sorted(audio_dir.rglob("*")):
		if not path.is_file():
			continue
		if path.suffix.lower() not in AUDIO_EXTS:
			continue
		info, err = _probe(path)
		rel = path.relative_to(audio_dir)
		if info is None:
			errors.append(f"{rel}: ffprobe failed ({err})")
			continue
		streams = [s for s in info.get("streams", [])
			if s.get("codec_type") == "audio"]
		if len(streams) != 1:
			errors.append(
				f"{rel}: expected 1 audio stream,"
				f" found {len(streams)}")
			continue
		codec = streams[0].get("codec_name")
		if codec not in OK_CODECS:
			errors.append(f"{rel}: bad codec '{codec}'")
		dur = float(info.get("format", {}).get(
			"duration", 0) or 0)
		if dur > MAX_DURATION_S:
			errors.append(
				f"{rel}: too long ({dur:.1f}s >"
				f" {MAX_DURATION_S}s)")
	return errors


def main():
	data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
	errors = check(data_dir)
	for msg in errors:
		print(f"ERROR: {msg}")
	if errors:
		print(f"{len(errors)} error(s)")
		return 1
	print("Audio OK.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
