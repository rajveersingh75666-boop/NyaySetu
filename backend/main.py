from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db, ensure_complaint_columns
from models import Complaint, Department
from schemas import ComplaintCreate, ComplaintResponse, ComplaintUpdate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
ensure_complaint_columns()


@app.get("/")
def root():
    return {"message": "NyaySetu backend is running"}


@app.post("/api/complaints", response_model=ComplaintResponse)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db)
):
    new_complaint = Complaint(
        citizen_name=complaint.citizen_name,
        citizen_mobile=complaint.citizen_mobile,
        description=complaint.description,
        location=complaint.location,
        category=complaint.category,
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@app.get("/api/complaints", response_model=list[ComplaintResponse])
def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    return complaints


@app.patch("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    update: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if update.category is not None:
        complaint.category = update.category

    if update.ai_summary is not None:
        complaint.ai_summary = update.ai_summary

    if update.ai_analysis is not None:
        complaint.ai_analysis = update.ai_analysis

    if update.department_id is not None:
        complaint.department_id = update.department_id

    if update.priority is not None:
        complaint.priority = update.priority

    if update.status is not None:
        complaint.status = update.status

    db.commit()
    db.refresh(complaint)

    return complaint


@app.get("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return complaint


@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).order_by(Department.id.asc()).all()
    return departments
