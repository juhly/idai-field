import {compose, filter, flatten, flow, forEach, intersect, isDefined,
    isNot, isUndefinedOrEmpty, lookup, keys, values, empty,
    map, remove, subtract, to, undefinedOrEmpty} from 'tsfun';
import {Document, Relations} from 'idai-components-2';
import {ImportErrors as E} from '../import-errors';
import {HIERARCHICAL_RELATIONS, POSITION_RELATIONS, TIME_RELATIONS} from '../../../model/relation-constants';
import {setInverseRelationsForDbResources} from './set-inverse-relations-for-db-resources';
import {assertInSameOperationWith, makeDocumentsLookup} from '../utils';
import IS_BELOW = POSITION_RELATIONS.IS_BELOW;
import IS_ABOVE = POSITION_RELATIONS.IS_ABOVE;
import IS_CONTEMPORARY_WITH = TIME_RELATIONS.IS_CONTEMPORARY_WITH;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {AssertIsAllowedRelationDomainType} from '../types';
import IS_AFTER = TIME_RELATIONS.IS_AFTER;
import IS_BEFORE = TIME_RELATIONS.IS_BEFORE;
import IS_EQUIVALENT_TO = POSITION_RELATIONS.IS_EQUIVALENT_TO;
import {ResourceId} from '../../../../common/c';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;


type LookupDocument = (_: string) => Document|undefined;
type PairRelationWithItsInverse = (_: Document) => (_: string) => [string, string|undefined]


/**
 * Iterates over all relations (including obsolete relations) of the given resources.
 * Between import resources, it validates the relations.
 * Between import resources and db resources, it adds the inverses.
 *
 * @param get
 * @param inverseRelationsMap
 * @param assertIsAllowedRelationDomainType
 * @param mergeMode
 *
 * @param importDocuments If one of these references another from the import file, the validity of the relations gets checked
 *   for contradictory relations and missing inverses are added.
 *
 * @param mergeMode
 *
 * @SIDE_EFFECTS: if an inverse of one of importDocuments is not set, it gets completed automatically.
 *   The document from importDocuments then gets modified in place.
 *
 * @returns the target importDocuments which should be updated. Only those fetched from the db are included. If a target document comes from
 *   the import file itself, <code>importDocuments</code> gets modified in place accordingly.
 *
 * @throws ImportErrors.* (see ./process.ts)
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export async function completeInverseRelations(importDocuments: Array<Document>,
                                               get: (_: string) => Promise<Document>,
                                               inverseRelationsMap: {[_: string]: string},
                                               assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType = () => {},
                                               mergeMode: boolean = false): Promise<Array<Document>> {

    const lookupDocument = lookup(makeDocumentsLookup(importDocuments));

    setInverseRelationsForImportResources(
        importDocuments,
        lookupDocument,
        pairRelationWithItsInverse(inverseRelationsMap),
        assertIsAllowedRelationDomainType);

    return await setInverseRelationsForDbResources(
        importDocuments,
        getTargetIds(mergeMode, get, lookupDocument),
        get,
        inverseRelationsMap,
        assertIsAllowedRelationDomainType,
        [LIES_WITHIN, RECORDED_IN]);
}


function getTargetIds(mergeMode: boolean,
                      get: (_: string) => Promise<Document>,
                      lookupDocument: LookupDocument) {

    return async (document: Document): Promise<[ResourceId[], ResourceId[]]>  => {

        let targetIds = targetIdsReferingToDbResources(document, lookupDocument);
        if (mergeMode) {
            let oldVersion;
            try {
                oldVersion = await get(document.resource.id);
            } catch {
                throw 'FATAL: Existing version of document not found';
            }

            return [
                targetIds,
                subtract<ResourceId>(targetIds)(
                    targetIdsReferingToDbResources(oldVersion as any, lookupDocument)
                )
            ];
        }
        return [targetIds, []];
    }
}


function targetIdsReferingToDbResources(document: Document,
                                        lookupDocument: LookupDocument) {

    return flow(
        document.resource.relations,
        values,
        flatten,
        remove(compose(lookupDocument, isDefined)));
}


function setInverseRelationsForImportResources(importDocuments: Array<Document>,
                                               lookupDocument: LookupDocument,
                                               pairRelationWithItsInverse: PairRelationWithItsInverse,
                                               assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType): void {

    for (let importDocument of importDocuments) {

        const pairRelationWithItsInverse_ = pairRelationWithItsInverse(importDocument);
        const assertNotBadlyInterrelated_ = assertNotBadlyInterrelated(importDocument);
        const setInverses_ = setInverses(importDocument, lookupDocument, assertIsAllowedRelationDomainType);

        flow(importDocument.resource.relations,
            keys,
            map(pairRelationWithItsInverse_),
            forEach(assertNotBadlyInterrelated_),
            forEach(setInverses_));
    }
}


function setInverses(importDocument: Document,
                     lookupDocument: LookupDocument,
                     assertIsAllowedRelationDomainType: AssertIsAllowedRelationDomainType) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        const assertIsAllowedRelationDomainType_ = (targetDocument: Document) => {

            assertIsAllowedRelationDomainType(
                importDocument.resource.type,
                targetDocument.resource.type,
                relationName,
                importDocument.resource.identifier);
        };

        const tmp = flow(
            importDocument.resource.relations[relationName],
            map(lookupDocument),
            filter(isDefined),
            forEach(assertIsAllowedRelationDomainType_));

        if (!inverseRelationName) return;
        if (inverseRelationName === HIERARCHICAL_RELATIONS.INCLUDES) return;

        flow(tmp,
            forEach(assertInSameOperationWith(importDocument)),
            map(to('resource.relations')),
            forEach(setInverse(importDocument.resource.id, inverseRelationName as string)));
    }
}

// TODO remove document param, see if everything can be simplified because the recorded in lookup should give undefined anyway
function pairRelationWithItsInverse(inverseRelationsMap: {[_: string]: string}) {

    return (document: Document) => (relationName: string): [string, string|undefined] => {

        if (relationName === RECORDED_IN) {
            return [RECORDED_IN, undefined];
        } else {
            return [relationName, inverseRelationsMap[relationName]];
        }
    }
}


function assertNotBadlyInterrelated(document: Document) {

    return ([relationName, inverseRelationName]: [string, string|undefined]) => {

        if (!inverseRelationName) return;

        const forbiddenRelations = [];

        if (relationName !== inverseRelationName) forbiddenRelations.push(inverseRelationName);

        if ([IS_ABOVE, IS_BELOW].includes(relationName)) forbiddenRelations.push(IS_EQUIVALENT_TO);
        else if (IS_EQUIVALENT_TO === relationName) forbiddenRelations.push(IS_ABOVE, IS_BELOW);

        if ([IS_BEFORE, IS_AFTER].includes(relationName)) forbiddenRelations.push(IS_CONTEMPORARY_WITH);
        else if (IS_CONTEMPORARY_WITH === relationName) forbiddenRelations.push(IS_BEFORE, IS_AFTER);

        assertNoForbiddenRelations(forbiddenRelations, document.resource.relations[relationName], document);
    }
}


function assertNoForbiddenRelations(forbiddenRelations: string[], relationTargets: string[],
                                    document: Document) {

    forbiddenRelations
        .map(lookup(document.resource.relations))
        .filter(isNot(undefinedOrEmpty))
        .map(intersect(relationTargets))
        .filter(isNot(empty))
        .forEach(_ => { throw [E.BAD_INTERRELATION, document.resource.identifier] });
}


function setInverse(resourceId: string, inverseRelationName: string) {

    return (targetDocumentRelations: Relations) => {

        if (isUndefinedOrEmpty(targetDocumentRelations[inverseRelationName])) {
            targetDocumentRelations[inverseRelationName] = [];
        }
        if (!targetDocumentRelations[inverseRelationName].includes(resourceId)) {
            targetDocumentRelations[inverseRelationName].push(resourceId);
        }
    }
}

