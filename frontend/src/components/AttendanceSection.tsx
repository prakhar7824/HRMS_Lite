import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEmployees, fetchAttendance, createAttendance } from "@/lib/api";
import type { AttendanceRecord } from "@/types/hrms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Plus, Loader2, AlertCircle, CalendarX2 } from "lucide-react";
import { toast } from "sonner";

export default function AttendanceSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState({ employee_id: "", date: "", status: "Present" as "Present" | "Absent" });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  const { data: attendance = [], isLoading, error } = useQuery({
    queryKey: ["attendance", filterEmployee, dateFrom, dateTo],
    queryFn: () =>
      fetchAttendance(filterEmployee === "all" ? undefined : filterEmployee, {
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }),
  });

  const addMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setForm({ employee_id: "", date: "", status: "Present" });
      setShowForm(false);
      toast.success("Attendance recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id || !form.date) {
      toast.error("Employee and date are required");
      return;
    }
    addMutation.mutate(form);
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.full_name : empId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <CalendarCheck className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Attendance</h2>
            <p className="text-sm text-muted-foreground">{attendance.length} records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Employee</Label>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <div className="flex flex-col gap-1 min-w-0">
              <Label htmlFor="att-filter-from" className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
              <Input
                id="att-filter-from"
                type="date"
                aria-label="Filter from date"
                className="h-9 w-[132px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <Label htmlFor="att-filter-to" className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
              <Input
                id="att-filter-to"
                type="date"
                aria-label="Filter to date"
                className="h-9 w-[132px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="h-9 shrink-0 gap-1.5 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Log
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-accent/30 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-display">Log Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="att-date">Date</Label>
                <Input id="att-date" type="date" className="[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "Present" | "Absent" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading attendance…</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && attendance.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarX2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-display font-semibold text-foreground">No attendance records</p>
            <p className="text-sm text-muted-foreground mt-1">Start logging attendance for your employees.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && attendance.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec: AttendanceRecord) => (
                  <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{getEmployeeName(rec.employee_id)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          rec.status === "Present"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
