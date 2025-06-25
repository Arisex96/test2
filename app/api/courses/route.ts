import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const courseData = await request.json();
    const {
      name,
      code,
      description,
      department,
      credits,
      semester,
      year,
      professor,
    } = courseData;

    const client = await clientPromise;
    const db = client.db("attendance_management");

    // Check if course code already exists
    const existingCourse = await db.collection("courses").findOne({ code });
    if (existingCourse) {
      return NextResponse.json(
        { message: "Course code already exists" },
        { status: 400 }
      );
    }

    const newCourse = {
      name,
      code,
      description,
      department,
      credits,
      semester,
      year,
      professor: new ObjectId(professor),
      students: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("courses").insertOne(newCourse);

    return NextResponse.json({
      message: "Course created successfully",
      courseId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
