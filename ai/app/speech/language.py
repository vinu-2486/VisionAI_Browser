SUPPORTED_LANGUAGES = {
	"en": {
		"name": "English",
		"speech_code": "en-IN",
	},
	"ta": {
		"name": "Tamil",
		"speech_code": "ta-IN",
	},
}


def normalize_language(language: str) -> str:
	code = language.lower().split("-")[0]
	return code if code in SUPPORTED_LANGUAGES else "en"
