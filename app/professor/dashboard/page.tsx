"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Users, BarChart3, User, LogOut, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfessorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchProfessorData(parsedUser._id)
    } else {
      router.push("/auth/login")
    }
  }, [])

  const fetchProfessorData = async (professorId: string) => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        fetch(`/api/professor/courses?professorId=${professorId}`),
        fetch(`/api/professor/stats?professorId=${professorId}`),
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching professor data:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Professor Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, Prof. {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Conducted</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAttendance.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Courses you are teaching</CardDescription>
              </div>
              <Link href="/professor/courses/create">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.length > 0 ? (
                  courses.map((course: any) => (
                    <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                        <p className="text-sm text-gray-500">{course.students?.length || 0} students enrolled</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/professor/attendance/${course._id}`}>
                          <Button variant="outline" size="sm">
                            Mark Attendance
                          </Button>
                        </Link>
                        <Link href={`/professor/courses/${course._id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No courses created yet</p>
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
                <Link href="/professor/attendance/mark" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Mark Today's Attendance
                  </Button>
                </Link>
                <Link href="/professor/students" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Students
                  </Button>
                </Link>
                <Link href="/professor/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Reports
                  </Button>
                </Link>
                <Link href="/professor/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
