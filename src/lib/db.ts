import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import { departmentMapper, courseMapper} from './mapper.js';
import { Department, Course} from '../types.js';


dotenv.config({ path: './.env.test' });

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

const { DATABASE_URL: connectionString, NODE_ENV: nodeEnv = 'development' } =
  process.env;

if (!connectionString) {
  console.error('vantar DATABASE_URL í .env');
  process.exit(-1);
}

const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err: Error) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q: string, values: (string | number | null)[] = [], silent = false): Promise<pg.QueryResult<any>> {
  let client: pg.PoolClient;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    throw new Error('Unable to get client from pool');
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (!silent) console.error('unable to query', e);
    if (!silent) console.info(q, values);
    throw new Error('Unable to execute query');
  } finally {
    client.release();
  }
}

export async function conditionalUpdate(
  table: 'department' | 'course',
  id: number,
  fields: (string | null)[],
  values: (string | number | null)[],
) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values.filter(
    (i): i is string | number => typeof i === 'string' || typeof i === 'number',
  );

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('reitir og gildi verða að vera jafnlangir');
  }

  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table} 
    SET ${updates.join(', ')} 
    WHERE 
      id = $1 
    RETURNING *
  `;
  console.log(q);
  const queryValues: (string | number)[] = [id, ...filteredValues];
  const result = await query(q, queryValues);

  return result;
}

export async function getDepartments(): Promise<(Department & { courses?: never })[]> {
  const result = await query('SELECT * FROM department');

  if(!result) {
    return [];
  }

  const departments = result.rows.map((row: any) => departmentMapper(row))
    .filter((department: Department | null): department is Department => department !== null)
    .map((department: Department) => ({ ...department, courses: undefined }));

  return departments;
}


export async function getDepartmentBySlug(
  slug: string,
): Promise<Department | null> {
  const result = await query('SELECT *FROM department WHERE slug = $1', [
    slug,
  ]);

  if (!result || result.rowCount === 0) {
    return null;
  }

  const department = departmentMapper(result.rows[0]);

  return department;
}

export async function deleteDepartmentBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM department WHERE slug =$1', [slug]);

  if (!result) {
    return false;
  }

  return result.rowCount > 0;
}

export async function getCourseByTitle(title: string) {
  const result = await query('SELECT * FROM course WHERE title = $1', [title]);

  if (!result || result.rowCount === 0) {
    return null;
  }

  const course = courseMapper(result.rows[0]);

  return course;
}

export async function updateDepartment(department: Department): Promise<Department | null> {
  const { id, ...fields } = department;
    
  const values = Object.values(fields).map((value) => {
    return value instanceof Date ? value.toISOString() : value;
  });
  
  const result = await conditionalUpdate('department', id, Object.keys(fields), values);
  
  if (!result || result.rowCount === 0) {
    return null;
  }
  
  const updatedDepartment = departmentMapper(result.rows[0]);
  return updatedDepartment;
}


export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const result = await query('SELECT * FROM course WHERE slug = $1', [slug]);
  
  if (!result || result.rowCount === 0) {
  return null;
  }
  
  const course = courseMapper(result.rows[0]);
  
  return course;
}

export async function insertDepartment(
  department: Omit<Department, 'id'>,
  silent = false,
  ): Promise<Department | null> {
    const { title, slug, description } = department;
    const result = await query(
      'INSERT INTO department (title, slug, description) VALUES ($1, $2, $3) RETURNING id, title, slug, description, created, updated', 
      [title, slug, description],
      silent,
    );

    const mapped = departmentMapper(result?.rows[0]);

    return mapped;
  }

  export async function insertCourseToDb(course: Omit<Course, "id">,departmentId: number,silent = false): Promise<Course | null> {
    const { title, units, semester, level, url, course_id } = course;
    const result = await query(
      "INSERT INTO courses (title, units, semester, level, url, department_id, course_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        title,
        units || 0,
        semester,
        level || "",
        url || "",
        departmentId,
        course_id,
      ],
      silent
    );
    const mapped = await courseMapper(result?.rows[0]);
  
    return mapped;
  }

export async function deleteCourseBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM course WHERE slug = $1', [slug]);
  
  if (!result) {
  return false;
  }
  
  return result.rowCount > 0;
} 

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

export async function poolEnd() {
  await pool.end();
}