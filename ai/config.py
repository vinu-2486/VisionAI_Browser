from dataclasses import dataclass


@dataclass(slots=True)
class AIConfig:
    default_language: str = 'en'
    supported_languages: tuple[str, ...] = ('en', 'ta')
    stt_model_name: str = 'faster-whisper-small'
    llm_provider: str = 'openai'
    tts_provider: str = 'edge-tts'


config = AIConfig()
