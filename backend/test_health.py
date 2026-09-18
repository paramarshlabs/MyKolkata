import unittest

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


class HealthTest(unittest.TestCase):
    def test_health(self) -> None:
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})


if __name__ == "__main__":
    unittest.main()
