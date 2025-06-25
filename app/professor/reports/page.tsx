"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, BarChart3, Users, BookOpen, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [reportData, setReportData] = useState<any>({
    overallStats: {},
    courseStats: [],
    studentReports: [],
    attendanceTrends: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchData(parsedUser._id)
    } else {
      router.push("/auth/login")
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchReportData()
    }
  }, [selectedCourse, user])

  const fetchData = async (professorId: string) => {
    try {
      const response = await fetch(`/api/professor/courses?professorId=${professorId}`)
      if (response.ok) {
        const coursesData = await response.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/professor/reports?professorId=${user._id}&courseId=${selectedCourse}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/professor/export-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professorId: user._id,
          courseId: selectedCourse,
          reportType: type,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `attendance-report-${type}-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      alert("Error exporting report")
    }
  }

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
                <h1 className="text-xl font-semibold text-gray-900">Attendance Reports</h1>
                <p className="text-sm text-gray-500">Comprehensive attendance analytics and reports</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course: any) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => exportReport("detailed")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">Loading report data...</div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Student Reports</TabsTrigger>
              <TabsTrigger value="courses">Course Analysis</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.overallStats.totalStudents || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.overallStats.totalClasses || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.overallStats.averageAttendance?.toFixed(1) || 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{reportData.overallStats.atRiskStudents || 0}</div>
                    <p className="text-xs text-muted-foreground">Below 75% attendance</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Course Performance Summary</CardTitle>
                  <CardDescription>Attendance rates across all your courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.courseStats.map((course: any) => (
                      <div key={course._id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{course.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({course.code})</span>
                          </div>
                          <Badge variant={course.attendanceRate >= 75 ? "default" : "destructive"}>
                            {course.attendanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={course.attendanceRate} className="h-2" />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{course.enrolledStudents} students</span>
                          <span>{course.totalClasses} classes conducted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Student Reports</CardTitle>
                  <CardDescription>Detailed attendance records for each student</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Total Classes</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Attendance Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.studentReports.map((student: any) => (
                          <TableRow key={`${student.studentId}-${student.courseId}`}>
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
                              <div>
                                <div className="font-medium">{student.courseName}</div>
                                <div className="text-sm text-gray-500">{student.courseCode}</div>
                              </div>
                            </TableCell>
                            <TableCell>{student.totalClasses}</TableCell>
                            <TableCell>
                              <Badge variant="default">{student.presentCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{student.lateCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{student.absentCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={student.attendanceRate >= 75 ? "default" : "destructive"}>
                                {student.attendanceRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={student.attendanceRate >= 75 ? "default" : "destructive"}>
                                {student.attendanceRate >= 75 ? "Good" : "At Risk"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportData.courseStats.map((course: any) => (
                  <Card key={course._id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{course.name}</span>
                        <Badge variant="outline">{course.code}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {course.enrolledStudents} students • {course.totalClasses} classes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Attendance Rate</span>
                          <Badge variant={course.attendanceRate >= 75 ? "default" : "destructive"}>
                            {course.attendanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={course.attendanceRate} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{course.avgPresent}</div>
                          <div className="text-xs text-gray-500">Avg Present</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{course.avgLate}</div>
                          <div className="text-xs text-gray-500">Avg Late</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{course.avgAbsent}</div>
                          <div className="text-xs text-gray-500">Avg Absent</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Students at Risk ({"<"}75%)</span>
                          <Badge variant="destructive">{course.atRiskStudents}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Excellent Attendance ({">"}90%)</span>
                          <Badge variant="default">{course.excellentStudents}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance Trends
                  </CardTitle>
                  <CardDescription>Weekly attendance patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData.attendanceTrends.map((trend: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Week {trend.week}</span>
                          <Badge variant={trend.attendanceRate >= 75 ? "default" : "destructive"}>
                            {trend.attendanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={trend.attendanceRate} className="h-2" />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{trend.dateRange}</span>
                          <span>{trend.totalClasses} classes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.overallStats.averageAttendance < 75 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800">Low Attendance Alert</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Overall attendance is below 75%. Consider implementing attendance improvement strategies.
                        </p>
                      </div>
                    )}

                    {reportData.overallStats.atRiskStudents > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800">Students Need Attention</h4>
                        <p className="text-sm text-yellow-600 mt-1">
                          {reportData.overallStats.atRiskStudents} students have attendance below 75%. Consider reaching
                          out to these students.
                        </p>
                      </div>
                    )}

                    {reportData.overallStats.averageAttendance >= 85 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800">Excellent Performance</h4>
                        <p className="text-sm text-green-600 mt-1">
                          Great job! Your classes maintain excellent attendance rates.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
