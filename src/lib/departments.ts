import { Pool, QueryResult } from 'pg';
import { Department } from '../types';

export class DepartmentsDAO {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getDepartmentById(id: number): Promise<Department | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM departments WHERE id = $1', [id]);
      const department = departmentMapper(result.rows[0]);
      return department;
    } finally {
      client.release();
    }
  }

  async getAllDepartments(): Promise<Department[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM departments');
      const departments = departmentsMapper(result);
      return departments;
    } finally {
      client.release();
    }
  }
}

function departmentMapper(row: any): Department | null {
  if (!row) {
    return null;
  }

  const department: Department = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    created: row.created,
    updated: row.updated,
  };

  return department;
}

function departmentsMapper(result: QueryResult<any>): Department[] {
  const rows = result.rows;
  const departments = rows.map((row) => departmentMapper(row)).filter((department) => department !== null) as Department[];
  return departments;
}
