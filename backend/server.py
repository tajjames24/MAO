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

# Krumhansl-Schmuckler key profiles
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE  = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

HARMONIC_MINOR = MINOR_PROFILE.copy()
HARMONIC_MINOR[11] += 2.0
HARMONIC_MINOR[10] -= 1.0

MELODIC_MINOR = MINOR_PROFILE.copy()
MELODIC_MINOR[9]  += 1.5
MELODIC_MINOR[11] += 2.0
MELODIC_MINOR[8]  -= 0.5
MELODIC_MINOR[10] -= 0.5

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

def detect_key_and_scale(chroma_mean: np.ndarray):
    profiles = {
        'Major':         MAJOR_PROFILE,
        'Minor':         MINOR_PROFILE,
        'Harmonic Minor': HARMONIC_MINOR,
        'Melodic Minor':  MELODIC_MINOR,
    }
    best_corr, best_key, best_scale = -np.inf, 0, 'Major'
    for scale_name, profile in profiles.items():
        for i in range(12):
            corr = np.corrcoef(chroma_mean, np.roll(profile, i))[0, 1]
            if not np.isnan(corr) and corr > best_corr:
                best_corr, best_key, best_scale = corr, i, scale_name
    confidence = int(min(100, max(0, (best_corr + 1) / 2 * 100)))
    return best_key, best_scale, confidence


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

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    duration = float(librosa.get_duration(y=y, sr=sr))

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, bins_per_octave=36)
    chroma_mean = np.mean(chroma, axis=1)

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

ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.m4a'}


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
