import { Pool } from 'pg';
import { DepartmentsDAO } from '../lib/departments';

describe('DepartmentsDAO', () => {
  let dao: DepartmentsDAO;
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/testdb',
      ssl: process.env.NODE_ENV === 'production',
    });
    dao = new DepartmentsDAO(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should retrieve department by id', async () => {
    const department = await dao.getDepartmentById(1);
    expect(department).not.toBeNull();
    expect(department?.title).toBe('Computer Science');
  });

  it('should retrieve all departments', async () => {
    const departments = await dao.getAllDepartments();
    expect(departments).toHaveLength(2);
  });

  it('should create a new department', async () => {
    const newDepartment = {
      title: 'Electrical Engineering',
      slug: 'electrical-engineering',
      description: 'The study of electrical systems and technology',
      created: new Date(),
      updated: new Date(),
    };
    const createdDepartment = await dao.createDepartment(newDepartment);
    expect(createdDepartment).not.toBeNull();
    expect(createdDepartment?.title).toBe('Electrical Engineering');
  });

  it('should update an existing department', async () => {
    const updates = {
      title: 'Computer Science and Engineering',
      description: 'The study of computing and engineering',
    };
    const updatedDepartment = await dao.updateDepartment(1, updates);
    expect(updatedDepartment).not.toBeNull();
    expect(updatedDepartment?.title).toBe('Computer Science and Engineering');
    expect(updatedDepartment?.description).toBe('The study of computing and engineering');
  });

  it('should delete an existing department', async () => {
    await dao.deleteDepartment(2);
    const departments = await dao.getAllDepartments();
    expect(departments).toHaveLength(1);
  });
});
