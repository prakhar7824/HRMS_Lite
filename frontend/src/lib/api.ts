import type { Employee, AttendanceRecord, ApiError, DashboardSummary } from "@/types/hrms";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error((body as ApiError).detail || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Employees
export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${BASE_URL}/api/employees`);
  return handleResponse<Employee[]>(res);
}

export async function createEmployee(data: Employee): Promise<Employee> {
  const res = await fetch(`${BASE_URL}/api/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Employee>(res);
}

export async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

// Attendance
export async function fetchAttendance(
  employeeId?: string,
  options?: { dateFrom?: string; dateTo?: string }
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (employeeId) params.set("employee_id", employeeId);
  if (options?.dateFrom) params.set("date_from", options.dateFrom);
  if (options?.dateTo) params.set("date_to", options.dateTo);
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/api/attendance?${qs}` : `${BASE_URL}/api/attendance`;
  const res = await fetch(url);
  return handleResponse<AttendanceRecord[]>(res);
}

export async function fetchAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
  const res = await fetch(`${BASE_URL}/api/attendance/employee/${encodeURIComponent(employeeId)}`);
  return handleResponse<AttendanceRecord[]>(res);
}

export async function createAttendance(data: {
  employee_id: string;
  date: string;
  status: "Present" | "Absent";
}): Promise<AttendanceRecord> {
  const res = await fetch(`${BASE_URL}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AttendanceRecord>(res);
}

// Dashboard
export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/api/dashboard`);
  return handleResponse<DashboardSummary>(res);
}
