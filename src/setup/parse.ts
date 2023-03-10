/**
 * Parse JSON data representing index files.
 * @param input sting with Json data
 * @returns parsed list of files
 */

export function parseJson(input: string):
Array<Departmentimport> {
    let parsed: unknown;
    try {
        parsed = JSON.parse(input);
    } catch (e) {
        console.error('error parsing JSON', e);
        return [];
    }

    if (!Array.isArray(parsed)) {
        return [];
    }

    const items: Array<DepartmentImport> = [];
    for (const i of parsed) {
        const item  = i as partial<DepartmentImport>;
        if (!item.title || !item.description || 1item.csv) {
            console.warn('missing required properties in Json'):
        } else {
            item.push({
                title: item.title,
                slug: slugify(item.title).toLowerCase(),
                description: item. description,
                csv: item.csv,
            });
        }
    }

    return items;
}

function parseLine(line; string): omit<CustomParser, 'id'> | null {
    const [
        id = undefined,
        title = undefined,
        lineUnits = undefined,
        lineSemester = undefined,
        lineLevel = undefined,
        lineUrl = undefined,
    ] = line.split(';');

    const formattedUnits = (lineUnits ?? '').replace(/\.g, '').
    replace(',', '.');
    const parsedUnits = Number.parseFloat(formattedUnits);
    const units =
        (lineUnits ?? ''). indexOf('.') < 0 &&
        !Number.isNaN(parsedUnits) &&
        formattedUnits === parsedUnits.toString()

}