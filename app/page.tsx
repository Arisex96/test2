import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, Calendar, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">College Attendance Management System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline attendance tracking with our comprehensive solution designed for students and faculty
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Student Portal</CardTitle>
              <CardDescription>View your attendance records, course schedules, and academic progress</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/auth/login?role=student">
                <Button className="w-full bg-green-600 hover:bg-green-700">Student Login</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Faculty Portal</CardTitle>
              <CardDescription>Manage courses, mark attendance, and generate comprehensive reports</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/auth/login?role=professor">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Faculty Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
            <p className="text-gray-600">Interactive calendar interface for easy attendance visualization</p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">Comprehensive reporting and attendance analytics</p>
          </div>

          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">User Management</h3>
            <p className="text-gray-600">Role-based access for students and faculty members</p>
          </div>
        </div>
      </div>
    </div>
  )
}
