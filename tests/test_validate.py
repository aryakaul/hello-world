import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(
	0, str(Path(__file__).resolve().parent.parent / "scripts"))

from validate import validate


def write(path, obj):
	path.parent.mkdir(parents=True, exist_ok=True)
	path.write_text(
		json.dumps(obj, ensure_ascii=False), encoding="utf-8")


def make_valid(root):
	write(root / "phrases.json", {"phrases": [
		{"id": "hello", "english": "Hello"},
		{"id": "thank_you", "english": "Thank you"},
	]})
	write(root / "languages" / "spanish.json", {
		"slug": "spanish", "name": "Spanish",
		"native_name": "Español",
		"entries": {
			"hello": {"native": "Hola",
				"respelling": "OH-lah", "status": "ai"},
			"thank_you": {"native": "Gracias",
				"respelling": "GRAH-see-ahs",
				"status": "ai"},
		}})
	write(root / "countries" / "mexico.json", {
		"slug": "mexico", "name": "Mexico", "flag": "🇲🇽",
		"iso": "MX", "iso_num": "484", "continent": "North America",
		"languages": [{"language": "spanish",
			"guidance": "Official; use everywhere."}]})
	write(root / "index.json", {
		"countries": [{"slug": "mexico", "name": "Mexico",
			"flag": "🇲🇽", "iso_num": "484",
			"continent": "North America",
			"languages": ["Spanish"]}],
		"languages": [
			{"slug": "spanish", "name": "Spanish",
				"native_name": "Español"}]})


class ValidateTests(unittest.TestCase):
	def setUp(self):
		self.tmp = tempfile.TemporaryDirectory()
		self.root = Path(self.tmp.name)
		make_valid(self.root)

	def tearDown(self):
		self.tmp.cleanup()

	def test_valid_dataset_has_no_errors(self):
		self.assertEqual(validate(self.root), [])

	def test_missing_phrase_in_language(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		del lang["entries"]["thank_you"]
		write(path, lang)
		errs = validate(self.root)
		self.assertTrue(
			any("thank_you" in e for e in errs))

	def test_bad_status_rejected(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["status"] = "guess"
		write(path, lang)
		self.assertTrue(any(
			"status" in e for e in validate(self.root)))

	def test_country_missing_language_file(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["languages"][0]["language"] = "french"
		write(path, c)
		self.assertTrue(any(
			"french" in e for e in validate(self.root)))

	def test_unknown_override_phrase_id(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["languages"][0]["overrides"] = {
			"nope": {"native": "x", "respelling": "X",
				"status": "ai"}}
		write(path, c)
		self.assertTrue(any(
			"nope" in e for e in validate(self.root)))

	def test_index_country_mismatch(self):
		path = self.root / "index.json"
		idx = json.loads(path.read_text(encoding="utf-8"))
		idx["countries"] = []
		write(path, idx)
		self.assertTrue(len(validate(self.root)) > 0)

	def test_missing_iso_num(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		del c["iso_num"]
		write(path, c)
		self.assertTrue(any(
			"iso_num" in e for e in validate(self.root)))

	def test_alias_duplicate_rejected(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["Mejico", "Mejico"]
		write(path, c)
		self.assertTrue(any(
			"duplicate alias" in e
			for e in validate(self.root)))

	def test_alias_repeating_country_name_rejected(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["mexico"]
		write(path, c)
		self.assertTrue(any(
			"repeats the country name" in e
			for e in validate(self.root)))

	def test_alias_empty_string_rejected(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["  "]
		write(path, c)
		self.assertTrue(any(
			"non-empty string" in e
			for e in validate(self.root)))

	def test_alias_wrong_type_rejected(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = "Mejico"
		write(path, c)
		self.assertTrue(any(
			"non-empty list" in e
			for e in validate(self.root)))

	def test_alias_redundant_after_folding_rejected(self):
		"""Search folds Latin accents, so an unaccented twin
		can never match anything the accented form missed."""
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["Méjico", "Mejico"]
		write(path, c)
		self.assertTrue(any(
			"duplicate alias" in e
			for e in validate(self.root)))

	def test_alias_accent_only_variant_of_name_rejected(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["México"]
		write(path, c)
		self.assertTrue(any(
			"repeats the country name" in e
			for e in validate(self.root)))

	def test_alias_non_latin_script_not_folded(self):
		"""Devanagari marks are load-bearing, so two distinct
		spellings must not collide the way accents do."""
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["हिन्दी", "हिनदी"]
		write(path, c)
		# Only the redundancy rules are under test here; the
		# index is deliberately left stale, so its own mismatch
		# error is expected and ignored.
		self.assertEqual(
			[e for e in validate(self.root)
				if "duplicate alias" in e
				or "repeats the country name" in e], [])

	def test_index_alias_mismatch(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c["aliases"] = ["Mejico"]
		write(path, c)
		self.assertTrue(any(
			"aliases mismatch" in e
			for e in validate(self.root)))

	def test_aliases_absent_is_valid(self):
		path = self.root / "countries" / "mexico.json"
		c = json.loads(path.read_text(encoding="utf-8"))
		c.pop("aliases", None)
		write(path, c)
		idx = json.loads(
			(self.root / "index.json").read_text(
				encoding="utf-8"))
		for row in idx["countries"]:
			if row["slug"] == "mexico":
				row.pop("aliases", None)
		write(self.root / "index.json", idx)
		self.assertEqual([], validate(self.root))

	def test_index_language_native_name_mismatch(self):
		path = self.root / "index.json"
		idx = json.loads(path.read_text(encoding="utf-8"))
		idx["languages"][0]["native_name"] = "Wrong"
		write(path, idx)
		self.assertTrue(any(
			"languages list mismatch" in e
			for e in validate(self.root)))

	def test_corrupt_native_script_rejected(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["native"] = "Ho�la"
		write(path, lang)
		self.assertTrue(any(
			"script" in e for e in validate(self.root)))

	def test_slang_missing_note_rejected(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["slang"] = {
			"native": "¡Qué onda!",
			"respelling": "keh OHN-dah",
			"status": "ai"}
		write(path, lang)
		self.assertTrue(any(
			"slang missing 'note'" in e
			for e in validate(self.root)))

	def test_slang_bad_script_rejected(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["slang"] = {
			"native": "Что",
			"respelling": "shto",
			"note": "casual",
			"status": "ai"}
		write(path, lang)
		self.assertTrue(any(
			"slang" in e and "script" in e
			for e in validate(self.root)))

	def _make_verified(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["status"] = "verified"
		lang["entries"]["hello"]["verified_by"] = {
			"handle": "adri", "note": "native, Madrid"}
		write(path, lang)
		return path

	def test_verified_entry_with_attribution_ok(self):
		self._make_verified()
		self.assertEqual(validate(self.root), [])

	def test_verified_entry_without_handle_rejected(self):
		path = self._make_verified()
		lang = json.loads(path.read_text(encoding="utf-8"))
		del lang["entries"]["hello"]["verified_by"]
		write(path, lang)
		self.assertTrue(any(
			"verified_by" in e for e in validate(self.root)))

	def test_verified_entry_empty_handle_rejected(self):
		path = self._make_verified()
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["verified_by"] = {
			"handle": ""}
		write(path, lang)
		self.assertTrue(any(
			"verified_by" in e for e in validate(self.root)))

	def test_ai_entry_with_verified_by_rejected(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["verified_by"] = {
			"handle": "adri"}
		write(path, lang)
		self.assertTrue(any(
			"verified_by" in e for e in validate(self.root)))

	def test_verified_slang_requires_attribution(self):
		path = self.root / "languages" / "spanish.json"
		lang = json.loads(path.read_text(encoding="utf-8"))
		lang["entries"]["hello"]["slang"] = {
			"native": "¡Qué onda!",
			"respelling": "keh OHN-dah",
			"note": "casual", "status": "verified"}
		write(path, lang)
		self.assertTrue(any(
			"verified_by" in e for e in validate(self.root)))

	def _add_audio(self, phrase="hello", ext="opus",
			data=b"x" * 100, lang="spanish"):
		path = (self.root / "audio" / lang /
			(phrase + "." + ext))
		path.parent.mkdir(parents=True, exist_ok=True)
		path.write_bytes(data)
		return path

	def _set_index_audio(self, audio):
		path = self.root / "index.json"
		idx = json.loads(path.read_text(encoding="utf-8"))
		idx["audio"] = audio
		write(path, idx)

	def test_audio_in_sync_ok(self):
		self._add_audio()
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus"}}})
		self.assertEqual(validate(self.root), [])

	def test_audio_missing_from_index_rejected(self):
		self._add_audio()
		self.assertTrue(any(
			"audio" in e for e in validate(self.root)))

	def test_audio_unknown_language_rejected(self):
		self._add_audio(lang="klingon")
		self._set_index_audio({
			"klingon": {"hello": {"ext": "opus"}}})
		self.assertTrue(any(
			"audio" in e and "klingon" in e
			for e in validate(self.root)))

	def test_audio_unknown_phrase_rejected(self):
		self._add_audio(phrase="wat")
		self._set_index_audio({
			"spanish": {"wat": {"ext": "opus"}}})
		self.assertTrue(any(
			"audio" in e and "wat" in e
			for e in validate(self.root)))

	def test_audio_bad_extension_rejected(self):
		self._add_audio(ext="wav")
		self._set_index_audio({
			"spanish": {"hello": {"ext": "wav"}}})
		self.assertTrue(any(
			"audio" in e for e in validate(self.root)))

	def test_audio_oversize_rejected(self):
		self._add_audio(data=b"x" * (200 * 1024))
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus"}}})
		self.assertTrue(any(
			"audio" in e and "large" in e.lower()
			for e in validate(self.root)))

	def test_audio_credits_ok(self):
		self._add_audio()
		write(self.root / "audio" / "spanish" /
			"credits.json", {"hello": {"by": "adri"}})
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus",
				"by": "adri"}}})
		self.assertEqual(validate(self.root), [])

	def test_audio_root_readme_allowed(self):
		self._add_audio()
		(self.root / "audio" / "README.md").write_text(
			"# Audio", encoding="utf-8")
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus"}}})
		self.assertEqual(validate(self.root), [])

	def test_audio_root_stray_file_rejected(self):
		self._add_audio()
		(self.root / "audio" / "notes.txt").write_text(
			"x", encoding="utf-8")
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus"}}})
		self.assertTrue(any(
			"stray" in e for e in validate(self.root)))

	def test_audio_credits_orphan_rejected(self):
		self._add_audio()
		write(self.root / "audio" / "spanish" /
			"credits.json", {"thank_you": {"by": "x"}})
		self._set_index_audio({
			"spanish": {"hello": {"ext": "opus"}}})
		self.assertTrue(any(
			"credits" in e for e in validate(self.root)))


if __name__ == "__main__":
	unittest.main()
