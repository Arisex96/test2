import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { courseId, date, students } = await request.json()

    const client = await clientPromise
    const db = client.db("attendance_management")

    const attendanceRecord = {
      course: new ObjectId(courseId),
      date,
      students: students.map((s: any) => ({
        student: new ObjectId(s.student),
        status: s.status,
        present: s.present,
        timestamp: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("attendance").insertOne(attendanceRecord)

    return NextResponse.json({
      message: "Attendance recorded successfully",
      attendanceId: result.insertedId,
    })
  } catch (error) {
    console.error("Error recording attendance:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { courseId, date, students } = await request.json()

    const client = await clientPromise
    const db = client.db("attendance_management")

    const result = await db.collection("attendance").updateOne(
      {
        course: new ObjectId(courseId),
        date,
      },
      {
        $set: {
          students: students.map((s: any) => ({
            student: new ObjectId(s.student),
            status: s.status,
            present: s.present,
            timestamp: new Date(),
          })),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: "Attendance updated successfully",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
