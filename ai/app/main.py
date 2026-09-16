from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, Form, UploadFile

from app.speech.language import SUPPORTED_LANGUAGES, normalize_language
from app.speech.stt import SpeechToTextService


app = FastAPI(title="VisionAI Speech Service", version="1.0.0")
speech_to_text = SpeechToTextService()


@app.get("/health")
def health() -> dict:
	return {"status": "healthy", "languages": list(SUPPORTED_LANGUAGES)}


@app.post("/transcribe")
async def transcribe_audio(
	audio: UploadFile = File(...),
	language: str = Form("en"),
) -> dict:
	suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
	with NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
		temporary.write(await audio.read())
		path = temporary.name
	try:
		result = speech_to_text.transcribe(path, normalize_language(language))
		return {
			"text": result.text,
			"language": result.language,
			"confidence": result.confidence,
		}
	finally:
		Path(path).unlink(missing_ok=True)
