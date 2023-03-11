import { Department, Course } from './types.ts';

export function departmentMapper(input: any): Department {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    description: input.description,
  };
}

export function courseMapper(input: any): Course {
  return {
    id: input.courseId,
    title: input.title,
    units: input.units || null,
    semester: input.semester,
    level: input.level || null,
    url: input.url || null,
  };
}
