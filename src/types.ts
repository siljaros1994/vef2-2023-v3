import { QueryResult } from "pg";

export type Department = {
  id: number;
  title: string;
  slug: string;
  description: string;
  created: Date;
  updated: Date;
};

export enum Semester {
  Vor = "Vor",
  Sumar = "Sumar",
  Vetur = "Heilsárs",
  Haust = "Haust",
}

export type Course = {
  id: number;
  course_id: string;
  department_id?: number;
  title: string;
  units?: number;
  semester: Semester;
  level?: string;
  url: string | undefined;
  created?: Date;
  updated?: Date;
};

export type DepartmentImport = {
  title: string;
  slug: string;
  description: string;
  csv: string;
};