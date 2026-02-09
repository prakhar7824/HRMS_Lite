import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Users, CalendarCheck, Loader2, AlertCircle } from "lucide-react";

export default function DashboardSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { total_employees, total_attendance_records, present_days_by_employee } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Summary and counts</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total_employees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance Records</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total_attendance_records}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Present days per employee</CardTitle>
          <p className="text-sm text-muted-foreground">Total days marked as Present for each employee.</p>
        </CardHeader>
        <CardContent>
          {present_days_by_employee.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Employee</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Present days</th>
                  </tr>
                </thead>
                <tbody>
                  {present_days_by_employee.map((row) => (
                    <tr key={row.employee_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.present_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
