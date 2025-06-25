import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Get all attendance records for the student
    const attendanceRecords = await db
      .collection("attendance")
      .aggregate([
        { $unwind: "$students" },
        { $match: { "students.student": new ObjectId(studentId) } },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            attendedClasses: {
              $sum: { $cond: ["$students.present", 1, 0] },
            },
          },
        },
      ])
      .toArray()

    const stats = attendanceRecords[0] || { totalClasses: 0, attendedClasses: 0 }
    const attendancePercentage = stats.totalClasses > 0 ? (stats.attendedClasses / stats.totalClasses) * 100 : 0

    return NextResponse.json({
      ...stats,
      attendancePercentage,
    })
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
