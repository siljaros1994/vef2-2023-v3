import { Pool } from 'pg';
import { Course, Semester } from '../types';
import { courseMapper, coursesMapper } from './mapper';

export class CoursesDAO {
    private readonly pool: Pool;
  
    constructor(pool: Pool) {
      this.pool = pool;
    }
  
    async getCourseById(id: number): Promise<Course | null> {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
        const course = courseMapper(result.rows[0]);
        return course;
      } finally {
        client.release();
      }
    }
  
    async getCoursesByDepartmentId(departmentId: number): Promise<Course[]> {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT * FROM courses WHERE department_id = $1', [departmentId]);
        const courses = coursesMapper(result);
        return courses;
      } finally {
        client.release();
      }
    }
  
    async createCourse(course: Omit<Course, 'id'>): Promise<Course | null> {
      const client = await this.pool.connect();
      try {
        if (!Object.values(Semester).includes(course.semester)) {
            throw new Error(`Invalid semester value: ${course.semester}`);
          }
          const semesterValue = Semester[course.semester as keyof typeof Semester].toUpperCase();
          const result = await client.query(
            `INSERT INTO courses (course_id, department_id, title, units, semester, level, url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [course.course_id, course.department_id, course.title, course.units, semesterValue, course.level, course.url]
          );
          const createdCourse = courseMapper(result.rows[0]);
          return createdCourse;
        } finally {
          client.release();
        }
      }
  
    async updateCourse(id: number, course: Partial<Omit<Course, 'id'>>): Promise<Course | null> {
      const client = await this.pool.connect();
      try {
        const setClauses = Object.entries(course)
          .map(([key, value]) => `${key} = $${Number.isNaN(Number(key)) ? 0 : Number(key)}`)
          .join(', ');
        const values = Object.values(course);
        values.unshift(id);
        const result = await client.query(
          `UPDATE courses SET ${setClauses} WHERE id = $1 RETURNING *`,
          values
        );
        const updatedCourse = courseMapper(result.rows[0]);
        return updatedCourse;
      } finally {
        client.release();
      }
    }

    async listCourses(): Promise<Course[]> {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT * FROM courses');
        const courses = coursesMapper(result);
        return courses;
      } finally {
        client.release();
      }
    }
    
  
    async deleteCourse(id: number): Promise<boolean> {
      const client = await this.pool.connect();
      try {
        const result = await client.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
        const deletedCourse = courseMapper(result.rows[0]);
        return !!deletedCourse;
      } finally {
        client.release();
      }
    }
  }
