import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDemoUsers() {
  try {
    console.log("Seeding demo users...");
    
    const demoUsers = [
      {
        id: "admin-001",
        email: "admin.user@codelabeducare.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        password: "Password1234"
      },
      {
        id: "mentor-001", 
        email: "mentor.smith@codelabeducare.com",
        firstName: "Mentor",
        lastName: "Smith",
        role: "mentor",
        password: "Password1234"
      },
      {
        id: "student-001",
        email: "student.jones@codelabeducare.com", 
        firstName: "Student",
        lastName: "Jones",
        role: "student",
        password: "Password1234"
      }
    ];

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
        if (!existingUser) {
          const hashedPassword = await hashPassword(userData.password);
          await db.insert(users).values({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`✓ Created demo user: ${userData.email}`);
        } else {
          console.log(`✓ Demo user already exists: ${userData.email}`);
        }
      } catch (error) {
        console.log(`✓ Demo user ${userData.email} already exists (caught duplicate key error)`);
      }
    }
    
    console.log("Demo users seeded successfully");
  } catch (error) {
    console.error("Error seeding demo users:", error);
  }
}