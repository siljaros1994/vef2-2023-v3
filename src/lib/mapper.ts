import { QueryResult } from "pg";
import { Department, Course, Semester } from '../types.js';

export function valueToSemester(value: string): Semester | undefined {
  const lowerValue = value.toLowerCase();
  switch (lowerValue) {
    case "vor":
      return Semester.Vor;
    case "haust":
      return Semester.Haust;
    case "sumar":
      return Semester.Sumar;
    default:
      return undefined;
  }
}
  
export function departmentMapper(input: unknown): Department | null {
  const potentialDepartment = input as Partial<Department> | null;
  if (!potentialDepartment || !potentialDepartment.id || !potentialDepartment.title || !potentialDepartment.slug || !potentialDepartment.description || !potentialDepartment.created || !potentialDepartment.updated) {
    return null;
  }
  const department: Department = {
    id: potentialDepartment.id,
    title: potentialDepartment.title,
    slug: potentialDepartment.slug,
    description: potentialDepartment.description,
    created: potentialDepartment.created,
    updated: potentialDepartment.updated,
  };
  return department;
}
  
export function departmentsMapper( input: QueryResult<any> | null ): Array<Department> {
  if (!input) {
    return [];
  }
  return input.rows.map((row) => departmentMapper(row)).filter((department): department is Department => department !== null);
  }
   
export function courseMapper(input: unknown): Course | null{
  const potentialCourse = input as Partial<Course> | null;

  if (!potentialCourse) {
    return null;
  }

  const requiredFields = [
    'id',
    'course_id',
    'department_id',
    'title',
    'units',
    'semester',
    'level',
    'url',
    'created',
    'updated'
  ];

  const isMissingField = requiredFields.some(field => !(field in potentialCourse));

  if (isMissingField) {
    return null;
  }

  const course: Course = {
    id: potentialCourse.id!,
    course_id: potentialCourse.course_id!,
    department_id: potentialCourse.department_id!,
    title: potentialCourse.title!,
    units: potentialCourse.units!,
    semester: potentialCourse.semester!,
    level: potentialCourse.level!,
    url: potentialCourse.url!,
    created: new Date(potentialCourse.created!),
    updated: new Date(potentialCourse.updated!)
  };
  return course;
}
  
export function coursesMapper(input: QueryResult<any> | null): Course[] {
  if (!input) {
    return [];
  }
  return input.rows.map((row) => courseMapper(row)).filter((course): course is Course => course !== null);
}
