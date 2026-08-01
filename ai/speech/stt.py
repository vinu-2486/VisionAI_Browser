from dataclasses import dataclass


@dataclass(slots=True)
class SpeechResult:
    text: str
    language: str = 'en'
    confidence: float = 1.0


class SpeechToTextService:
    def transcribe(self, audio_path: str, language: str = 'en') -> SpeechResult:
        return SpeechResult(
            text=f'Placeholder transcription for {audio_path}',
            language=language,
            confidence=0.5,
        )
