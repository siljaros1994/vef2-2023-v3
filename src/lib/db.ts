import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import { departmentMapper, courseMapper} from './mapper.ts';
import { Department, Course} from './types.ts';


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

export async function query(q: string, values: (string | number | null)[] = []): Promise<pg.QueryResult<any>> {
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
    console.error('unable to query', e);
    console.info(q, values);
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

export async function getDepartments(): Promise<Department[]> {
  const result = await query('SELECT * FROM department');

  if(!result) {
    return [];
  }

  const departments = departmentMapper(result.rows).map((d: Department) => {
    delete d.courses;
    return d;
  });

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

export async function createDepartment(department: Omit<Department, 'id' | 'courses'>): Promise<Department> {
  const q = 'INSERT INTO department (name, slug, description) VALUES ($1, $2, $3) RETURNING *';
  const values = [department.name, department.slug, department.description];
  
  const result = await query(q, values);
  
  if (!result || result.rows.length === 0) {
    return null;
  }
  
  const createdDepartment = departmentMapper(result.rows[0]);
  return createdDepartment;
}

export async function updateDepartment(department: Department): Promise<Department> {
  const { id, ...fields } = department;
    
  const result = await conditionalUpdate('department', id, Object.keys(fields), Object.values(fields));
    
  if (!result || result.rowCount === 0) {
    return null;
  }
    
  const updatedDepartment = departmentMapper(result.rows[0]);
  return updatedDepartment;
}

export async function getCourses(): Promise<Course[] | null> {
  try {
    const result = await query('SELECT * FROM course');

    if (!result) {
      throw new Error('Unable to fetch courses');
    }

    const courses = courseMapper(result.rows);

    return courses;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const result = await query('SELECT * FROM course WHERE slug = $1', [slug]);
  
  if (!result || result.rowCount === 0) {
  return null;
  }
  
  const course = courseMapper(result.rows[0]);
  
  return course;
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