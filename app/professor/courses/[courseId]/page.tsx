"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Users, BookOpen, UserPlus, Edit, Trash2, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    credits: "",
    semester: "",
    year: "",
  })
  const [allStudents, setAllStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (courseId) {
      fetchCourseData()
      fetchAllStudents()
    }
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
        setEditForm({
          name: courseData.name,
          description: courseData.description || "",
          credits: courseData.credits.toString(),
          semester: courseData.semester,
          year: courseData.year,
        })
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    }
  }

  const fetchAllStudents = async () => {
    try {
      const response = await fetch("/api/students/all")
      if (response.ok) {
        const studentsData = await response.json()
        setAllStudents(studentsData)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleSaveCourse = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          credits: Number.parseInt(editForm.credits),
        }),
      })

      if (response.ok) {
        alert("Course updated successfully!")
        setIsEditing(false)
        fetchCourseData()
      } else {
        alert("Failed to update course")
      }
    } catch (error) {
      alert("Error updating course")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudent) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/professor/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: courseId,
        }),
      })

      if (response.ok) {
        alert("Student enrolled successfully!")
        setIsEnrollDialogOpen(false)
        setSelectedStudent("")
        fetchCourseData()
      } else {
        alert("Failed to enroll student")
      }
    } catch (error) {
      alert("Error enrolling student")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenrollStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to unenroll this student?")) return

    try {
      const response = await fetch("/api/professor/unenroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      })

      if (response.ok) {
        alert("Student unenrolled successfully!")
        fetchCourseData()
      } else {
        alert("Failed to unenroll student")
      }
    } catch (error) {
      alert("Error unenrolling student")
    }
  }

  if (!course) return <div>Loading...</div>

  const availableStudents = allStudents.filter(
    (student: any) => !course.students?.some((enrolled: any) => enrolled._id === student._id),
  )

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
                <h1 className="text-xl font-semibold text-gray-900">Course Management</h1>
                <p className="text-sm text-gray-500">
                  {course.name} ({course.code})
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/professor/attendance/${courseId}`}>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </Link>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSaveCourse} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="students">Students ({course.students?.length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Information
                </CardTitle>
                <CardDescription>{isEditing ? "Edit course details" : "View course information"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Course Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits</Label>
                      <Select
                        value={editForm.credits}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, credits: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Credit</SelectItem>
                          <SelectItem value="2">2 Credits</SelectItem>
                          <SelectItem value="3">3 Credits</SelectItem>
                          <SelectItem value="4">4 Credits</SelectItem>
                          <SelectItem value="5">5 Credits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={editForm.semester}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, semester: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Academic Year</Label>
                      <Select
                        value={editForm.year}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, year: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900">Course Code</h3>
                      <p className="text-gray-600">{course.code}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Credits</h3>
                      <p className="text-gray-600">{course.credits}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Department</h3>
                      <p className="text-gray-600">{course.department}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Semester</h3>
                      <p className="text-gray-600">
                        {course.semester} {course.year}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Professor</h3>
                      <p className="text-gray-600">{course.professor?.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Enrolled Students</h3>
                      <p className="text-gray-600">{course.students?.length || 0}</p>
                    </div>
                    {course.description && (
                      <div className="md:col-span-2">
                        <h3 className="font-medium text-gray-900">Description</h3>
                        <p className="text-gray-600">{course.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Enrolled Students
                  </CardTitle>
                  <CardDescription>Manage student enrollments for this course</CardDescription>
                </div>
                <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enroll Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enroll New Student</DialogTitle>
                      <DialogDescription>Select a student to enroll in {course.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Available Students</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStudents.map((student: any) => (
                              <SelectItem key={student._id} value={student._id}>
                                {student.name} ({student.studentId}) - {student.department}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleEnrollStudent} disabled={isLoading || !selectedStudent} className="w-full">
                        {isLoading ? "Enrolling..." : "Enroll Student"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {course.students && course.students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.students.map((student: any) => (
                          <TableRow key={student._id}>
                            <TableCell>
                              <div className="font-medium">{student.name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.studentId}</Badge>
                            </TableCell>
                            <TableCell>{student.department}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Year {student.year}</Badge>
                            </TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnenrollStudent(student._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Unenroll
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-500 mb-4">Start by enrolling students in this course</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Students:</span>
                    <Badge variant="outline">{course.students?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <Badge variant="secondary">{course.department}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <Badge variant="default">{course.credits}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Academic Period:</span>
                    <Badge variant="outline">
                      {course.semester} {course.year}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/professor/attendance/${courseId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Mark Today's Attendance
                    </Button>
                  </Link>
                  <Link href={`/professor/reports?courseId=${courseId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Course Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
