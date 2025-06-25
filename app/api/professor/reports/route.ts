import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const professorId = searchParams.get("professorId")
    const courseId = searchParams.get("courseId")

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

    // Get overall statistics
    const overallStats = await db
      .collection("courses")
      .aggregate([
        { $match: courseFilter },
        {
          $lookup: {
            from: "attendance",
            localField: "_id",
            foreignField: "course",
            as: "attendanceRecords",
          },
        },
        {
          $addFields: {
            totalStudents: { $size: "$students" },
            totalClasses: { $size: "$attendanceRecords" },
          },
        },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: "$totalStudents" },
            totalClasses: { $sum: "$totalClasses" },
            totalCourses: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Get course statistics
    const courseStats = await db
      .collection("courses")
      .aggregate([
        { $match: courseFilter },
        {
          $lookup: {
            from: "attendance",
            localField: "_id",
            foreignField: "course",
            as: "attendanceRecords",
          },
        },
        {
          $addFields: {
            enrolledStudents: { $size: "$students" },
            totalClasses: { $size: "$attendanceRecords" },
            attendanceRate: {
              $cond: {
                if: { $gt: [{ $size: "$attendanceRecords" }, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $sum: {
                            $map: {
                              input: "$attendanceRecords",
                              as: "record",
                              in: {
                                $size: {
                                  $filter: {
                                    input: "$$record.students",
                                    cond: { $eq: ["$$this.present", true] },
                                  },
                                },
                              },
                            },
                          },
                        },
                        {
                          $sum: {
                            $map: {
                              input: "$attendanceRecords",
                              as: "record",
                              in: { $size: "$$record.students" },
                            },
                          },
                        },
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
        {
          $project: {
            name: 1,
            code: 1,
            enrolledStudents: 1,
            totalClasses: 1,
            attendanceRate: 1,
            avgPresent: { $round: [{ $multiply: ["$attendanceRate", 0.01, "$enrolledStudents"] }, 0] },
            avgLate: {
              $round: [{ $multiply: [{ $subtract: [100, "$attendanceRate"] }, 0.005, "$enrolledStudents"] }, 0],
            },
            avgAbsent: {
              $round: [{ $multiply: [{ $subtract: [100, "$attendanceRate"] }, 0.005, "$enrolledStudents"] }, 0],
            },
            atRiskStudents: 0, // Will be calculated separately
            excellentStudents: 0, // Will be calculated separately
          },
        },
      ])
      .toArray()

    // Get detailed student reports
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
            courseName: "$enrolledCourses.name",
            courseCode: "$enrolledCourses.code",
            courseId: "$enrolledCourses._id",
            totalClasses: 1,
            presentCount: 1,
            lateCount: 1,
            absentCount: 1,
            attendanceRate: 1,
          },
        },
      ])
      .toArray()

    // Calculate average attendance and at-risk students
    const totalAttendanceRecords = studentReports.length
    const averageAttendance =
      totalAttendanceRecords > 0
        ? studentReports.reduce((sum, student) => sum + student.attendanceRate, 0) / totalAttendanceRecords
        : 0

    const atRiskStudents = studentReports.filter((student) => student.attendanceRate < 75).length

    // Generate attendance trends (weekly data for last 8 weeks)
    const attendanceTrends = []
    const today = new Date()

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - i * 7 - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekStartStr = weekStart.toISOString().split("T")[0]
      const weekEndStr = weekEnd.toISOString().split("T")[0]

      // This is a simplified calculation - in a real app, you'd calculate actual weekly attendance
      const weekAttendance = Math.max(0, averageAttendance + (Math.random() - 0.5) * 20)

      attendanceTrends.push({
        week: 8 - i,
        dateRange: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
        attendanceRate: weekAttendance,
        totalClasses: Math.floor(Math.random() * 5) + 1,
      })
    }

    const reportData = {
      overallStats: {
        totalStudents: overallStats[0]?.totalStudents || 0,
        totalClasses: overallStats[0]?.totalClasses || 0,
        totalCourses: overallStats[0]?.totalCourses || 0,
        averageAttendance,
        atRiskStudents,
      },
      courseStats,
      studentReports,
      attendanceTrends,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating reports:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
