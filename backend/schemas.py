from pydantic import BaseModel
from typing import Optional


class ComplaintCreate(BaseModel):
    citizen_name: Optional[str] = None
    citizen_mobile: Optional[str] = None
    description: str
    location: Optional[str] = None
    category: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    citizen_name: Optional[str] = None
    citizen_mobile: Optional[str] = None
    description: str
    location: Optional[str] = None
    category: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_analysis: Optional[str] = None

    class Config:
        from_attributes = True


class ComplaintUpdate(BaseModel):
    category: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_analysis: Optional[str] = None
