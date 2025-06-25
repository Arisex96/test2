"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, CheckCircle, XCircle, Clock, BookOpen } from "lucide-react"
import Link from "next/link"

interface AttendanceRecord {
  _id: string
  date: string
  course: string
  students: Array<{
    student: string
    present: boolean
    timestamp?: string
  }>
}

interface Course {
  _id: string
  name: string
  code: string
  professor: {
    name: string
  }
}

interface AttendanceStats {
  totalClasses: number
  attendedClasses: number
  attendancePercentage: number
}

export default function StudentAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [user, setUser] = useState<any>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchAttendanceData(parsedUser._id)
    } else {
      router.push("/auth/login")
    }
  }, [courseId])

  const fetchAttendanceData = async (studentId: string) => {
    try {
      setLoading(true)
      
      // Fetch course details
      const courseRes = await fetch(`/api/courses/${courseId}`)
      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourse(courseData)
      }

      // Fetch attendance records for this course and student
      const attendanceRes = await fetch(`/api/student/attendance-records?studentId=${studentId}&courseId=${courseId}`)
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json()
        setAttendanceRecords(attendanceData)
        
        // Calculate stats
        const totalClasses = attendanceData.length
        const attendedClasses = attendanceData.filter((record: AttendanceRecord) => 
          record.students.some(s => s.student === studentId && s.present)
        ).length
        const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
        
        setStats({
          totalClasses,
          attendedClasses,
          attendancePercentage
        })
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (!user) return null
    const studentRecord = record.students.find(s => s.student === user._id)
    return studentRecord ? studentRecord.present : false
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Details</h1>
                <p className="text-sm text-gray-500">
                  {course ? `${course.name} (${course.code})` : 'Loading course...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.attendedClasses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendancePercentage.toFixed(1)}%</div>
              <Badge 
                variant={stats.attendancePercentage >= 75 ? "default" : "destructive"} 
                className="mt-2"
              >
                {stats.attendancePercentage >= 75 ? "Good Standing" : "Below Required (75%)"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Course Info */}
        {course && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Name</label>
                  <p className="text-lg font-semibold">{course.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Code</label>
                  <p className="text-lg font-semibold">{course.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Professor</label>
                  <p className="text-lg font-semibold">Prof. {course.professor.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Your attendance record for this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length > 0 ? (
              <div className="space-y-4">
                {attendanceRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => {
                    const isPresent = getAttendanceStatus(record)
                    return (
                      <div
                        key={record._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {isPresent ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(record.date)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Class Date
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={isPresent ? "default" : "destructive"}
                            className="mb-1"
                          >
                            {isPresent ? "Present" : "Absent"}
                          </Badge>
                          {isPresent && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Marked Present
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found for this course</p>
                <p className="text-sm text-gray-400 mt-2">
                  Attendance records will appear here once classes begin
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
