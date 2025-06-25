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

    const courses = await db
      .collection("courses")
      .aggregate([
        { $match: { professor: new ObjectId(professorId) } },
        {
          $lookup: {
            from: "users",
            localField: "students",
            foreignField: "_id",
            as: "students",
          },
        },
      ])
      .toArray()

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching professor courses:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
