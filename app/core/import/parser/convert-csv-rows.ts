import {reduce, map, ObjectStruct, arrayList, values, isArray, isnt, unique, flow, filter, forEach, isNot} from 'tsfun';
import {ParserErrors} from './parser-errors';
import {includes, longerThan, startsWith} from '../util';
import CSV_PATH_ITEM_TYPE_MISMATCH = ParserErrors.CSV_PATH_ITEM_TYPE_MISMATCH;
import CSV_INCONSISTENT_ARRAY = ParserErrors.CSV_INCONSISTENT_ARRAY;


const PATH_SEPARATOR = '.';

type Field = string;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 *
 * @throws [ParserErrors.CSV_INVALID_HEADING, columnHeading] if inconsistent headings found
 *   this can be the case when the leafs and nodes of nested associatives are both set as
 *   - with an array: dim.0 and dim.0.a cannot be both set at the same time
 *   - with an object: dim.a and dim.a.b cannot be both set at the same time
 *
 * @throws [ParserErrors.CSV_ROWS_LENGTH_MISMATCH, rowIndex] (rowIndex starting from 1)
 *   if length of a row does not match the length of the header
 *
 * @throws [CSV_PATH_ITEM_TYPE_MISMATCH, mismatching segments]
 *   if at a certain point in a path, there is a clash because on the one hand an array index
 *   and on the other hand an object key is defined
 */
export function convertCsvRows(separator: string) {

    return (content: string): Array<ObjectStruct> => {

        const rows: string[][] = getRows(content, separator);
        if (rows.length < 0) return [];
        const headings: string[] = rows.shift() as string[];
        assertHeadingsIsntEmptyandDoesntContainEmptyEntries(headings);
        assertHeadingsConsistent(headings);
        assertHeadingsDoNotContainIncompleteArrays(headings);
        assertRowsAndHeadingLengthsMatch(headings, rows);
        return map((row: string[]) => convertRowToStruct(headings, row))(rows);
    }
}


function assertHeadingsIsntEmptyandDoesntContainEmptyEntries(headings: string[]) {

    // current implementation of parser gives at least ['']
    if (headings.length === 0) throw Error('illegal argument');

    if (headings.includes('')) throw [ParserErrors.CSV_HEADING_EMPTY_ENTRY];
}


function assertHeadingsDoNotContainIncompleteArrays(headings: string[]) {

    if (headings.length === 0) return;
    if (headings.includes('')) throw Error('illegal argument');

    const numbers: number[] =
        headings
            .map(heading => heading.split(PATH_SEPARATOR)[0])
            .map((s: string) => parseInt(s)) // deliberate use of explicit form to avoid cases where '0' was parsed to NaN
            .filter(isNot(isNaN))
            .sort();

    if (numbers.length !== 0 && numbers.length !== headings.length) {
        throw [CSV_PATH_ITEM_TYPE_MISMATCH, headings];
    }
    unique(numbers).forEach((n, i) => {
        if (n !== i) throw [CSV_INCONSISTENT_ARRAY, numbers];
    });

    flow(headings,
        reduce((group, heading: any) => {

            const first = heading.split(PATH_SEPARATOR).slice(0)[0];
            const rest = heading.split(PATH_SEPARATOR).slice(1).join(PATH_SEPARATOR);

            if (!group[first]) group[first] = [];
            group[first].push(rest);
            return group;

        }, {} as {[_:string]:any}),
        values,
        filter(isArray),
        map(filter(isnt(''))),
        forEach(assertHeadingsDoNotContainIncompleteArrays));
}


function assertRowsAndHeadingLengthsMatch(headings: string[], rows: string[][]) {

    let i = 1;
    for (let row of rows) {
        if (row.length !== headings.length) throw [ParserErrors.CSV_ROW_LENGTH_MISMATCH, i];
        i++;
    }
}


function assertHeadingsConsistent(headings: string[]) {

    headings
        .filter(includes(PATH_SEPARATOR))
        .forEach(heading => {

        headings
            .filter(startsWith(heading))
            .filter(longerThan(heading))
            .forEach(() => { throw [ParserErrors.CSV_INVALID_HEADING, heading]; });
    });
}


function convertRowToStruct(headings: string[], row: string[]): any {

    return reduce((struct, fieldOfRow, i: number) => {
        insertFieldIntoDocument(struct, headings[i], fieldOfRow);
        return struct as ObjectStruct;
    }, {})(row);
}


const convertIfEmpty = (val: string) => val === '' ? null : val;


function insertFieldIntoDocument(struct: any, fieldOfHeading: string, fieldOfRow: any) {

    if (fieldOfHeading.includes(PATH_SEPARATOR)) {
        implodePaths(struct, fieldOfHeading.split(PATH_SEPARATOR), fieldOfRow);
    } else {
        (struct as any)[fieldOfHeading] = convertIfEmpty(fieldOfRow);
    }
}


function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

    let index = parseInt(pathSegments[0]);
    if (isNaN(index)) index = pathSegments[0];

    if (pathSegments.length < 2) {
        currentSegmentObject[index] = convertIfEmpty(val);
        return;
    }

    const nextIndex = parseInt(pathSegments[1]);
    const newItem = isNaN(nextIndex) ? {} : arrayList(nextIndex + 1);

    if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

    pathSegments.shift();
    implodePaths(currentSegmentObject[index], pathSegments, val);
}


function getRows(content: string, separator: string): Field[][] {

    let rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField: string = '';

    let inQuotes: boolean = false;
    let lastCharacter: 'quote'|'linebreak'|'other' = 'other';

    for (let character of content) {
        switch(character) {
            case '"':
                if (lastCharacter === 'quote') {
                    currentField += '"';
                    lastCharacter = 'other';
                } else {
                    lastCharacter = 'quote';
                }
                break;
            case separator:
                if (lastCharacter === 'quote') inQuotes = !inQuotes;
                if (inQuotes) {
                    currentField += separator;
                } else {
                    addFieldToRow(currentField, currentRow);
                    currentField = '';
                }
                lastCharacter = 'other';
                break;
            case '\n':
            case '\r':
                if (lastCharacter === 'quote') inQuotes = !inQuotes;
                if (lastCharacter !== 'linebreak') {
                    if (inQuotes) {
                        currentField += '\n';
                    } else {
                        addFieldToRow(currentField, currentRow);
                        rows.push(currentRow);
                        currentField = '';
                        currentRow = [];
                    }
                    lastCharacter = 'linebreak';
                }
                break;
            default:
                if (lastCharacter === 'quote') inQuotes = !inQuotes;
                lastCharacter = 'other';
                currentField += character;
                break;
        }
    }

    if (lastCharacter !== 'linebreak') addFieldToRow(currentField, currentRow);
    if (currentRow.length > 0) rows.push(currentRow);

    return rows;
}


function addFieldToRow(field: string, row: string[]) {

    if (field === '"') field = '';
    row.push(field);
}