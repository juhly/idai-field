import {FieldDefinition, FieldResource, IdaiType} from 'idai-components-2';
import {drop, identity, includedIn, indices, is, isNot, isnt, on, reduce, take,
    to, flow, compose, flatMap, isDefined, arrayList, when, flatReduce, range} from 'tsfun';
import {clone} from '../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../c';
import {fillUpToSize} from './export-helper';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const EMPTY = '';
    const SEP = ',';
    const OBJ_SEP = '.';
    const REL_SEP = ';';

    const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param resourceType
     * @param relations
     */
    export function createExportable(resources: FieldResource[],
                                     resourceType: IdaiType,
                                     relations: Array<string>) {

        const headings: string[] = makeHeadings(resourceType, relations);
        const matrix = resources
            .map(toDocumentWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow([headings, matrix],
            expandDating,
            expandDimension(resourceType),
            combine);
    }


    function combine(headings_and_matrix: any) {

        return [headings_and_matrix[0]].concat(headings_and_matrix[1]).map(toCsvLine);
    }


    function expandDating(headings_and_matrix: any) {

        const indexOfDatingElement = headings_and_matrix[0].indexOf('dating');
        return indexOfDatingElement !== -1
            ? expand(
                getInsertableDatingItems,
                rowsWithDatingElementsExpanded,
                headings_and_matrix)([indexOfDatingElement])
            : headings_and_matrix;
    }


    function expandDimension(resourceType: IdaiType) {

        return (headings_and_matrix: any) => {

            return expand(
                    getInsertableDimensionItems,
                    rowsWithDimensionElementsExpanded,
                    headings_and_matrix
                )(getIndices(resourceType.fields, 'dimension')(headings_and_matrix[0]));
        }
    }


    function getIndices(fieldDefinitions: Array<FieldDefinition>, inputType: string) {

        return indices((heading: string) => {

                if (heading.includes(OBJ_SEP)) return false;
                const field = fieldDefinitions.find(on('name', is(heading)));
                if (!field) return false;

                return field.inputType === inputType;
            });
    }


    function expand(replaceFunction: Function, rowsExpansion: Function, headings_and_matrix: any) {

        return reduce((headings_and_matrix: any, index: number) => {

                const [headings, matrix] = headings_and_matrix;

                const max = getMax(index)(matrix);
                if (isNaN(max)) return [headings, matrix]; // TODO review

                return [
                    replaceItems(index, 1, replaceFunction(max))(headings),
                    matrix
                        .map(expandArrayToSize(index, max))
                        .map(rowsExpansion(index, max))];

            }, headings_and_matrix);
    }


    function getMax(indexOfDatingElement: any) {

        return reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[indexOfDatingElement]
                        ? row[indexOfDatingElement].length
                        : 0)

            , 0);
    }


    function makeHeadings(resourceType: IdaiType, relations: Array<string>) {

        return makeFieldNamesList(resourceType)
            .concat(
                relations
                    .filter(isNot(includedIn(HIERARCHICAL_RELATIONS)))
                    .map(relation => 'relations.' + relation))
            .concat([RELATIONS_IS_CHILD_OF]);
    }





    function getInsertableDatingItems(n: number) { return (fieldName: string) => {

        return flatReduce((i: number) => [
                fieldName + OBJ_SEP + i + OBJ_SEP + 'begin.year',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'end.year',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'source',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'label']
            )(range(n));
    }}


    function getInsertableDimensionItems(n:number) { return (fieldName: string) => {

        return flatReduce((i: number) => [
                fieldName + OBJ_SEP + i + OBJ_SEP + 'value',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'inputValue',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'inputRangeEndValue',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'measurementPosition',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'measurementComment',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'inputUnit',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'isImprecise',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'isRange',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'label',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'rangeMin',
                fieldName + OBJ_SEP + i + OBJ_SEP + 'rangeMax']
            )(range(n));
    }}


    function rowsWithDatingElementsExpanded(indexOfDatingElement: number, max: number) {

        return expandHomogeneousItems(indexOfDatingElement, max, 4,
            (removed: any) => {

                return [
                    removed['begin'] && removed['begin']['year'] ? removed['begin']['year'] : undefined,
                    removed['end'] && removed['end']['year'] ? removed['end']['year'] : undefined,
                    removed['source'],
                    removed['label']];
            });
    }


    function rowsWithDimensionElementsExpanded(indexOfDimensionElement: number, max: number) {

        return expandHomogeneousItems(indexOfDimensionElement, max, 11,
            (removed: any) => {

                return [
                    removed['value'],
                    removed['inputValue'],
                    removed['inputRangeEndValue'],
                    removed['measurementPosition'],
                    removed['measurementComment'],
                    removed['inputUnit'],
                    removed['isImprecise'],
                    removed['isRange'],
                    removed['label'],
                    removed['rangeMin'],
                    removed['rangeMax']];
            });
    }


    function expandArrayToSize(where: number, targetSize: number) {

        return expandHomogeneousItems(where, 1, targetSize, identity);
    }


    /**
     * Takes itms, for example [A,B,C,D,E]
     * and replaces one or more entries by a number of same-structured entries.
     *
     * Lets assume where is 2, nrOfNewItems is 2 and widthOfEachNewitem is 2, then
     * we get
     * [A,B,R1a,R1b,R2a,R2b,E]
     * where the R1 entries replace the C entry
     *   and the R2 entries replace the D enty
     *
     * @param where
     * @param nrOfNewItems
     * @param widthOfEachNewItem
     * @param computeReplacement should return an array of size widthOfEachNewItem
     */
    function expandHomogeneousItems(where: number,
                                    nrOfNewItems: number,
                                    widthOfEachNewItem: number,
                                    computeReplacement: (removed: any) => any[]|undefined) {

        return replaceItems(
            where,
            nrOfNewItems,
            flatMap(compose<any>(
                when(isDefined, computeReplacement, []),
                fillTo(widthOfEachNewItem))));
    }


    function replaceItems<A>(where: number,
                             nrOfNewItems: number,
                             replace: (_: A[]) => A[]) {

        /**
         * @param itms
         */
        return (itms: A[]) => {

            const replacements =
                flow(itms,
                    drop(where),
                    take(nrOfNewItems),
                    replace);

            return take(where)(itms)
                .concat(replacements)
                .concat(drop(where + nrOfNewItems)(itms));
        }
    }


    /**
     * resource.relations = { someRel: ['val1', 'val2] }
     * ->
     * resource['relations.someRel'] = 'val1; val2'
     *
     * @param resource
     * @returns a new resource instance, where relations are turned into fields.
     */
    function toDocumentWithFlattenedRelations(resource: FieldResource): FieldResource {

        const cloned = clone(resource); // so we can modify in place

        if (!cloned.relations) return cloned;
        for (let relation of Object.keys(cloned.relations)) {
            cloned['relations.' + relation] = cloned.relations[relation].join(REL_SEP);
        }
        delete cloned.relations;

        if (cloned[RELATIONS_LIES_WITHIN]) {
            delete cloned[RELATIONS_IS_RECORDED_IN];
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_LIES_WITHIN];
        }
        else if (cloned[RELATIONS_IS_RECORDED_IN]) {
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_IS_RECORDED_IN];
            delete cloned[RELATIONS_IS_RECORDED_IN];
        }

        return cloned;
    }


    function toRowsArrangedBy(fieldNames: string[]) {

        return (resource: FieldResource) => {

            const newRow = arrayList(fieldNames.length);

            return getUsableFieldNames(Object.keys(resource))
                .reduce((row, fieldName) =>  {

                    const indexOfFoundElement = fieldNames.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) {

                        row[indexOfFoundElement] = (resource as any)[fieldName];
                    }
                    return row;
                }, newRow);
        }
    }


    function makeFieldNamesList(resourceType: IdaiType) {

        let fieldNames: string[] = getUsableFieldNames(resourceType.fields.map(to('name')));
        const indexOfShortDescription = fieldNames.indexOf('shortDescription');
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift('shortDescription');
        }
        fieldNames = fieldNames.filter(isnt('identifier'));
        fieldNames.unshift('identifier');
        return fieldNames;
    }


    function getUsableFieldNames(fieldNames: string[]): string[] {

        return fieldNames
            .filter(isnt('type'))
            .filter(isnt('geometry'))
            .filter(isnt('id'));
    }


    function fillTo(targetSize: number) {

        /**
         * @param items may be undefined
         */
        return (items: any[]|undefined) => fillUpToSize(targetSize, EMPTY)(items ? items : [])
    }


    const toCsvLine = (as: string[]): string => as.join(SEP);
}