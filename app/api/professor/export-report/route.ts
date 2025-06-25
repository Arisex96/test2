import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { professorId, courseId, reportType } = await request.json()

    if (!professorId) {
      return NextResponse.json({ message: "Professor ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Build course filter
    const courseFilter =
      courseId === "all"
        ? { professor: new ObjectId(professorId) }
        : { _id: new ObjectId(courseId), professor: new ObjectId(professorId) }

    // Get detailed student reports for export
    const studentReports = await db
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
                  $and: [courseFilter, { students: { $in: ["$$studentId"] } }],
                },
              },
            ],
            as: "enrolledCourses",
          },
        },
        { $unwind: "$enrolledCourses" },
        {
          $lookup: {
            from: "attendance",
            let: { studentId: "$_id", courseId: "$enrolledCourses._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$course", "$$courseId"] },
                },
              },
              { $unwind: "$students" },
              {
                $match: {
                  $expr: { $eq: ["$students.student", "$$studentId"] },
                },
              },
            ],
            as: "attendanceRecords",
          },
        },
        {
          $addFields: {
            totalClasses: { $size: "$attendanceRecords" },
            presentCount: {
              $size: {
                $filter: {
                  input: "$attendanceRecords",
                  cond: { $eq: ["$$this.students.present", true] },
                },
              },
            },
            lateCount: {
              $size: {
                $filter: {
                  input: "$attendanceRecords",
                  cond: { $eq: ["$$this.students.status", "late"] },
                },
              },
            },
            absentCount: {
              $size: {
                $filter: {
                  input: "$attendanceRecords",
                  cond: { $eq: ["$$this.students.present", false] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            attendanceRate: {
              $cond: {
                if: { $gt: ["$totalClasses", 0] },
                then: { $multiply: [{ $divide: ["$presentCount", "$totalClasses"] }, 100] },
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            studentId: 1,
            department: 1,
            year: 1,
            courseName: "$enrolledCourses.name",
            courseCode: "$enrolledCourses.code",
            totalClasses: 1,
            presentCount: 1,
            lateCount: 1,
            absentCount: 1,
            attendanceRate: 1,
          },
        },
      ])
      .toArray()

    // Generate CSV content
    let csvContent = ""

    if (reportType === "detailed") {
      csvContent =
        "Student Name,Student ID,Email,Department,Year,Course,Course Code,Total Classes,Present,Late,Absent,Attendance Rate\n"

      studentReports.forEach((student) => {
        csvContent += `"${student.name}","${student.studentId}","${student.email}","${student.department}","${student.year}","${student.courseName}","${student.courseCode}",${student.totalClasses},${student.presentCount},${student.lateCount},${student.absentCount},${student.attendanceRate.toFixed(2)}%\n`
      })
    }

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-report-${reportType}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })

    return response
  } catch (error) {
    console.error("Error exporting report:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
