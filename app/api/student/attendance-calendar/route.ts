import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const courseId = searchParams.get("courseId")
    const month = Number.parseInt(searchParams.get("month") || "1")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    if (!studentId || !courseId) {
      return NextResponse.json({ message: "Student ID and Course ID are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]

    // Get attendance records for the month
    const attendanceRecords = await db
      .collection("attendance")
      .aggregate([
        {
          $match: {
            course: new ObjectId(courseId),
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $unwind: "$students" },
        { $match: { "students.student": new ObjectId(studentId) } },
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        {
          $project: {
            date: 1,
            present: "$students.present",
            course: { name: "$course.name", code: "$course.code" },
          },
        },
      ])
      .toArray()

    // Calculate monthly stats
    const totalClasses = attendanceRecords.length
    const attendedClasses = attendanceRecords.filter((record) => record.present).length
    const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0

    return NextResponse.json({
      attendanceRecords,
      monthlyStats: {
        totalClasses,
        attendedClasses,
        attendancePercentage,
      },
    })
  } catch (error) {
    console.error("Error fetching attendance calendar:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
