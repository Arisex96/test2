"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, TrendingUp, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchStudentData(parsedUser._id);
    } else {
      router.push("/auth/login");
    }
  }, []);

  const fetchStudentData = async (studentId: string) => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        fetch(`/api/student/courses?studentId=${studentId}`),
        fetch(`/api/student/attendance-stats?studentId=${studentId}`),
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAttendanceStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Student Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Classes
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceStats.totalClasses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Classes Attended
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceStats.attendedClasses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceStats.attendancePercentage.toFixed(1)}%
              </div>
              <Badge
                variant={
                  attendanceStats.attendancePercentage >= 75
                    ? "default"
                    : "destructive"
                }
                className="mt-2"
              >
                {attendanceStats.attendancePercentage >= 75
                  ? "Good"
                  : "Below Required"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Courses you are enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.length > 0 ? (
                  courses.map((course: any) => (
                    <div
                      key={course._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{course.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">
                          {course.code}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prof. {course.professor?.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link href={`/student/attendance/${course._id}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            View Attendance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No courses enrolled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/student/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Attendance Calendar
                  </Button>
                </Link>
                <Link href="/student/courses" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse All Courses
                  </Button>
                </Link>
                <Link href="/student/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Attendance Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
