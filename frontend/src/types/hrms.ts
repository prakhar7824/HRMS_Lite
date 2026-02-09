export interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  date: string;
  status: "Present" | "Absent";
}

export interface ApiError {
  detail: string;
}

export interface PresentDaysRow {
  employee_id: string;
  full_name: string;
  present_days: number;
}

export interface DashboardSummary {
  total_employees: number;
  total_attendance_records: number;
  present_days_by_employee: PresentDaysRow[];
}
