import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(
	0, str(Path(__file__).resolve().parent.parent / "scripts"))

from new_language import scaffold


class NewLanguageTests(unittest.TestCase):
	def setUp(self):
		self.tmp = tempfile.TemporaryDirectory()
		self.root = Path(self.tmp.name)
		(self.root / "phrases.json").write_text(
			json.dumps({"phrases": [
				{"id": "hello", "english": "Hello"},
				{"id": "thank_you", "english": "Thank you"},
			]}), encoding="utf-8")

	def tearDown(self):
		self.tmp.cleanup()

	def _load(self, slug="tagalog"):
		path = self.root / "languages" / (slug + ".json")
		return json.loads(path.read_text(encoding="utf-8"))

	def test_scaffold_has_all_phrase_ids(self):
		scaffold(self.root, "tagalog")
		lang = self._load()
		self.assertEqual(
			set(lang["entries"]), {"hello", "thank_you"})

	def test_scaffold_slug_and_default_name(self):
		scaffold(self.root, "swiss_german")
		lang = self._load("swiss_german")
		self.assertEqual(lang["slug"], "swiss_german")
		self.assertEqual(lang["name"], "Swiss German")

	def test_scaffold_entries_have_required_keys(self):
		scaffold(self.root, "tagalog")
		for entry in self._load()["entries"].values():
			self.assertEqual(
				set(entry),
				{"native", "respelling", "status"})
			self.assertEqual(entry["status"], "ai")

	def test_scaffold_refuses_overwrite(self):
		scaffold(self.root, "tagalog")
		with self.assertRaises(FileExistsError):
			scaffold(self.root, "tagalog")

	def test_scaffold_rejects_bad_slug(self):
		with self.assertRaises(ValueError):
			scaffold(self.root, "Tag Along!")

	def test_scaffold_custom_names(self):
		scaffold(self.root, "tagalog", name="Tagalog",
			native_name="Wikang Tagalog")
		lang = self._load()
		self.assertEqual(lang["name"], "Tagalog")
		self.assertEqual(
			lang["native_name"], "Wikang Tagalog")

	def test_scaffold_output_is_tab_indented(self):
		scaffold(self.root, "tagalog")
		text = (self.root / "languages" /
			"tagalog.json").read_text(encoding="utf-8")
		self.assertIn("\n\t", text)


if __name__ == "__main__":
	unittest.main()
