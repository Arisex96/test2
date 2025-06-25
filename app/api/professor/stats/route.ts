import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const professorId = searchParams.get("professorId")

    if (!professorId) {
      return NextResponse.json({ message: "Professor ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Get professor's courses
    const courses = await db
      .collection("courses")
      .find({
        professor: new ObjectId(professorId),
      })
      .toArray()

    const courseIds = courses.map((course) => course._id)

    // Calculate total students across all courses
    const totalStudents = courses.reduce((sum, course) => sum + (course.students?.length || 0), 0)

    // Get total classes conducted
    const totalClasses = await db.collection("attendance").countDocuments({
      course: { $in: courseIds },
    })

    // Calculate average attendance
    const attendanceStats = await db
      .collection("attendance")
      .aggregate([
        { $match: { course: { $in: courseIds } } },
        { $unwind: "$students" },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentRecords: { $sum: { $cond: ["$students.present", 1, 0] } },
          },
        },
      ])
      .toArray()

    const averageAttendance =
      attendanceStats.length > 0 ? (attendanceStats[0].presentRecords / attendanceStats[0].totalRecords) * 100 : 0

    return NextResponse.json({
      totalCourses: courses.length,
      totalStudents,
      totalClasses,
      averageAttendance,
    })
  } catch (error) {
    console.error("Error fetching professor stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
