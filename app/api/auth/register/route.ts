import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const { name, email, password, role, studentId, department, year } = userData

    const client = await clientPromise
    const db = client.db("attendance_management")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase(),
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 400 })
    }

    // Check if student ID already exists (for students)
    if (role === "student" && studentId) {
      const existingStudent = await db.collection("users").findOne({
        studentId,
        role: "student",
      })

      if (existingStudent) {
        return NextResponse.json({ message: "Student ID already exists" }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user object
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      ...(role === "student" && { studentId, year }),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert user
    const result = await db.collection("users").insertOne(newUser)

    return NextResponse.json({
      message: "User registered successfully",
      userId: result.insertedId,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
