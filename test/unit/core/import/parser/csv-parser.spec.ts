import {IdaiType, Dating} from 'idai-components-2';
import {CsvParser} from '../../../../../app/core/import/parser/csv-parser';
import {makeType} from '../../export/csv-export.spec';

/**
 * @author Daniel de Oliveira
 */

describe('CsvParser', () => {


    it('basics', async done => {

        const type = makeType(['custom1, custom2']);

        const parse = CsvParser.getParse(type, 'opId1');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource['type']).toBe('Feature');
        expect(docs[0].resource['custom1']).toBe('1');
        expect(docs[0].resource['custom2']).toBe('2');
        expect(docs[0].resource.relations['isChildOf']).toBe('opId1');
        done();
    });


    it('no lies within', async done => {

        const type = makeType(['custom1, custom2']);

        const parse = CsvParser.getParse(type, '');
        const docs = await parse('custom1,custom2\n1,2');

        expect(docs[0].resource.relations).toBeUndefined();
        done();
    });


    it('field type boolean', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'Bool1',
                inputType: 'boolean'
            }, {
                name: 'Bool2',
                inputType: 'boolean'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse('Bool1,Bool2\ntrue,false');

        expect(docs[0].resource['Bool1']).toBe(true);
        expect(docs[0].resource['Bool2']).toBe(false);
        done();
    });
    
    
    it('field type dating', async done => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dating',
                inputType: 'dating'
            }],
        } as IdaiType;

        const parse = CsvParser.getParse(type, '');
        const docs = await parse(
            'dating.0.type,dating.0.begin.type,dating.0.begin.year,dating.0.end.type,dating.0.end.year,dating.0.margin,dating.0.source,dating.0.isImprecise,dating.0.isUncertain\n'
        + 'range,bce,0,bce,1,1,abc,true,false');

        const dating: Dating = docs[0].resource.dating[0];
        expect(dating.type).toBe('range');
        expect(dating.begin.type).toBe('bce');
        expect(dating.begin.year).toBe(0);
        expect(dating.end.type).toBe('bce');
        expect(dating.end.year).toBe(1);
        expect(dating.margin).toBe(1);
        expect(dating.source).toBe('abc');
        expect(dating.isImprecise).toBe(true);
        expect(dating.isUncertain).toBe(false);
        done();
    });
});