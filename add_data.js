// MongoDB Database Seeding Script
// Run this script to populate the database with sample data

const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const uri =
  "mongodb+srv://rashmi_ch96:my_db%40acc96@cluster0.uffpebx.mongodb.net/attendance_management?retryWrites=true&w=majority"

async function seedDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("attendance_management")

    console.log("Connected to MongoDB")

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("courses").deleteMany({})
    await db.collection("attendance").deleteMany({})

    console.log("Cleared existing data")

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 12)

    // Sample professors
    const professors = [
      {
        name: "Dr. John Smith",
        email: "john.smith@college.edu",
        password: hashedPassword,
        role: "professor",
        department: "Computer Science",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@college.edu",
        password: hashedPassword,
        role: "professor",
        department: "Mathematics",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const professorResult = await db.collection("users").insertMany(professors)
    console.log("Created professors")

    // Sample students
    const students = [
      {
        name: "Alice Brown",
        email: "alice.brown@student.edu",
        password: hashedPassword,
        role: "student",
        studentId: "STU001",
        department: "Computer Science",
        year: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bob Wilson",
        email: "bob.wilson@student.edu",
        password: hashedPassword,
        role: "student",
        studentId: "STU002",
        department: "Computer Science",
        year: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Carol Davis",
        email: "carol.davis@student.edu",
        password: hashedPassword,
        role: "student",
        studentId: "STU003",
        department: "Computer Science",
        year: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "David Miller",
        email: "david.miller@student.edu",
        password: hashedPassword,
        role: "student",
        studentId: "STU004",
        department: "Mathematics",
        year: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const studentResult = await db.collection("users").insertMany(students)
    console.log("Created students")

    // Sample courses
    const courses = [
      {
        name: "Introduction to Programming",
        code: "CS101",
        description: "Basic programming concepts and problem-solving techniques",
        department: "Computer Science",
        credits: 3,
        semester: "Fall",
        year: "2024",
        professor: Object.values(professorResult.insertedIds)[0],
        students: [
          Object.values(studentResult.insertedIds)[0],
          Object.values(studentResult.insertedIds)[1],
          Object.values(studentResult.insertedIds)[2],
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Data Structures",
        code: "CS201",
        description: "Advanced data structures and algorithms",
        department: "Computer Science",
        credits: 4,
        semester: "Spring",
        year: "2024",
        professor: Object.values(professorResult.insertedIds)[0],
        students: [Object.values(studentResult.insertedIds)[1], Object.values(studentResult.insertedIds)[2]],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Calculus I",
        code: "MATH101",
        description: "Introduction to differential and integral calculus",
        department: "Mathematics",
        credits: 4,
        semester: "Fall",
        year: "2024",
        professor: Object.values(professorResult.insertedIds)[1],
        students: [Object.values(studentResult.insertedIds)[3]],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const courseResult = await db.collection("courses").insertMany(courses)
    console.log("Created courses")

    // Sample attendance records
    const attendanceRecords = []
    const courseIds = Object.values(courseResult.insertedIds)
    const studentIds = Object.values(studentResult.insertedIds)

    // Generate attendance for the past 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      // CS101 attendance
      attendanceRecords.push({
        course: courseIds[0],
        date: dateStr,
        students: [
          { student: studentIds[0], present: Math.random() > 0.2 },
          { student: studentIds[1], present: Math.random() > 0.15 },
          { student: studentIds[2], present: Math.random() > 0.25 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // CS201 attendance (every other day)
      if (i % 2 === 0) {
        attendanceRecords.push({
          course: courseIds[1],
          date: dateStr,
          students: [
            { student: studentIds[1], present: Math.random() > 0.1 },
            { student: studentIds[2], present: Math.random() > 0.2 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // MATH101 attendance (3 times a week)
      if (i % 3 === 0) {
        attendanceRecords.push({
          course: courseIds[2],
          date: dateStr,
          students: [{ student: studentIds[3], present: Math.random() > 0.3 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    await db.collection("attendance").insertMany(attendanceRecords)
    console.log("Created attendance records")

    console.log("Database seeded successfully!")
    console.log("\nSample login credentials:")
    console.log("Professor: john.smith@college.edu / password123")
    console.log("Professor: sarah.johnson@college.edu / password123")
    console.log("Student: alice.brown@student.edu / password123")
    console.log("Student: bob.wilson@student.edu / password123")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seedDatabase()
