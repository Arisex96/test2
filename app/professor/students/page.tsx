"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, UserPlus, Users, Mail, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentsManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [enrollmentCourse, setEnrollmentCourse] = useState("")
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

  const fetchData = async (professorId: string) => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch(`/api/professor/students?professorId=${professorId}`),
        fetch(`/api/professor/courses?professorId=${professorId}`),
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData)
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !enrollmentCourse) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/professor/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: enrollmentCourse,
        }),
      })

      if (response.ok) {
        alert("Student enrolled successfully!")
        setIsEnrollDialogOpen(false)
        setSelectedStudent("")
        setEnrollmentCourse("")
        fetchData(user._id)
      } else {
        alert("Failed to enroll student")
      }
    } catch (error) {
      alert("Error enrolling student")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenrollStudent = async (studentId: string, courseId: string) => {
    if (!confirm("Are you sure you want to unenroll this student?")) return

    try {
      const response = await fetch("/api/professor/unenroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      })

      if (response.ok) {
        alert("Student unenrolled successfully!")
        fetchData(user._id)
      } else {
        alert("Failed to unenroll student")
      }
    } catch (error) {
      alert("Error unenrolling student")
    }
  }

  const filteredStudents = students.filter((student: any) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCourse =
      selectedCourse === "all" || student.enrolledCourses?.some((course: any) => course._id === selectedCourse)

    return matchesSearch && matchesCourse
  })

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
                <h1 className="text-xl font-semibold text-gray-900">Student Management</h1>
                <p className="text-sm text-gray-500">Manage student enrollments and information</p>
              </div>
            </div>
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Student in Course</DialogTitle>
                  <DialogDescription>Select a student and course to create a new enrollment</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Student</label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.name} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Course</label>
                    <Select value={enrollmentCourse} onValueChange={setEnrollmentCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
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
                  <Button
                    onClick={handleEnrollStudent}
                    disabled={isLoading || !selectedStudent || !enrollmentCourse}
                    className="w-full"
                  >
                    {isLoading ? "Enrolling..." : "Enroll Student"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course: any) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>Manage student enrollments and view student information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Enrolled Courses</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.studentId}</div>
                          <div className="text-sm text-gray-500">
                            Year {student.year} • {student.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.enrolledCourses?.map((course: any) => (
                            <div key={course._id} className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {course.code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnenrollStudent(student._id, course._id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )) || <span className="text-gray-500 text-sm">No enrollments</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.attendanceRate >= 75 ? "default" : "destructive"}>
                          {student.attendanceRate?.toFixed(1) || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/professor/students/${student._id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
