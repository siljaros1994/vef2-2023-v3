import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { insertCourseToDb, insertDepartment, poolEnd, query} from '../lib/db.js'
import { Department } from '../types';
import { parseCsv, parseJson } from './parse.js';

dotenv.config();

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';
const DATA_DIR = './data';

export async function createSchema(schemaFile = SCHEMA_FILE) {
    const data = await readFile(schemaFile);

    return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
    const data = await readFile(dropFile);

    return query(data.toString('utf-8'));
}

async function setup() {
    const drop = await dropSchema();

    if (drop) {
        console.info('schema dropped');
    } else {
        console.info('schema not dropped, exiting');
        poolEnd();
        return process.exit(-1);
    }
    
    const result = await createSchema();
    if (result) {
        console.info('schema created');
    } else {
        console.info('schema not created, exiting');
        poolEnd();
        return process.exit(-1);
    }

    const indexFile = await readFile(join(DATA_DIR, "index.json"));
    const indexData = parseJson(indexFile.toString("utf-8"));

    for (const item of indexData) {
        const csvFile = await readFile(join(DATA_DIR, item.csv), {
             encoding: 'latin1',
         });
        const courses = parseCsv(csvFile);

        const department: Omit<Department, 'id'> = {
            title: item.title,
            slug: item.slug,
            description: item.description,
            created: new Date(),
            updated: new Date(),
        };

    const insertedDept = await insertDepartment(department, false);

    if (!insertedDept) {
        console.error('unable to insert department', item);
        continue;
    }

    let validInserts = 0;
    let invalidInsets = 0;

    for (const course of courses) {
        const id = await insertCourseToDb(course, insertedDept.id, true);
        if (id) {
            validInserts++;
        } else {
            invalidInsets++;
        }
    }

    console.info(`Created department ${item.title} with ${validInserts} courses and ${invalidInsets} invalid courses.`);
    
}
await poolEnd();
}

setup().catch((err) => {
    console.log(err);
    console.error('error running setup');
    poolEnd();
});