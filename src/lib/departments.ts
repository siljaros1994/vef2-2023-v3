import { Pool, QueryResult } from 'pg';
import { Department } from '../types.js';

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

  async createDepartment(department: Department): Promise<Department | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO departments (title, slug, description, created, updated) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [department.title, department.slug, department.description, department.created, department.updated]
      );
      const createdDepartment = departmentMapper(result.rows[0]);
      return createdDepartment;
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

  async deleteDepartment(id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM departments WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department | null> {
    const client = await this.pool.connect();
    try {
      const existingDepartment = await this.getDepartmentById(id);
      if (!existingDepartment) {
        return null;
      }

      const updatedDepartment: Department = {
        ...existingDepartment,
        ...updates,
        updated: new Date(),
      };

      const result = await client.query(
        'UPDATE departments SET title = $1, slug = $2, description = $3, updated = $4 WHERE id = $5 RETURNING *',
        [updatedDepartment.title, updatedDepartment.slug, updatedDepartment.description, updatedDepartment.updated, id]
      );

      const department = departmentMapper(result.rows[0]);
      return department;
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
