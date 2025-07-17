import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { students, NewStudent } from '../db/schema';

export async function getStudentById(id: number) {
  const [student] = await db.select().from(students).where(eq(students.id, id));
  return student;
}

export async function createStudent(data: NewStudent) {
  const [newStudent] = await db.insert(students).values(data).returning();
  return newStudent;
}
