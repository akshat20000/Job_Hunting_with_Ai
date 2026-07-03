from pydantic import BaseModel, Field
from typing import List, Optional

class ProfileSection(BaseModel):
    title: str
    content: str

class Profile(BaseModel):
    sections: List[ProfileSection]

class TailorRequest(BaseModel):
    job_title: str
    job_description: str
    resume_content: str

class TailorResponse(BaseModel):
    tailored_resume_markdown: str

class CoverLetterRequest(BaseModel):
    job_title: str
    job_description: str
    company_name: str
    resume_content: str

class CoverLetterResponse(BaseModel):
    cover_letter_markdown: str
