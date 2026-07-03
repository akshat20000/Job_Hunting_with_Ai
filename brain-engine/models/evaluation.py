from pydantic import BaseModel, Field
from typing import List, Optional

class EvaluationRequest(BaseModel):
    job_title: str
    job_description: str
    resume_content: str

class EvaluationResult(BaseModel):
    score: float = Field(..., description="Job fit score between 0 and 100")
    explanation: str = Field(..., description="Explanation of why this score was awarded")
    key_matches: List[str] = Field(default_factory=list, description="Key skills and requirements matching the job description")
    missing_keywords: List[str] = Field(default_factory=list, description="Keywords or qualifications missing from the resume")
