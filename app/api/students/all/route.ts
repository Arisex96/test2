import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("attendance_management")

    const students = await db
      .collection("users")
      .find(
        { role: "student" },
        {
          projection: {
            name: 1,
            email: 1,
            studentId: 1,
            department: 1,
            year: 1,
          },
        },
      )
      .toArray()

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching all students:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
