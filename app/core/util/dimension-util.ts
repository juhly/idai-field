import {DecimalPipe} from '@angular/common';
import {Dimension} from 'idai-components-2';


/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export module DimensionUtil {

    export function addNormalizedValues(dimension: Dimension) {

        if (dimension.isRange) {
            dimension.rangeMin = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
            dimension.rangeMax = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputRangeEndValue);
            delete(dimension.value);
        } else {
            dimension.value = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
        }
    }


    export function generateLabel(dimension: Dimension, decimalPipe: DecimalPipe): string {

        let label = (dimension.isImprecise ? 'ca. ' : '');

        if (dimension.isRange) {
            label += decimalPipe.transform(dimension.inputValue) + '-'
                + decimalPipe.transform(dimension.inputRangeEndValue);
        } else {
            label += decimalPipe.transform(dimension.inputValue);
        }

        label += ' ' + dimension.inputUnit;

        if (dimension.measurementPosition) label += ', Gemessen an ' + dimension.measurementPosition;
        if (dimension.measurementComment) label += ' (' + dimension.measurementComment + ')';

        return label;
    }


    function convertValueFromInputUnitToMicrometre(inputUnit: 'mm'|'cm'|'m',
                                                          inputValue: number): number {

        switch (inputUnit) {
            case 'mm':
                return inputValue * 1000;
            case 'cm':
                return inputValue * 10000;
            case 'm':
                return inputValue * 1000000;
            default:
                return inputValue;
        }
    }
}