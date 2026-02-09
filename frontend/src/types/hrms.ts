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
