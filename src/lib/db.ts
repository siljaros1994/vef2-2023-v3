import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import { departmentMapper, courseMapper} from './mapper.js';
import { Department } from './types.s';


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

export async function query(
  q: string,
  values: (string | number | null)[] = []
): Promise<pg.QueryResult<unknown>> {
  let client: pg.PoolClient;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('unable to query', e);
    console.info(q, values);
    return null;
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
    return null;
  }

  const departments = departmentsMapper(result.rows).map((d) => {
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

  if (!result) {
    return null;
  }

  const department = departmentMapper(result.rows[0]);

  return department;
}

export async function deleteDepartmentBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM department WHERE slug =$1', [slug]);

  if (result.rowCount === 0) {
    return false;
  }

  return true;
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}