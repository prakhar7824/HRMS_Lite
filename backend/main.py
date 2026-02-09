"""
HRMS Lite API – single-file FastAPI backend.
Run: uvicorn main:app --reload --port 8000   (from backend folder)
"""
from datetime import date
from functools import lru_cache

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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


@app.exception_handler(RequestValidationError)
def validation_exception_handler(_request, exc: RequestValidationError):
    """Return a single detail string for validation errors (e.g. invalid email) so the frontend can show it clearly."""
    errors = exc.errors()
    if errors:
        msg = errors[0].get("msg", "Validation error")
        loc = errors[0].get("loc", [])
        if "email" in loc and "email" in str(msg).lower():
            msg = "Please provide a valid email address."
        elif "body" in loc and len(loc) > 1:
            field = loc[-1]
            if field == "email":
                msg = "Please provide a valid email address."
    else:
        msg = "Validation error"
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": msg})


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
def list_attendance(
    employee_id: str | None = Query(None),
    date_from: str | None = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: str | None = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db=Depends(get_supabase),
):
    q = db.table("attendances").select("*").order("date", desc=True)
    if employee_id:
        q = q.eq("employee_id", employee_id)
    if date_from:
        q = q.gte("date", date_from)
    if date_to:
        q = q.lte("date", date_to)
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
    if body.date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark attendance for a future date.",
        )
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


# --- Dashboard (summary + counts) ---
@app.get("/api/dashboard")
def get_dashboard(db=Depends(get_supabase)):
    """Returns total counts and present days per employee for dashboard summary."""
    employees_r = db.table("employees").select("id, full_name").order("id").execute()
    employees = employees_r.data or []
    attendance_r = db.table("attendances").select("employee_id, status").execute()
    attendance = attendance_r.data or []

    present_count_by_employee: dict[str, int] = {}
    for row in attendance:
        if row.get("status") == "Present":
            eid = row.get("employee_id")
            if eid:
                present_count_by_employee[eid] = present_count_by_employee.get(eid, 0) + 1

    present_days_by_employee = [
        {
            "employee_id": emp["id"],
            "full_name": emp["full_name"],
            "present_days": present_count_by_employee.get(emp["id"], 0),
        }
        for emp in employees
    ]

    return {
        "total_employees": len(employees),
        "total_attendance_records": len(attendance),
        "present_days_by_employee": present_days_by_employee,
    }
