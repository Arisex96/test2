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

    // Get all students enrolled in professor's courses with their attendance rates
    const students = await db
      .collection("users")
      .aggregate([
        { $match: { role: "student" } },
        {
          $lookup: {
            from: "courses",
            let: { studentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [{ professor: new ObjectId(professorId) }, { students: { $in: ["$$studentId"] } }],
                },
              },
            ],
            as: "enrolledCourses",
          },
        },
        {
          $lookup: {
            from: "attendance",
            let: { studentId: "$_id" },
            pipeline: [
              { $unwind: "$students" },
              { $match: { $expr: { $eq: ["$students.student", "$$studentId"] } } },
              {
                $lookup: {
                  from: "courses",
                  localField: "course",
                  foreignField: "_id",
                  as: "courseInfo",
                },
              },
              { $unwind: "$courseInfo" },
              { $match: { "courseInfo.professor": new ObjectId(professorId) } },
            ],
            as: "attendanceRecords",
          },
        },
        {
          $addFields: {
            attendanceRate: {
              $cond: {
                if: { $gt: [{ $size: "$attendanceRecords" }, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: "$attendanceRecords",
                              cond: { $eq: ["$$this.students.present", true] },
                            },
                          },
                        },
                        { $size: "$attendanceRecords" },
                      ],
                    },
                    100,
                  ],
                },
                else: 0,
              },
            },
          },
        },
        { $match: { enrolledCourses: { $ne: [] } } },
        {
          $project: {
            name: 1,
            email: 1,
            studentId: 1,
            department: 1,
            year: 1,
            enrolledCourses: { _id: 1, name: 1, code: 1 },
            attendanceRate: 1,
          },
        },
      ])
      .toArray()

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching professor students:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
