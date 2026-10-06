import unittest
from engine.send_wa_fuad import clean_for_whatsapp, TARGET_PHONE, DAEMON_URL


class TestSendWaFuad(unittest.TestCase):
    def test_target_phone(self):
        self.assertEqual(TARGET_PHONE, "6281224170187")

    def test_clean_for_whatsapp(self):
        raw = """💬 Untuk Mas Fuad
> *"Mas, **iki pesen tes** sing wis dirapikno."*"""
        cleaned = clean_for_whatsapp(raw)
        self.assertNotIn("💬", cleaned)
        self.assertNotIn("**", cleaned)
        self.assertNotIn(">", cleaned)
        self.assertIn("iki pesen tes", cleaned)

    def test_clean_empty(self):
        self.assertEqual(clean_for_whatsapp(""), "")
        self.assertEqual(clean_for_whatsapp(None), "")


if __name__ == "__main__":
    unittest.main()
