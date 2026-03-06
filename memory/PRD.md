# KeySense PRD

## Problem Statement
Create a modern web app (KeySense) that automatically detects the musical key and scale of uploaded audio files using AI-powered chroma feature extraction and FFT analysis.

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async)
- **Audio Processing**: Librosa, NumPy, SciPy
- **Waveform**: WaveSurfer.js v7
- **Upload**: react-dropzone
- **Animations**: Framer Motion + CSS animations

## User Personas
- Musicians wanting to identify the key of a song
- Music producers working with samples
- DJs needing Camelot wheel compatibility for harmonic mixing

## Core Requirements (Static)
1. Drag-and-drop audio upload (MP3, WAV, M4A)
2. Automatic key detection using Krumhansl-Schmuckler profiles
3. Scale detection: Major, Minor, Harmonic Minor, Melodic Minor
4. BPM detection via librosa beat tracker
5. Waveform visualization with play/pause
6. Confidence percentage display
7. Real-time microphone recording and analysis
8. Export results as JSON
9. Camelot wheel display with active/compatible key highlighting
10. Compatible keys display
11. Song library (CRUD)

## What's Been Implemented (Feb 2026)
### Backend (FastAPI)
- `POST /api/analyze` - Upload and analyze audio (returns key, scale, BPM, confidence, camelot, compatible_keys, duration)
- `GET /api/library` - Get all saved tracks from MongoDB
- `DELETE /api/library/{track_id}` - Delete a track
- `GET /api/export/{track_id}` - Download track analysis as JSON
- Krumhansl-Schmuckler key detection algorithm
- 4 scale profiles: Major, Minor, Harmonic Minor, Melodic Minor
- Camelot wheel mapping (all 24 positions)
- Compatible keys algorithm (Camelot adjacency rules)
- FFmpeg installed for MP3/M4A support

### Frontend (React)
- `UploadZone` - Drag-and-drop with react-dropzone, animated waveform background decoration
- `ResultsPanel` - Bento grid with Key, Scale, BPM, Confidence cards
- `CamelotWheel` - SVG-based interactive Camelot wheel (active = orange, compatible = light orange)
- `WaveformViewer` - WaveSurfer.js v7 with play/pause controls
- `SongLibrary` - Slide-in right drawer with past tracks, delete, export, select
- `MicRecorder` - Modal with MediaRecorder API, real-time recording indicator, sends to backend
- Orange (#FF5A1F) primary color scheme
- Manrope headings + Inter body + JetBrains Mono for technical values
- Staggered entrance animations
- Responsive layout (mobile + desktop)

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Audio upload and analysis
- [x] Key/Scale/BPM detection
- [x] Results display
- [x] Camelot wheel
- [x] Song library

### P1 (High Priority - TODO)
- [ ] AI harmony suggestions (compatible chords, scale notes)
- [ ] Beat grid visualization
- [ ] Dark mode toggle

### P2 (Nice to Have - TODO)
- [ ] User accounts / persistent library across devices
- [ ] Batch file analysis
- [ ] Share results link
- [ ] Pitch shift suggestion tool for DJ mixing

## Next Tasks
1. Add AI harmony suggestions using Claude/GPT for chord progressions
2. Add dark mode support
3. Add beat grid visualization
4. Add batch upload support
