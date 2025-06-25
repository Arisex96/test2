import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { studentId, courseId } = await request.json()

    if (!studentId || !courseId) {
      return NextResponse.json({ message: "Student ID and Course ID are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Remove student from course
    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      {
        $pull: { students: new ObjectId(studentId) },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Course not found or student not enrolled" }, { status: 404 })
    }

    return NextResponse.json({ message: "Student unenrolled successfully" })
  } catch (error) {
    console.error("Error unenrolling student:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
