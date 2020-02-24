import {MDInternal} from 'idai-components-2';
import {flow, map, values, to} from 'tsfun';
import {IdaiType} from './model/idai-type';
import {FieldDefinition} from './model/field-definition';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationDefinition} from './configuration-definition';
import {ProjectConfigurationUtils} from './project-configuration-utils';
import {makeLookup} from '../util/utils';
import {TypeDefinition} from './model/type-definition';


/**
 * ProjectConfiguration maintains the current projects properties.
 * Amongst them is the set of types for the current project,
 * which ProjectConfiguration provides to its clients.
 *
 * Within a project, objects of the available types can get created,
 * where every type is a configuration of different fields.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ProjectConfiguration {

    private typesTree: { [typeName: string]: IdaiType } = {};

    private typesMap: { [typeName: string]: IdaiType } = {};

    private relationFields: Array<RelationDefinition> = [];


    /**
     * @param configuration
     */
    constructor(configuration: any) {

        this.initTypes(configuration);
        this.relationFields = configuration.relations || [];
    }


    public getAllRelationDefinitions() {

        return this.relationFields as Array<RelationDefinition>;
    }


    /**
     * @returns {Array<IdaiType>} All types in flat array, ignoring hierarchy
     */
    public getTypesList(): Array<IdaiType> {

        return values(this.typesMap);
    }


    public getTypesMap(): any {

        return this.typesMap;
    }


    public getTypesTree() : any {

        return this.typesTree;
    }

    /**
     * Gets the relation definitions available.
     *
     * @param typeName the name of the type to get the relation definitions for.
     * @param isRangeType If true, get relation definitions where the given type is part of the relation's range
     *                    (instead of domain)
     * @param property to give only the definitions with a certain boolean property not set or set to true
     * @returns {Array<RelationDefinition>} the definitions for the type.
     */
    public getRelationDefinitions(typeName: string, isRangeType: boolean = false,
                                  property?: string): Array<RelationDefinition>|undefined {

        if (!this.relationFields) return undefined;

        const availableRelationFields: Array<RelationDefinition> = [];
        for (let relationField of this.relationFields) {
            const types: string[] = isRangeType ? relationField.range : relationField.domain;

            if (types.indexOf(typeName) > -1) {
                if (!property ||
                    (relationField as any)[property] == undefined ||
                    (relationField as any)[property] == true) {
                    availableRelationFields.push(relationField);
                }
            }
        }
        return availableRelationFields;
    }

    /**
     * @returns {boolean} True if the given domain type is a valid domain type for a relation definition which has the
     * given range type & name
     */
    public isAllowedRelationDomainType(domainTypeName: string, rangeTypeName: string, relationName: string): boolean {

        const relationDefinitions: Array<RelationDefinition>|undefined = this.getRelationDefinitions(rangeTypeName, true);
        if (!relationDefinitions) return false;

        for (let relationDefinition of relationDefinitions) {
            if (relationName == relationDefinition.name
                && relationDefinition.domain.indexOf(domainTypeName) > -1) return true;
        }

        return false;
    }


    /**
     * @param typeName
     * @returns {any[]} the fields definitions for the type.
     */
    public getFieldDefinitions(typeName: string): FieldDefinition[] {

        if (!this.typesMap[typeName]) return [];
        return this.typesMap[typeName].fields;
    }


    public getLabelForType(typeName: string): string {

        if (!this.typesMap[typeName]) return '';
        return this.typesMap[typeName].label;
    }


    public getColorForType(typeName: string): string {

        return this.getTypeColors()[typeName];
    }


    public getTextColorForType(typeName: string): string {

        return ProjectConfigurationUtils.isBrightColor(this.getColorForType(typeName)) ? '#000000' : '#ffffff';
    }


    public getTypeColors() {

        return map(to('color'))(this.typesMap) as { [typeName: string]: string };
    }


    public isMandatory(typeName: string, fieldName: string): boolean {

        return this.hasProperty(typeName, fieldName, 'mandatory');
    }


    public isVisible(typeName: string, fieldName: string): boolean {

        return this.hasProperty(typeName, fieldName, 'visible');
    }


    /**
     * Should be used only from within components.
     * 
     * @param relationName
     * @returns {string}
     */
    public getRelationDefinitionLabel(relationName: string): string {

        return ProjectConfigurationUtils.getLabel(relationName, this.relationFields);
    }


    /**
     * Gets the label for the field if it is defined.
     * Otherwise it returns the fields definitions name.
     *
     * @param typeName
     * @param fieldName
     * @returns {string}
     * @throws {string} with an error description in case the type is not defined.
     */
    public getFieldDefinitionLabel(typeName: string, fieldName: string): string {

        const fieldDefinitions = this.getFieldDefinitions(typeName);
        if (fieldDefinitions.length == 0)
            throw 'No type definition found for type \'' + typeName + '\'';

        return ProjectConfigurationUtils.getLabel(fieldName, fieldDefinitions);
    }


    private hasProperty(typeName: string, fieldName: string, propertyName: string) {

        if (!this.typesMap[typeName]) return false;
        const fields = this.typesMap[typeName].fields;

        for (let i in fields) {
            if (fields[i].name == fieldName) {
                if ((fields[i] as any)[propertyName as any] == true) {
                    return true;
                }
            }
        }
        return false;
    }


    private initTypes(configuration: ConfigurationDefinition) {

        for (let type of configuration.types) {

            if (!type.color) {
                type.color = ProjectConfigurationUtils.generateColorForType(type.type);
            }
        }
        this.typesMap = ProjectConfiguration.makeTypesMap(configuration.types);

        for (let type of configuration.types) {
            if (!type['parent']) {
                this.typesTree[type.type] = this.typesMap[type.type];
            } else {
                const parentType = this.typesMap[type.parent as any];
                if (parentType == undefined) throw MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC;
                IdaiType.addChildType(parentType, this.typesMap[type.type]);
            }
        }
    }


    private static makeTypesMap(types: Array<TypeDefinition>) {

        return flow(
            types,
            map(IdaiType.build),
            makeLookup('name')) as { [typeName: string]: IdaiType };
    }
}
