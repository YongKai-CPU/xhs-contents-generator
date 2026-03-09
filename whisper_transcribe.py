#!/usr/bin/env python3
"""
Whisper Transcription Script
Usage: python whisper_transcribe.py <audio_or_video_file>
Output: JSON array of segments with text
"""

import sys
import json
import os

try:
    from faster_whisper import WhisperModel
except ImportError as e:
    print(json.dumps({"error": f"faster-whisper not installed: {str(e)}"}), flush=True)
    sys.exit(1)


def transcribe(file_path, model_size="tiny", language="en"):
    """Transcribe audio/video file using faster-whisper"""

    # Check if file exists
    if not os.path.exists(file_path):
        return json.dumps({"error": f"File not found: {file_path}"})

    # Load model (int8 for CPU efficiency)
    # Note: Status messages now go to stderr to keep stdout clean for JSON only
    print(json.dumps({"status": f"Loading {model_size} model..."}), file=sys.stderr, flush=True)
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}), file=sys.stderr, flush=True)
        raise Exception(f"Failed to load model: {str(e)}")

    # Transcribe (faster-whisper supports video files directly)
    print(json.dumps({"status": f"Transcribing with language: {language}"}), file=sys.stderr, flush=True)
    try:
        # Disable VAD filter for better compatibility
        segments, info = model.transcribe(
            file_path,
            language=language,
            vad_filter=False
        )

        # Collect segments
        result = []
        for segment in segments:
            result.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip()
            })

        # Build result as JSON string
        result_json = json.dumps({
            "language": info.language,
            "duration": info.duration,
            "segments": result
        }, ensure_ascii=False)
        
        # Return JSON string (main code will print it)
        return result_json

    except Exception as e:
        print(json.dumps({"error": f"Transcription failed: {str(e)}"}), file=sys.stderr, flush=True)
        raise Exception(f"Transcription failed: {str(e)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}), flush=True)
        sys.exit(1)

    file_path = sys.argv[1]

    # Print file info for debugging (to stderr)
    print(json.dumps({"status": f"Processing file: {file_path}"}), file=sys.stderr, flush=True)
    print(json.dumps({"status": f"File exists: {os.path.exists(file_path)}"}), file=sys.stderr, flush=True)

    # Try English first (most common), fallback to Chinese
    try:
        result = transcribe(file_path, language="en")
        # ONLY the final result goes to stdout
        print(result, flush=True)
    except Exception as e:
        print(json.dumps({"status": "English failed, trying Chinese..."}), file=sys.stderr, flush=True)
        try:
            result = transcribe(file_path, language="zh")
            # ONLY the final result goes to stdout
            print(result, flush=True)
        except Exception as e2:
            print(json.dumps({"error": f"Both languages failed: {str(e2)}"}), file=sys.stderr, flush=True)
            sys.exit(1)
