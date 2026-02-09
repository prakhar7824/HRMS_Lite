"""
HRMS Lite API – single-file FastAPI backend.
Run: uvicorn main:app --reload --port 8000   (from backend folder)
"""
from datetime import date
from functools import lru_cache

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings
from supabase import create_client


# --- Config & DB ---
class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings():
    return Settings()


def get_supabase():
    s = get_settings()
    if not s.supabase_url or not s.supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    return create_client(s.supabase_url, s.supabase_key)


# --- Schemas ---
class EmployeeCreate(BaseModel):
    id: str = Field(..., min_length=1)
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    department: str = Field(..., min_length=1)


class EmployeeResponse(BaseModel):
    id: str
    full_name: str
    email: str
    department: str

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    employee_id: str = Field(..., min_length=1)
    date: date
    status: str = Field(..., pattern="^(Present|Absent)$")


class AttendanceResponse(BaseModel):
    id: int
    employee_id: str
    date: date
    status: str

    class Config:
        from_attributes = True


# --- App ---
app = FastAPI(title="HRMS Lite API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {"message": "HRMS Lite API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Employees ---
@app.get("/api/employees", response_model=list[EmployeeResponse])
def list_employees(db=Depends(get_supabase)):
    r = db.table("employees").select("*").order("id").execute()
    return [EmployeeResponse(**x) for x in (r.data or [])]


@app.post("/api/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def add_employee(body: EmployeeCreate, db=Depends(get_supabase)):
    if db.table("employees").select("id").eq("id", body.id).execute().data:
        raise HTTPException(status_code=409, detail="An employee with this ID already exists.")
    if db.table("employees").select("id").eq("email", body.email).execute().data:
        raise HTTPException(status_code=409, detail="An employee with this email already exists.")
    ins = db.table("employees").insert(body.model_dump()).execute()
    if not ins.data:
        raise HTTPException(status_code=500, detail="Failed to create employee.")
    return EmployeeResponse(**ins.data[0])


@app.delete("/api/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db=Depends(get_supabase)):
    if not db.table("employees").select("id").eq("id", employee_id).execute().data:
        raise HTTPException(status_code=404, detail="Employee not found.")
    db.table("attendances").delete().eq("employee_id", employee_id).execute()
    db.table("employees").delete().eq("id", employee_id).execute()
    return None


# --- Attendance ---
@app.get("/api/attendance", response_model=list[AttendanceResponse])
def list_attendance(employee_id: str | None = Query(None), db=Depends(get_supabase)):
    q = db.table("attendances").select("*").order("date", desc=True)
    if employee_id:
        q = q.eq("employee_id", employee_id)
    r = q.execute()
    return [AttendanceResponse(**x) for x in (r.data or [])]


@app.get("/api/attendance/employee/{employee_id}", response_model=list[AttendanceResponse])
def get_attendance_by_employee(employee_id: str, db=Depends(get_supabase)):
    if not db.table("employees").select("id").eq("id", employee_id).execute().data:
        raise HTTPException(status_code=404, detail="Employee not found.")
    r = db.table("attendances").select("*").eq("employee_id", employee_id).order("date", desc=True).execute()
    return [AttendanceResponse(**x) for x in (r.data or [])]


@app.post("/api/attendance", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(body: AttendanceCreate, db=Depends(get_supabase)):
    if not db.table("employees").select("id").eq("id", body.employee_id).execute().data:
        raise HTTPException(status_code=404, detail="Employee not found.")
    payload = body.model_dump()
    payload["date"] = payload["date"].isoformat()
    ins = db.table("attendances").insert(payload).execute()
    if not ins.data:
        raise HTTPException(status_code=500, detail="Failed to create attendance record.")
    row = dict(ins.data[0])
    row["date"] = body.date
    return AttendanceResponse(**row)
