from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True)
    citizen_name = Column(String(100))
    citizen_mobile = Column(String(20))
    description = Column(Text, nullable=False)
    location = Column(Text)
    category = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"))
    priority = Column(String(20), default="medium")
    status = Column(String(30), default="submitted")
    ai_summary = Column(Text)
    ai_analysis = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())