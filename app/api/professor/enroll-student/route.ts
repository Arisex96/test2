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

    // Check if student is already enrolled
    const course = await db.collection("courses").findOne({
      _id: new ObjectId(courseId),
      students: new ObjectId(studentId),
    })

    if (course) {
      return NextResponse.json({ message: "Student is already enrolled in this course" }, { status: 400 })
    }

    // Add student to course
    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      {
        $addToSet: { students: new ObjectId(studentId) },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Student enrolled successfully" })
  } catch (error) {
    console.error("Error enrolling student:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
