"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentCalendarPage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [monthlyStats, setMonthlyStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchStudentCourses(parsedUser._id)
    } else {
      router.push("/auth/login")
    }
  }, [])

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchAttendanceData()
    }
  }, [selectedCourse, selectedDate])

  const fetchStudentCourses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/student/courses?studentId=${studentId}`)
      if (response.ok) {
        const coursesData = await response.json()
        setCourses(coursesData)
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0]._id)
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const month = selectedDate.getMonth() + 1
      const year = selectedDate.getFullYear()

      const response = await fetch(
        `/api/student/attendance-calendar?studentId=${user._id}&courseId=${selectedCourse}&month=${month}&year=${year}`,
      )

      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data.attendanceRecords)
        setMonthlyStats(data.monthlyStats)
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
    }
  }

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return attendanceData.find((record) => record.date === dateStr)
  }

  const getDayClassName = (date: Date) => {
    const attendance = getAttendanceForDate(date)
    if (!attendance) return ""

    return attendance.present ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/student/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Calendar</h1>
                <p className="text-sm text-gray-500">View your attendance records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <CardDescription>Green dates indicate present, red dates indicate absent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  present: (date) => {
                    const attendance = getAttendanceForDate(date)
                    return attendance?.present === true
                  },
                  absent: (date) => {
                    const attendance = getAttendanceForDate(date)
                    return attendance?.present === false
                  },
                }}
                modifiersStyles={{
                  present: { backgroundColor: "#dcfce7", color: "#166534" },
                  absent: { backgroundColor: "#fecaca", color: "#dc2626" },
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Statistics</CardTitle>
                <CardDescription>
                  {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Classes:</span>
                  <Badge variant="outline">{monthlyStats.totalClasses}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Classes Attended:</span>
                  <Badge variant="default">{monthlyStats.attendedClasses}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Attendance Rate:</span>
                  <Badge variant={monthlyStats.attendancePercentage >= 75 ? "default" : "destructive"}>
                    {monthlyStats.attendancePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                  <span className="text-sm">No Class</span>
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Date</CardTitle>
                  <CardDescription>{selectedDate.toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const attendance = getAttendanceForDate(selectedDate)
                    if (!attendance) {
                      return <p className="text-gray-500">No class on this date</p>
                    }
                    return (
                      <div className="space-y-2">
                        <Badge
                          variant={attendance.present ? "default" : "destructive"}
                          className="w-full justify-center"
                        >
                          {attendance.present ? "Present" : "Absent"}
                        </Badge>
                        {attendance.course && <p className="text-sm text-gray-600">Course: {attendance.course.name}</p>}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
