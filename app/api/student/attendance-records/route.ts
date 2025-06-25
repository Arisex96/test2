import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const courseId = searchParams.get("courseId");

    if (!studentId) {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance_management");

    let matchFilter: any = {};

    // If courseId is provided, filter by specific course
    if (courseId) {
      matchFilter.course = new ObjectId(courseId);
    }

    // Get all attendance records for the student (optionally filtered by course)
    const attendanceRecords = await db
      .collection("attendance")
      .aggregate([
        { $match: matchFilter },
        { $unwind: "$students" },
        { $match: { "students.student": new ObjectId(studentId) } },
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $project: {
            _id: 1,
            date: 1,
            course: "$course",
            students: [
              {
                student: "$students.student",
                present: "$students.present",
                timestamp: "$students.timestamp",
              },
            ],
            courseInfo: {
              name: "$courseInfo.name",
              code: "$courseInfo.code",
            },
          },
        },
        { $sort: { date: -1 } },
      ])
      .toArray();

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching student attendance records:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
