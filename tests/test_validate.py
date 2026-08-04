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


if __name__ == "__main__":
	unittest.main()
