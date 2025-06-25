"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Users, CalendarIcon } from "lucide-react"
import Link from "next/link"

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<any>(null)
  const [students, setStudents] = useState([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({})
  const [existingAttendance, setExistingAttendance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

  useEffect(() => {
    if (selectedDate && students.length > 0) {
      fetchAttendanceForDate()
    }
  }, [selectedDate, students])

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
        setStudents(courseData.students || [])

        // Initialize attendance state
        const initialAttendance: { [key: string]: boolean } = {}
        courseData.students?.forEach((student: any) => {
          initialAttendance[student._id] = false
        })
        setAttendance(initialAttendance)
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    }
  }

  const fetchAttendanceForDate = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0]
      const response = await fetch(`/api/attendance/${courseId}?date=${dateStr}`)

      if (response.ok) {
        const attendanceData = await response.json()
        setExistingAttendance(attendanceData)

        // Update attendance state with existing data
        const updatedAttendance: { [key: string]: boolean } = {}
        students.forEach((student: any) => {
          const studentAttendance = attendanceData?.students?.find((s: any) => s.student === student._id)
          updatedAttendance[student._id] = studentAttendance?.present || false
        })
        setAttendance(updatedAttendance)
      } else {
        // No existing attendance for this date
        setExistingAttendance(null)
        const resetAttendance: { [key: string]: boolean } = {}
        students.forEach((student: any) => {
          resetAttendance[student._id] = false
        })
        setAttendance(resetAttendance)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: present,
    }))
  }

  const handleSaveAttendance = async () => {
    setIsLoading(true)

    try {
      const attendanceData = {
        courseId,
        date: selectedDate.toISOString().split("T")[0],
        students: Object.entries(attendance).map(([studentId, present]) => ({
          student: studentId,
          present,
        })),
      }

      const method = existingAttendance ? "PUT" : "POST"
      const response = await fetch("/api/attendance", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      })

      if (response.ok) {
        alert("Attendance saved successfully!")
        fetchAttendanceForDate() // Refresh data
      } else {
        alert("Failed to save attendance")
      }
    } catch (error) {
      alert("Error saving attendance")
    } finally {
      setIsLoading(false)
    }
  }

  const presentCount = Object.values(attendance).filter(Boolean).length
  const totalStudents = students.length
  const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0

  if (!course) return <div>Loading...</div>

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
                <p className="text-sm text-gray-500">
                  {course.name} ({course.code})
                </p>
              </div>
            </div>
            <Button onClick={handleSaveAttendance} disabled={isLoading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
              <CardDescription>Choose the date for attendance marking</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Present:</span>
                  <Badge variant="default">{presentCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Absent:</span>
                  <Badge variant="destructive">{totalStudents - presentCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Attendance:</span>
                  <Badge variant={attendancePercentage >= 75 ? "default" : "destructive"}>
                    {attendancePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
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
              <div className="space-y-4">
                {students.length > 0 ? (
                  students.map((student: any) => (
                    <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          id={student._id}
                          checked={attendance[student._id] || false}
                          onCheckedChange={(checked) => handleAttendanceChange(student._id, checked as boolean)}
                        />
                        <div>
                          <Label htmlFor={student._id} className="font-medium cursor-pointer">
                            {student.name}
                          </Label>
                          <p className="text-sm text-gray-500">{student.studentId}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <Badge variant={attendance[student._id] ? "default" : "destructive"}>
                        {attendance[student._id] ? "Present" : "Absent"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No students enrolled in this course</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
