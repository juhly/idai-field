import {flatMap, range} from 'tsfun';
import {ValOptionalEndVal} from 'idai-components-2/index';
import {CsvExportConsts} from './csv-export-consts';


export module CsvHeadingsExpansion {

    import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;

    export function expandValOptionalEndValHeadings(fieldName: string) {

        return [
            fieldName + OBJECT_SEPARATOR + ValOptionalEndVal.VALUE,
            fieldName + OBJECT_SEPARATOR + ValOptionalEndVal.ENDVALUE
        ];
    }


    export function expandDatingHeadings(n: number) {

        return (fieldName: string) => {

            return flatMap(i => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'type',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'margin',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'source',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isUncertain']
            )(range(n));
        }
    }


    export function expandDimensionHeadings(n:number) {

        return (fieldName: string) => {

            return flatMap(i => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputRangeEndValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementPosition',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementComment',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputUnit',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise']
            )(range(n));
        }
    }
}
