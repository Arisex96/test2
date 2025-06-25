import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    const client = await clientPromise
    const db = client.db("attendance_management")

    const attendance = await db.collection("attendance").findOne({
      course: new ObjectId(params.courseId),
      date,
    })

    if (!attendance) {
      return NextResponse.json({ message: "No attendance record found for this date" }, { status: 404 })
    }

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
