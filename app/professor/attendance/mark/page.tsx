"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Save, Users, CalendarIcon, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type AttendanceStatus = "present" | "absent" | "late"

export default function MarkAttendancePage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceStatus }>({})
  const [existingAttendance, setExistingAttendance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchCourses(parsedUser._id)
    } else {
      router.push("/auth/login")
    }
  }, [])

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchCourseStudents()
      fetchAttendanceForDate()
    }
  }, [selectedCourse, selectedDate])

  const fetchCourses = async (professorId: string) => {
    try {
      const response = await fetch(`/api/professor/courses?professorId=${professorId}`)
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

  const fetchCourseStudents = async () => {
    try {
      const response = await fetch(`/api/courses/${selectedCourse}`)
      if (response.ok) {
        const courseData = await response.json()
        setStudents(courseData.students || [])

        // Initialize attendance state
        const initialAttendance: { [key: string]: AttendanceStatus } = {}
        courseData.students?.forEach((student: any) => {
          initialAttendance[student._id] = "absent"
        })
        setAttendance(initialAttendance)
      }
    } catch (error) {
      console.error("Error fetching course students:", error)
    }
  }

  const fetchAttendanceForDate = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0]
      const response = await fetch(`/api/attendance/${selectedCourse}?date=${dateStr}`)

      if (response.ok) {
        const attendanceData = await response.json()
        setExistingAttendance(attendanceData)

        // Update attendance state with existing data
        const updatedAttendance: { [key: string]: AttendanceStatus } = {}
        students.forEach((student: any) => {
          const studentAttendance = attendanceData?.students?.find((s: any) => s.student === student._id)
          updatedAttendance[student._id] = studentAttendance?.status || "absent"
        })
        setAttendance(updatedAttendance)
      } else {
        // No existing attendance for this date
        setExistingAttendance(null)
        const resetAttendance: { [key: string]: AttendanceStatus } = {}
        students.forEach((student: any) => {
          resetAttendance[student._id] = "absent"
        })
        setAttendance(resetAttendance)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSaveAttendance = async () => {
    setIsLoading(true)

    try {
      const attendanceData = {
        courseId: selectedCourse,
        date: selectedDate.toISOString().split("T")[0],
        students: Object.entries(attendance).map(([studentId, status]) => ({
          student: studentId,
          status,
          present: status === "present" || status === "late",
        })),
      }

      const method = existingAttendance ? "PUT" : "POST"
      const response = await fetch("/api/attendance/advanced", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      })

      if (response.ok) {
        alert("Attendance saved successfully!")
        fetchAttendanceForDate()
      } else {
        alert("Failed to save attendance")
      }
    } catch (error) {
      alert("Error saving attendance")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusCounts = () => {
    const counts = { present: 0, late: 0, absent: 0 }
    Object.values(attendance).forEach((status) => {
      counts[status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()
  const totalStudents = students.length
  const attendancePercentage =
    totalStudents > 0 ? ((statusCounts.present + statusCounts.late) / totalStudents) * 100 : 0

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/professor/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mark Attendance</h1>
                <p className="text-sm text-gray-500">Record student attendance with detailed status</p>
              </div>
            </div>
            <Button
              onClick={handleSaveAttendance}
              disabled={isLoading || !selectedCourse}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Date & Course
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose course" />
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

              <div>
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Present:</span>
                  <Badge variant="default">{statusCounts.present}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Late:</span>
                  <Badge variant="secondary">{statusCounts.late}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Absent:</span>
                  <Badge variant="destructive">{statusCounts.absent}</Badge>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Attendance Rate:</span>
                  <Badge variant={attendancePercentage >= 75 ? "default" : "destructive"}>
                    {attendancePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({totalStudents})
              </CardTitle>
              <CardDescription>
                Mark attendance for {selectedDate.toLocaleDateString()}
                {existingAttendance && (
                  <Badge variant="outline" className="ml-2">
                    Previously Recorded
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: any) => (
                        <TableRow key={student._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.studentId}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                attendance[student._id] === "present"
                                  ? "default"
                                  : attendance[student._id] === "late"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {attendance[student._id] === "present" && "Present"}
                              {attendance[student._id] === "late" && "Late"}
                              {attendance[student._id] === "absent" && "Absent"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant={attendance[student._id] === "present" ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student._id, "present")}
                              >
                                Present
                              </Button>
                              <Button
                                variant={attendance[student._id] === "late" ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student._id, "late")}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Late
                              </Button>
                              <Button
                                variant={attendance[student._id] === "absent" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student._id, "absent")}
                              >
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {selectedCourse ? "No students enrolled in this course" : "Please select a course"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
