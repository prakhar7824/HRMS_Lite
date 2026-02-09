import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeSection from "@/components/EmployeeSection";
import AttendanceSection from "@/components/AttendanceSection";
import DashboardSection from "@/components/DashboardSection";
import { Users, CalendarCheck, Building2, LayoutDashboard } from "lucide-react";

const Index = () => {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">HRMS Lite</h1>
            <p className="text-xs text-muted-foreground">Employee &amp; Attendance Management</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Attendance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardSection />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeeSection />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
