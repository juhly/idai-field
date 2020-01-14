import {Resource} from 'idai-components-2';
import {mergeResource} from '../../../../../app/core/import/import/process/merge-resource';
import {ImportErrors} from '../../../../../app/core/import/import/import-errors';
import {clone} from '../../../../../app/core/util/object-util';


/**
 * @author Daniel de Oliveira
 */
describe('mergeResource', () => {

    const identifier = 'identifier1';

    const template: Resource = {
        id: 'id1',
        type: 'Object',
        identifier: identifier,
        shortDescription: 'shortDescription1',
        relations: { }
    };

    let target: Resource = {} as Resource;
    let source: Resource = {} as Resource;


    beforeEach(() => {

        target = clone(template);
        target['anotherField'] = 'field1';
        source = clone(template);
    });


    it('delete fields', () => {

        const source = {
            anotherField: null
        };

        const result = mergeResource(target, source as any);
        expect(result.shortDescription).toEqual('shortDescription1');
        expect(result.anotherField).toBeUndefined();
    });


    it('overwrite fields', () => {

        const source: Resource = {
            id: 'id1',
            type: 'Object',
            identifier: identifier,
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        const result = mergeResource(target, source);
        expect(result.shortDescription).toEqual('shortDescription2');
        expect(result.anotherField).toEqual('field2');
    });

    
    it('merge object field', () => {

        target['object'] = { aField: 'aOriginalValue', cField: 'cOriginalValue' };
        source['object'] = { aField: 'aChangedValue', bField: 'bNewValue' };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toEqual('aChangedValue');
        expect(result['object']['bField']).toEqual('bNewValue');
        expect(result['object']['cField']).toEqual('cOriginalValue');
    });


    it('merge object field - create target', () => {

        source['object'] = { aField: 'aNewValue' };

        const result = mergeResource(target, source);

        expect(result['object']['aField']).toEqual('aNewValue');
    });


    it('merge objectArray field', () => {

        target['objectArray'] = [{ aField: 'aOriginalValue', cField: 'cOriginalValue' }];
        source['objectArray'] = [{ aField: 'aChangedValue', bField: 'bNewValue' }];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result['objectArray'][0]['bField']).toEqual('bNewValue');
        expect(result['objectArray'][0]['cField']).toEqual('cOriginalValue');
    });


    it('merge objectArray field - create target object', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [{aField: 'aNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    it('merge objectArray field - delete target object', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [{aField: null}];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    it('merge objectArray field - delete target object with null entry', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [null];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    it('merge objectArray field - delete target object (interpret emptied objects as null)', () => {

        target['objectArray'] = [{aField: { aNested: 'aOriginalValue' }}];
        source['objectArray'] = [{aField: { aNested: null }}];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    it('merge objectArray field - delete target object (interpret emptied objects as null) - case 2', () => {

        target['objectArray'] = [{aField: { aNested: 'aOriginalValue' }}];
        source['objectArray'] = [{aField: { aNested: null, bNested: null }}];

        const result = mergeResource(target, source);

        expect(result['objectArray']).toBeUndefined();
    });


    it('merge objectArray field - do not copy a field containing only null values if target does not exist', () => {

        target['objectArray'] = [{/* aField is undefined */ bField: 'bValue'}];
        source['objectArray'] = [{ aField: { aNested: null }}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['bField']).toEqual('bValue');
        expect(result['objectArray'][0]['aField']).toBeUndefined();
    });


    it('merge objectArray field - create a nested object if target does not exist', () => {

        target['objectArray'] = [{/* aField is undefined */ bField: 'bValue'}];
        source['objectArray'] = [{ aField: { aNested: 'aNestedValue' }}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['bField']).toEqual('bValue');
        expect(result['objectArray'][0]['aField']['aNested']).toEqual('aNestedValue');
    });


    it('merge objectArray field - leave nested fields as is, if not deleted by null', () => {

        target['objectArray'] = [{ aField: { aNested: 'aNestedOriginalValue' }}];
        source['objectArray'] = [{ aField: { bNested: null }}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']['aNested']).toEqual('aNestedOriginalValue');
        expect(result['objectArray'][0]['aField']['bNested']).toBeUndefined();
    });


    it('merge objectArray field - delete target object (interpret deeply nested, emptied objects as null)', () => {

        target['objectArray'] = [{aField: { aNested: { aDeeplyNested: 'aOriginalValue' }}}];
        source['objectArray'] = [{aField: { aNested: { aDeeplyNested: null } }}];

        const result = mergeResource(target, source);
        expect(result['objectArray']).toBeUndefined();
    });


    it('merge objectArray field - delete one target object', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'},{bField: 'bOriginalValue'}];
        source['objectArray'] = [undefined, {bField: null}];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    it('merge objectArray field - target object to delete is not defined', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, {bField: null}];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    it('merge objectArray field - target object to delete is not defined - 2 undefined', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, undefined ,{bField: null}];

        const result = mergeResource(target, source);

        expect(result['objectArray'].length).toBe(1);
        expect(result['objectArray'][0]['aField']).toBe('aOriginalValue');
    });


    it('merge objectArray field - change one target object and add one target object', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [{aField: 'aChangedValue'}, {bField: 'bNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aChangedValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    it('merge objectArray field - ignore undefined-valued field', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}, {bField: 'bOriginalValue'}];
        source['objectArray'] = [undefined, {bField: 'bChangedValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bChangedValue');
    });


    it('merge objectArray field - ignore undefined-valued field, add array object', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, {bField: 'bNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
    });


    it('merge objectArray field - ignore undefined-valued field, add two array objects', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, {bField: 'bNewValue'}, {cField: 'cNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aOriginalValue');
        expect(result['objectArray'][1]['bField']).toEqual('bNewValue');
        expect(result['objectArray'][2]['cField']).toEqual('cNewValue');
    });


    it('merge objectArray field - create target objectArray', () => {

        source['objectArray'] = [{aField: 'aNewValue'}];

        const result = mergeResource(target, source);

        expect(result['objectArray'][0]['aField']).toEqual('aNewValue');
    });


    it('dont overwrite identifier, id', () => {

        const source: Resource = {
            id: 'id2',
            type: 'Object',
            identifier: 'identifier2',
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        const result = mergeResource(target, source);
        expect(result.identifier).toEqual('identifier1');
        expect(result.id).toEqual('id1');
        expect(result.type).toEqual('Object');
        expect(result.relations).toEqual({});
    });


    // TODO review, if this is the desired behaviour for normal (i.e. non-object) array fields in resources. object arrays are used for dimension and dating currently. also consider that all arrays on every nesting level are treated accordingly
    it('merge array fields', () => {

        target['array'] = [1, 2, 7];
        source['array'] = [3, 4];

        const result = mergeResource(target, source);
        expect(result['array']).toEqual([3, 4, 7]);
    });


    it('overwrite, do not merge geometry', () => {

        target['geometry'] = { a: 1 };
        source['geometry'] = { b: 2 };

        const result = mergeResource(target, source);
        expect(result['geometry']['b']).toEqual(2);
        expect(result['geometry']['a']).toBeUndefined();
    });


    it('array of heterogeneous types allowed when entries null or undefined', () => {

        source['array'] = [1, null, null];
        mergeResource(target, source);

        source['array'] = [1, undefined, null];
        mergeResource(target, source);

        try {
            source['array'] = [undefined, 2];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) fail();
        }

        try {
            source['array'] = [null, 2];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) fail();
        }

        try {
            source['array'] = [null, 2, undefined, 3];
            mergeResource(target, source);
        } catch (expected) {
            if (expected[0] === ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES) fail();
        }
    });


    // err cases

    it('array of heterogeneous types - top level', () => {

        source['array'] = [{a: 1}, 2];

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES]);
        }
    });


    it('array of heterogeneous types - nested', () => {

        source['array'] = { b: [{a: 1}, 2] };

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES]);
        }
    });


    it('array of heterogeneous types - undefined and null interposed', () => {

        source['array'] = [undefined, 2, null, '3'];

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.ARRAY_OF_HETEROGENEOUS_TYPES]);
        }
    });



    it('attempted to change type', () => {

        const source: Resource = {
            id: 'id2',
            type: 'Object2',
            identifier: identifier,
            shortDescription: 'shortDescription2',
            anotherField: 'field2',
            relations: {}
        };

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.TYPE_CANNOT_BE_CHANGED, identifier]);
        }
    });


    it('merge objectArray field - target object to delete is not defined - do not allow empty entries', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}];
        source['objectArray'] = [undefined, undefined ,{bField: 'bNewValue'}];

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });

    it('merge objectArray field - throw if the deletion would occur but there are still objects to the right side', () => {

        target['objectArray'] = [{aField: 'aOriginalValue'}, {bField: 'bOriginalValue'}];
        source['objectArray'] = [{aField: null}];

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });


    it('merge objectArray field - ignore null-valued field, do not add array object, if this would result in empty entries', () => {

        target['objectArray'] = undefined;
        source['objectArray'] = [null, {bField: 'bNewValue'}];

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]);
        }
    });


    it('violate precondition in target', () => {

        target['anotherField'] = { a: {} };

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual(Error('Precondition violated in mergeResource. Identifier: identifier1'));
        }
    });


    it('violate precondition in source', () => {

        source['anotherField'] = { a: {} };

        try {
            mergeResource(target, source);
            fail();
        } catch (expected) {
            expect(expected).toEqual(Error('Precondition violated in mergeResource. Identifier: identifier1'));
        }
    });
});