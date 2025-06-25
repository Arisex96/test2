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

    const courses = await db
      .collection("courses")
      .aggregate([
        { $match: { students: new ObjectId(studentId) } },
        {
          $lookup: {
            from: "users",
            localField: "professor",
            foreignField: "_id",
            as: "professor",
          },
        },
        { $unwind: { path: "$professor", preserveNullAndEmptyArrays: true } },
      ])
      .toArray()

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching student courses:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
