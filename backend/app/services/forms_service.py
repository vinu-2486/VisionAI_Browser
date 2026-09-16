import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forms import Application
from app.schemas.forms import ApplicationCreate
from app.schemas.forms import ApplicationUpdate


SERVICE_DEFINITIONS = {
    "income_certificate": {
        "title": "Income Certificate",
        "fields": [
            {
                "name": "fullName",
                "label": "Full Name",
                "question": {
                    "en": "What is your full name?",
                    "ta": "உங்கள் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "gender",
                "label": "Gender",
                "question": {
                    "en": "What is your gender?",
                    "ta": "உங்கள் பாலினம் என்ன?",
                },
                "required": True,
            },
            {
                "name": "maritalStatus",
                "label": "Marital Status",
                "question": {
                    "en": "What is your marital status?",
                    "ta": "உங்கள் திருமண நிலை என்ன?",
                },
                "required": True,
            },
            {
                "name": "age",
                "label": "Age",
                "question": {
                    "en": "What is your age?",
                    "ta": "உங்கள் வயது என்ன?",
                },
                "required": True,
            },
            {
                "name": "religion",
                "label": "Religion",
                "question": {
                    "en": "What is your religion?",
                    "ta": "உங்கள் மதம் என்ன?",
                },
                "required": True,
            },
            {
                "name": "fatherName",
                "label": "Father's Name",
                "question": {
                    "en": "What is your father's full name?",
                    "ta": "உங்கள் தந்தையின் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "motherName",
                "label": "Mother's Name",
                "question": {
                    "en": "What is your mother's full name?",
                    "ta": "உங்கள் தாயின் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "mobile",
                "label": "Mobile Number",
                "question": {
                    "en": "What is your 10 digit mobile number?",
                    "ta": "உங்கள் 10 இலக்க கைபேசி எண் என்ன?",
                },
                "required": True,
            },
            {
                "name": "aadhaar",
                "label": "Aadhaar Number",
                "question": {
                    "en": "What is your 12 digit Aadhaar number?",
                    "ta": "உங்கள் 12 இலக்க ஆதார் எண் என்ன?",
                },
                "required": False,
            },
            {
                "name": "permanentAddress",
                "label": "Permanent Address",
                "question": {
                    "en": "What is your permanent address?",
                    "ta": "உங்கள் நிரந்தர முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "presentAddress",
                "label": "Present Address",
                "question": {
                    "en": "What is your present address?",
                    "ta": "உங்கள் தற்போதைய முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "policeStation",
                "label": "Police Station",
                "question": {
                    "en": "What is your police station?",
                    "ta": "உங்கள் காவல் நிலையம் எது?",
                },
                "required": True,
            },
            {
                "name": "postOffice",
                "label": "Post Office",
                "question": {
                    "en": "What is your post office?",
                    "ta": "உங்கள் அஞ்சல் அலுவலகம் எது?",
                },
                "required": True,
            },
            {
                "name": "district",
                "label": "District",
                "question": {
                    "en": "What is your district?",
                    "ta": "உங்கள் மாவட்டம் எது?",
                },
                "required": True,
            },
            {
                "name": "pin",
                "label": "PIN Code",
                "question": {
                    "en": "What is your six digit PIN code?",
                    "ta": "உங்கள் ஆறு இலக்க அஞ்சல் குறியீடு என்ன?",
                },
                "required": True,
            },
            {
                "name": "annualIncomeAgriculture",
                "label": "Agriculture Income",
                "question": {
                    "en": "What is your annual agriculture income in rupees?",
                    "ta": "விவசாயத்தின் மூலம் ஆண்டு வருமானம் எவ்வளவு?",
                },
                "required": True,
            },
            {
                "name": "annualIncomeSalary",
                "label": "Salary Income",
                "question": {
                    "en": "What is your annual salary income in rupees?",
                    "ta": "சம்பளத்தின் மூலம் ஆண்டு வருமானம் எவ்வளவு?",
                },
                "required": True,
            },
            {
                "name": "annualIncomeOther",
                "label": "Other Income",
                "question": {
                    "en": "What is your annual income from other sources in rupees?",
                    "ta": "பிற வழிகளில் ஆண்டு வருமானம் எவ்வளவு?",
                },
                "required": True,
            },
            {
                "name": "annualIncome",
                "label": "Total Annual Income",
                "question": {
                    "en": "What is your total annual family income in rupees?",
                    "ta": "உங்கள் மொத்த ஆண்டு குடும்ப வருமானம் எவ்வளவு?",
                },
                "required": True,
            },
            {
                "name": "purpose",
                "label": "Purpose",
                "question": {
                    "en": "What is the purpose of this certificate?",
                    "ta": "இந்த சான்றிதழ் எதற்காக தேவை?",
                },
                "required": True,
            },
            {
                "name": "declarationName",
                "label": "Declaration Name",
                "question": {
                    "en": "Please confirm the name for the declaration.",
                    "ta": "அறிக்கைக்கான பெயரை உறுதிப்படுத்தவும்.",
                },
                "required": True,
            },
        ],
    },

    "community_certificate": {
        "title": "Community Certificate",
        "fields": [
            {
                "name": "fullName",
                "label": "Full Name",
                "question": {
                    "en": "What is your full name?",
                    "ta": "உங்கள் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "dateOfBirth",
                "label": "Date of Birth",
                "question": {
                    "en": "What is your date of birth?",
                    "ta": "உங்கள் பிறந்த தேதி என்ன?",
                },
                "required": True,
            },
            {
                "name": "address",
                "label": "Address",
                "question": {
                    "en": "What is your full address?",
                    "ta": "உங்கள் முழு முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "mobile",
                "label": "Mobile Number",
                "question": {
                    "en": "What is your mobile number?",
                    "ta": "உங்கள் கைபேசி எண் என்ன?",
                },
                "required": True,
            },
            {
                "name": "community",
                "label": "Community",
                "question": {
                    "en": "What community should be recorded?",
                    "ta": "எந்த சமூகத்தை பதிவு செய்ய வேண்டும்?",
                },
                "required": True,
            },
        ],
    },

    "nativity_certificate": {
        "title": "Nativity Certificate",
        "fields": [
            {
                "name": "fullName",
                "label": "Full Name",
                "question": {
                    "en": "What is your full name?",
                    "ta": "உங்கள் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "dateOfBirth",
                "label": "Date of Birth",
                "question": {
                    "en": "What is your date of birth?",
                    "ta": "உங்கள் பிறந்த தேதி என்ன?",
                },
                "required": True,
            },
            {
                "name": "address",
                "label": "Current Address",
                "question": {
                    "en": "What is your current address?",
                    "ta": "உங்கள் தற்போதைய முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "mobile",
                "label": "Mobile Number",
                "question": {
                    "en": "What is your mobile number?",
                    "ta": "உங்கள் கைபேசி எண் என்ன?",
                },
                "required": True,
            },
            {
                "name": "placeOfBirth",
                "label": "Place of Birth",
                "question": {
                    "en": "Where were you born?",
                    "ta": "நீங்கள் எங்கு பிறந்தீர்கள்?",
                },
                "required": True,
            },
        ],
    },

    "scholarship_application": {
        "title": "Scholarship Application",
        "fields": [
            {
                "name": "fullName",
                "label": "Full Name",
                "question": {
                    "en": "What is your full name?",
                    "ta": "உங்கள் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "dateOfBirth",
                "label": "Date of Birth",
                "question": {
                    "en": "What is your date of birth?",
                    "ta": "உங்கள் பிறந்த தேதி என்ன?",
                },
                "required": True,
            },
            {
                "name": "address",
                "label": "Address",
                "question": {
                    "en": "What is your full address?",
                    "ta": "உங்கள் முழு முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "mobile",
                "label": "Mobile Number",
                "question": {
                    "en": "What is your mobile number?",
                    "ta": "உங்கள் கைபேசி எண் என்ன?",
                },
                "required": True,
            },
            {
                "name": "institution",
                "label": "Institution",
                "question": {
                    "en": "What is the name of your institution?",
                    "ta": "உங்கள் கல்வி நிறுவனத்தின் பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "course",
                "label": "Course",
                "question": {
                    "en": "What course are you studying?",
                    "ta": "நீங்கள் எந்த பாடப்பிரிவை படிக்கிறீர்கள்?",
                },
                "required": True,
            },
        ],
    },

    "pension_application": {
        "title": "Pension Application",
        "fields": [
            {
                "name": "fullName",
                "label": "Full Name",
                "question": {
                    "en": "What is your full name?",
                    "ta": "உங்கள் முழு பெயர் என்ன?",
                },
                "required": True,
            },
            {
                "name": "dateOfBirth",
                "label": "Date of Birth",
                "question": {
                    "en": "What is your date of birth?",
                    "ta": "உங்கள் பிறந்த தேதி என்ன?",
                },
                "required": True,
            },
            {
                "name": "address",
                "label": "Address",
                "question": {
                    "en": "What is your full address?",
                    "ta": "உங்கள் முழு முகவரி என்ன?",
                },
                "required": True,
            },
            {
                "name": "mobile",
                "label": "Mobile Number",
                "question": {
                    "en": "What is your mobile number?",
                    "ta": "உங்கள் கைபேசி எண் என்ன?",
                },
                "required": True,
            },
            {
                "name": "age",
                "label": "Age",
                "question": {
                    "en": "What is your age?",
                    "ta": "உங்கள் வயது என்ன?",
                },
                "required": True,
            },
        ],
    },
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_service(service_type: str) -> dict:
    service = SERVICE_DEFINITIONS.get(service_type)

    if service is None:
        raise ValueError(
            f"Unsupported service type: {service_type}"
        )

    return service


def get_required_fields(
    service_type: str,
) -> list[str]:

    service = get_service(service_type)

    return [
        field["name"]
        for field in service["fields"]
        if field["required"]
    ]


def get_field_definition(
    service_type: str,
    field_name: str,
) -> dict | None:

    service = get_service(service_type)

    for field in service["fields"]:
        if field["name"] == field_name:
            return field

    return None


def get_next_field(
    service_type: str,
    data: dict,
) -> str | None:

    for field_name in get_required_fields(
        service_type
    ):
        value = str(
            data.get(field_name, "")
        ).strip()

        if not value:
            return field_name

    return None


def calculate_progress(
    service_type: str,
    data: dict,
) -> int:

    required_fields = get_required_fields(
        service_type
    )

    if not required_fields:
        return 100

    completed = 0

    for field_name in required_fields:
        value = str(
            data.get(field_name, "")
        ).strip()

        if value:
            completed += 1

    return round(
        (completed / len(required_fields))
        * 100
    )


def create_application(
    db: Session,
    payload: ApplicationCreate,
) -> Application:

    service = get_service(
        payload.service_type
    )

    application = Application(
        service_type=payload.service_type,
        service_title=service["title"],
        language=payload.language,
        status="draft",
        progress=0,
        data_json="{}",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def get_application(
    db: Session,
    application_id: int,
) -> Application | None:

    return db.scalar(
        select(Application).where(
            Application.id == application_id
        )
    )


def get_applications(
    db: Session,
    limit: int = 50,
) -> list[Application]:

    return list(
        db.scalars(
            select(Application)
            .order_by(
                Application.updated_at.desc()
            )
            .limit(limit)
        )
    )


def update_application(
    db: Session,
    application: Application,
    payload: ApplicationUpdate,
) -> Application:

    current_data = json.loads(
        application.data_json or "{}"
    )

    if payload.language is not None:
        application.language = payload.language

    if payload.data:
        current_data.update(
            payload.data
        )

    application.data_json = json.dumps(
        current_data,
        ensure_ascii=False,
    )

    application.progress = calculate_progress(
        application.service_type,
        current_data,
    )

    if application.progress == 100:
        if application.status not in {
            "confirmed",
            "submitted",
        }:
            application.status = "review"

    elif application.progress > 0:
        if application.status not in {
            "confirmed",
            "submitted",
        }:
            application.status = "in_progress"

    application.updated_at = utc_now()

    db.commit()
    db.refresh(application)

    return application


def get_application_data(
    application: Application,
) -> dict:

    return json.loads(
        application.data_json or "{}"
    )


def serialize_application(
    application: Application,
) -> dict:

    return {
        "id": application.id,
        "service_type": application.service_type,
        "service_title": application.service_title,
        "language": application.language,
        "status": application.status,
        "progress": application.progress,
        "data": get_application_data(
            application
        ),
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        "confirmed_at": application.confirmed_at,
    }