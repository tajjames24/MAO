import os
import uuid
import tempfile
import logging
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
from typing import List

import librosa
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Music Theory Constants ────────────────────────────────────────────────

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
NOTE_DISPLAY = {
    'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'Eb', 'E': 'E',
    'F': 'F', 'F#': 'F#', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B'
}

# Krumhansl-Schmuckler profiles (C major / C natural minor as root)
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE  = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

# Camelot wheel: note_index -> (major_code, minor_code)
CAMELOT_BY_NOTE = [
    ('8B',  '5A'),  # C
    ('3B',  '12A'), # C#
    ('10B', '7A'),  # D
    ('5B',  '2A'),  # D#/Eb
    ('12B', '9A'),  # E
    ('7B',  '4A'),  # F
    ('2B',  '11A'), # F#
    ('9B',  '6A'),  # G
    ('4B',  '1A'),  # G#/Ab
    ('11B', '8A'),  # A
    ('6B',  '3A'),  # A#/Bb
    ('1B',  '10A'), # B
]

CAMELOT_REVERSE = {
    '8B': (0, 'Major'),  '3B': (1, 'Major'),  '10B': (2, 'Major'),
    '5B': (3, 'Major'),  '12B': (4, 'Major'), '7B':  (5, 'Major'),
    '2B': (6, 'Major'),  '9B': (7, 'Major'),  '4B':  (8, 'Major'),
    '11B': (9, 'Major'), '6B': (10, 'Major'), '1B':  (11, 'Major'),
    '5A': (0, 'Minor'),  '12A': (1, 'Minor'), '7A':  (2, 'Minor'),
    '2A': (3, 'Minor'),  '9A': (4, 'Minor'),  '4A':  (5, 'Minor'),
    '11A': (6, 'Minor'), '6A': (7, 'Minor'),  '1A':  (8, 'Minor'),
    '8A': (9, 'Minor'),  '3A': (10, 'Minor'), '10A': (11, 'Minor'),
}

# ── Analysis Functions ────────────────────────────────────────────────────

def _correlate(chroma: np.ndarray, profile: np.ndarray) -> float:
    """Pearson correlation, returns -1 on degenerate input."""
    c = np.corrcoef(chroma, profile)[0, 1]
    return float(c) if not np.isnan(c) else -1.0


def detect_key_and_scale(chroma_mean: np.ndarray):
    """
    Two-stage detection:
      Stage 1 – find root note + major/minor using KS profiles only.
      Stage 2 – if minor, distinguish Natural / Harmonic / Melodic
                by inspecting the b6 vs nat6 and b7 vs nat7 energies.
    """
    # Stage 1: standard KS — 24 hypotheses (2 modes × 12 keys)
    best_corr, best_key, best_is_major = -np.inf, 0, True
    corrs = []
    for i in range(12):
        r_maj = _correlate(chroma_mean, np.roll(MAJOR_PROFILE, i))
        r_min = _correlate(chroma_mean, np.roll(MINOR_PROFILE, i))
        corrs += [r_maj, r_min]
        if r_maj > best_corr:
            best_corr, best_key, best_is_major = r_maj, i, True
        if r_min > best_corr:
            best_corr, best_key, best_is_major = r_min, i, False

    # Confidence: gap between best and second-best, mapped to 0-100
    sorted_corrs = sorted(corrs, reverse=True)
    gap = sorted_corrs[0] - sorted_corrs[1]
    confidence = int(min(99, max(30, 50 + gap * 200)))

    # Stage 2: minor variant
    if best_is_major:
        scale = 'Major'
    else:
        scale = _minor_variant(chroma_mean, best_key)

    return best_key, scale, confidence


def _minor_variant(chroma_mean: np.ndarray, key_idx: int) -> str:
    """Determine Natural / Harmonic / Melodic Minor from scale-degree energy."""
    # Rotate so the root is at index 0
    rot = np.roll(chroma_mean, -key_idx)
    total = rot.sum()
    if total < 1e-6:
        return 'Minor'
    rot = rot / total

    # Degree indices relative to root (chromatic semitones)
    b6  = rot[8]   # b6 — present in Natural + Harmonic minor
    n6  = rot[9]   # natural 6 — raised in Melodic minor
    b7  = rot[10]  # b7 — present in Natural minor
    n7  = rot[11]  # natural 7 (leading tone) — raised in Harmonic + Melodic minor

    if n6 > b6 and n7 > b7:
        return 'Melodic Minor'
    if n7 > b7:
        return 'Harmonic Minor'
    return 'Minor'


def get_camelot_code(note_idx: int, scale_type: str) -> str:
    codes = CAMELOT_BY_NOTE[note_idx]
    return codes[0] if scale_type == 'Major' else codes[1]


def get_compatible_keys(note_idx: int, scale_type: str) -> list:
    camelot = get_camelot_code(note_idx, scale_type)
    num, letter = int(camelot[:-1]), camelot[-1]
    codes = [
        f"{num}{'A' if letter == 'B' else 'B'}",
        f"{12 if num == 1 else num - 1}{letter}",
        f"{1 if num == 12 else num + 1}{letter}",
    ]
    result = []
    for code in codes:
        if code in CAMELOT_REVERSE:
            n_idx, s_type = CAMELOT_REVERSE[code]
            note = NOTE_NAMES[n_idx]
            disp = NOTE_DISPLAY.get(note, note)
            result.append({'code': code, 'key': disp, 'scale': s_type, 'display': f"{disp} {s_type}"})
    return result


async def analyze_audio_file(file_path: str, filename: str) -> dict:
    logger.info(f"Analyzing: {filename}")
    y, sr = librosa.load(file_path, mono=True, duration=180)

    # BPM on full signal (needs transients)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    duration = float(librosa.get_duration(y=y, sr=sr))

    # ── Harmonic / Percussive Source Separation ────────────────────────
    # Remove drums/transients before pitch analysis — major accuracy boost
    try:
        y_harmonic, _ = librosa.effects.hpss(y, margin=3.0)
        # If HPSS produces near-silence (e.g. pure tone), fall back
        if np.max(np.abs(y_harmonic)) < 1e-8:
            y_harmonic = y
    except Exception as e:
        logger.warning(f"HPSS failed ({e}), using original signal")
        y_harmonic = y

    # ── Dual chroma for robustness ─────────────────────────────────────
    hop = 512
    try:
        cens = librosa.feature.chroma_cens(y=y_harmonic, sr=sr, hop_length=hop)
        cqt  = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=hop,
                                           bins_per_octave=36)
        raw_chroma = 0.6 * np.mean(cens, axis=1) + 0.4 * np.mean(cqt, axis=1)
    except Exception as e:
        logger.warning(f"CENS/CQT failed ({e}), falling back to STFT chroma")
        chroma = librosa.feature.chroma_stft(y=y_harmonic, sr=sr, hop_length=hop)
        raw_chroma = np.mean(chroma, axis=1)

    # Cube-root compression: prevents a single dominant melody note from
    # hijacking the correlation (e.g. b6 in minor key mistaken for tonic).
    # Preserves relative pitch-class importance while equalising dynamics.
    chroma_mean = np.cbrt(raw_chroma)

    key_idx, scale_type, confidence = detect_key_and_scale(chroma_mean)
    note = NOTE_NAMES[key_idx]
    display_note = NOTE_DISPLAY.get(note, note)
    camelot = get_camelot_code(key_idx, scale_type)
    compatible = get_compatible_keys(key_idx, scale_type)

    return {
        'id': str(uuid.uuid4()),
        'filename': filename,
        'key': display_note,
        'scale': scale_type,
        'bpm': round(bpm, 1),
        'confidence': confidence,
        'duration': round(duration, 2),
        'camelot': camelot,
        'compatible_keys': compatible,
        'analyzed_at': datetime.now(timezone.utc).isoformat(),
    }

# ── Models ────────────────────────────────────────────────────────────────

class TrackAnalysis(BaseModel):
    id: str
    filename: str
    key: str
    scale: str
    bpm: float
    confidence: int
    duration: float
    camelot: str
    compatible_keys: list
    analyzed_at: str

# ── Routes ────────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.m4a', '.webm', '.ogg'}


@api_router.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    ext = Path(file.filename or '').suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported format. Allowed: mp3, wav, m4a")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await analyze_audio_file(tmp_path, file.filename or 'unknown')
        doc = dict(result)
        await db.tracks.insert_one(doc)
        return result
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@api_router.get("/library", response_model=List[TrackAnalysis])
async def get_library():
    tracks = await db.tracks.find({}, {'_id': 0}).sort('analyzed_at', -1).to_list(100)
    return tracks


@api_router.delete("/library/{track_id}")
async def delete_track(track_id: str):
    result = await db.tracks.delete_one({'id': track_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Track not found")
    return {"success": True}


@api_router.get("/export/{track_id}")
async def export_track(track_id: str):
    track = await db.tracks.find_one({'id': track_id}, {'_id': 0})
    if not track:
        raise HTTPException(404, "Track not found")
    return JSONResponse(
        content=track,
        headers={"Content-Disposition": f"attachment; filename=keysense_{track_id[:8]}.json"}
    )


@api_router.get("/")
async def root():
    return {"message": "KeySense API v1.0"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
