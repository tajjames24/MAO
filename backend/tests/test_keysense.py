"""KeySense Backend API Tests"""
import pytest
import requests
import os
import io
import struct
import wave
import numpy as np

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def generate_test_wav():
    """Generate a simple sine wave WAV file for testing"""
    sample_rate = 44100
    duration = 3  # seconds
    frequency = 440  # A4

    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    samples = (np.sin(2 * np.pi * frequency * t) * 32767).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())
    buf.seek(0)
    return buf


class TestHealthEndpoints:
    """Health and root endpoint tests"""

    def test_root_api(self):
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert "KeySense" in data["message"]

    def test_library_empty_or_list(self):
        resp = requests.get(f"{BASE_URL}/api/library")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestAnalyzeEndpoint:
    """Audio analysis endpoint tests"""
    _track_id = None

    def test_analyze_wav(self):
        wav_buf = generate_test_wav()
        resp = requests.post(
            f"{BASE_URL}/api/analyze",
            files={"file": ("test_tone.wav", wav_buf, "audio/wav")}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "key" in data
        assert "scale" in data
        assert "bpm" in data
        assert "confidence" in data
        assert "camelot" in data
        assert "compatible_keys" in data
        assert isinstance(data["compatible_keys"], list)
        assert len(data["compatible_keys"]) > 0
        TestAnalyzeEndpoint._track_id = data["id"]

    def test_analyze_invalid_format(self):
        resp = requests.post(
            f"{BASE_URL}/api/analyze",
            files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        )
        assert resp.status_code == 400

    def test_library_has_track_after_analysis(self):
        if not TestAnalyzeEndpoint._track_id:
            pytest.skip("No track_id from analysis test")
        resp = requests.get(f"{BASE_URL}/api/library")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()]
        assert TestAnalyzeEndpoint._track_id in ids

    def test_export_track(self):
        if not TestAnalyzeEndpoint._track_id:
            pytest.skip("No track_id from analysis test")
        resp = requests.get(f"{BASE_URL}/api/export/{TestAnalyzeEndpoint._track_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == TestAnalyzeEndpoint._track_id

    def test_delete_track(self):
        if not TestAnalyzeEndpoint._track_id:
            pytest.skip("No track_id from analysis test")
        resp = requests.delete(f"{BASE_URL}/api/library/{TestAnalyzeEndpoint._track_id}")
        assert resp.status_code == 200
        # Verify deletion
        lib = requests.get(f"{BASE_URL}/api/library").json()
        ids = [t["id"] for t in lib]
        assert TestAnalyzeEndpoint._track_id not in ids

    def test_delete_nonexistent_track(self):
        resp = requests.delete(f"{BASE_URL}/api/library/nonexistent-id-12345")
        assert resp.status_code == 404
