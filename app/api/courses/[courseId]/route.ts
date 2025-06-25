import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("attendance_management")

    const course = await db
      .collection("courses")
      .aggregate([
        { $match: { _id: new ObjectId(params.courseId) } },
        {
          $lookup: {
            from: "users",
            localField: "professor",
            foreignField: "_id",
            as: "professor",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "students",
            foreignField: "_id",
            as: "students",
          },
        },
        { $unwind: { path: "$professor", preserveNullAndEmptyArrays: true } },
      ])
      .toArray()

    if (course.length === 0) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    return NextResponse.json(course[0])
  } catch (error) {
    console.error("Error fetching course:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const updateData = await request.json()
    const { name, description, credits, semester, year } = updateData

    const client = await clientPromise
    const db = client.db("attendance_management")

    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(params.courseId) },
      {
        $set: {
          name,
          description,
          credits,
          semester,
          year,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Course updated successfully" })
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
