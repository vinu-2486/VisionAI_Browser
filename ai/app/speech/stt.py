from dataclasses import dataclass
from pathlib import Path

from .language import normalize_language


@dataclass(slots=True)
class SpeechResult:
    text: str
    language: str = 'en'
    confidence: float = 1.0


class SpeechToTextService:
    def __init__(self, model_size: str = "small") -> None:
        self.model_size = model_size
        self._model = None

    def _load_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            self._model = WhisperModel(
                self.model_size,
                device="cpu",
                compute_type="int8",
            )
        return self._model

    def transcribe(self, audio_path: str, language: str = 'en') -> SpeechResult:
        normalized = normalize_language(language)
        if not Path(audio_path).exists():
            raise FileNotFoundError(audio_path)

        model = self._load_model()
        segments, _ = model.transcribe(
            audio_path,
            language=normalized,
            vad_filter=True,
        )
        collected = list(segments)
        text = " ".join(segment.text.strip() for segment in collected).strip()
        confidence = sum(segment.avg_logprob for segment in collected) / len(collected) if collected else 0.0
        return SpeechResult(text=text, language=normalized, confidence=confidence)
