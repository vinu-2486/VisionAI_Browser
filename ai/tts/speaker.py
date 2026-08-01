class TextToSpeechService:
    def speak(self, text: str, language: str = 'en') -> dict[str, str]:
        return {
            'language': language,
            'message': text,
            'provider': 'edge-tts',
        }
