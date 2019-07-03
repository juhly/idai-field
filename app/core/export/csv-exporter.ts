import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {CSVExport} from './csv-export';
import * as fs from 'fs';
import {M} from '../../components/m';
import {PerformExport} from './export-helper';

/**
 * Small wrapper to separate async and file handling, including
 * the choice of line endings, from the main logic
 *
 * @author Daniel de Oliveira
 */
export module CsvExporter {

    /**
     * @param outputFilePath
     */
    export function performExport(outputFilePath: string): PerformExport {

        return async (documents: Array<FieldDocument>,
                      resourceType: IdaiType,
                      relations: string[]) => {

            await writeFile(
                outputFilePath,
                CSVExport.createExportable(documents, resourceType, relations)); // TODO maybe call it separately
        }
    }


    function writeFile(outputFilePath: string,
                       lines: string[]): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.writeFile(outputFilePath, lines.join('\n'), // TODO review use of separators
                (err: any) => {
                if (err) {
                    console.error(err);
                    reject([M.EXPORT_ERROR_GENERIC]);
                } else {
                    resolve();
                }
            });
        });
    }
}