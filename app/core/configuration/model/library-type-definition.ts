import {Map} from 'tsfun';
import {assertFieldsAreValid} from '../boot/assert-fields-are-valid';
import {ConfigurationErrors} from '../boot/configuration-errors';
import {BaseFieldDefinition, BaseTypeDefinition} from './base-type-definition';
import {Valuelists} from './valuelist-definition';


/**
 * TypeDefinition, as used in TypeLibrary
 *
 * @author Daniel de Oliveira
 */
export interface LibraryTypeDefinition extends BaseTypeDefinition {

    color?: string,
    valuelists: Valuelists;
    commons: string[];
    parent?: string,
    typeFamily: string;
    description: {[language: string]: string},
    createdBy: string,
    creationDate: string;
    fields: Map<LibraryFieldDefinition>;
}


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValues?: string;
}

const VALID_FIELD_PROPERTIES = [
    'inputType',
    'positionValues'
];


export module LibraryTypeDefinition {

    export function makeAssertIsValid(builtinTypes: string[]) {

        return function assertIsValid([typeName, type]: [string, LibraryTypeDefinition]) {

            if (type.description === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'description', typeName];
            if (type.creationDate === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'creationDate', typeName];
            if (type.createdBy === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'createdBy', typeName];
            if (type.typeFamily === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'typeFamily', typeName];
            if (type.commons === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'commons', typeName];
            if (type.valuelists === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'valuelists', typeName];

            if (!builtinTypes.includes(type.typeFamily) && !type.parent) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', typeName];

            if (!type.fields) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'creationDate', typeName];
            assertFieldsAreValid(type.fields, VALID_FIELD_PROPERTIES, 'library');
        }
    }
}
