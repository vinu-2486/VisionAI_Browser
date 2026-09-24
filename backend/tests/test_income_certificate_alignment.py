import unittest

from app.services.ai_service import AIService
from app.services.forms_service import get_required_fields
from app.services.validation_service import validate_field


class IncomeCertificateAlignmentTests(unittest.TestCase):
    def test_backend_fields_match_frontend_contract(self):
        required = get_required_fields("income_certificate")
        self.assertNotIn("age", required)
        self.assertTrue(
            {
                "fullName",
                "mobile",
                "email",
                "state",
                "city",
                "dateOfBirth",
                "aadhaar",
            }.issubset(required)
        )

    def test_deterministic_validation_rejects_bad_mobile(self):
        self.assertTrue(validate_field("mobile", "98765"))
        self.assertFalse(validate_field("mobile", "9876543210"))

    def test_ai_fails_closed_without_backend_key(self):
        result = AIService().interpret(
            "income_certificate",
            "en",
            "fullName",
            {},
            "My name is Vinu Priya",
            [],
        )
        self.assertEqual(result.intent, "unknown")
        self.assertTrue(result.needs_clarification)


if __name__ == "__main__":
    unittest.main()
