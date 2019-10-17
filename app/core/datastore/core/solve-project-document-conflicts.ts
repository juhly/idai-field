import {asyncMap} from 'tsfun-extra';
import {assoc, to, lookup, flow, map, filter, isDefined, union, equal,
    isEmpty, getOnOr, compose, dissoc, len, is, takeRight, cond, val} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import {ResourceId, RevisionId} from '../../../c';
import {CAMPAIGNS, dissocIndices, last, replaceLast, replaceLastPair, STAFF} from './helpers';
import getConflicts = DatastoreUtil.getConflicts;
import {withDissoc} from '../../import/util';


/**
 * @author Daniel de Oliveira
 */
export async function solveProjectDocumentConflict(document: Document,
                                                   fetch: (_: ResourceId) => Promise<Document>,
                                                   fetchRevision: (_: ResourceId, __: RevisionId) => Promise<Document>,
                                                   update: (_: Document, conflicts: string[]) => Promise<Document>):
    Promise<Document> {

    const latestRevisionDocument = await fetch(document.resource.id);

    let conflicts = getConflicts(latestRevisionDocument); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                      // again, to make sure other client did not solve it in that exact instant

    const conflictedDocuments = // TODO pass as param a function which returns revisions for a group of ids, or even better, fetch outside the function
        await asyncMap((resourceId: string) => fetchRevision(document.resource.id, resourceId))
        (conflicts);
    const conflictedSortedDocuments = DatastoreUtil.sortRevisionsByLastModified(conflictedDocuments);
    conflicts = conflictedSortedDocuments.map(to(REV_MARKER));

    const resourcesOfCurrentAndOldRevisionDocuments =
        conflictedSortedDocuments
            .concat(latestRevisionDocument)
            .map(to(RESOURCE));

    const result = await resolve(
        resourcesOfCurrentAndOldRevisionDocuments,
        conflicts);

    // this is to work with the latest changes history
    const latestRevisionDocumentWithInsertedResultResource = assoc(RESOURCE, result[0])(latestRevisionDocument);
    return await update(latestRevisionDocumentWithInsertedResultResource, result[1]);
}


async function resolve(resources: Array<Resource>,
                       conflicts: RevisionId[]):
    Promise<[Resource, RevisionId[]]> {

    const [resolvedResource, indicesOfResolvedResources] = solveProjectResourceConflicts(resources);

    return [
        flow(
            resources,
            dissocIndices(indicesOfResolvedResources.sort()),
            replaceLast(resolvedResource),
            crunch) as Resource

        , indicesOfResolvedResources.map(lookup(conflicts)) as RevisionId[]];
}


/**
 * Unifies the STAFF and CAMPAIGN fields of all the resources.
 * Apart from that, the resource returned is a copy of the rightmost
 * resource of resources.
 *
 * @param resources
 *   expected to be of at least length 1.
 */
function crunch(resources: Array<Resource>): Resource {

    if (resources.length === 0) throw 'FATAL - illegal argument - resources must have length 1';
    if (resources.length === 1) return resources[0];

    const staffUnion = flow(resources, map(to(STAFF)), filter(isDefined),  union);
    const campaignsUnion = flow(resources, map(to(CAMPAIGNS)), filter(isDefined),  union);
    return flow(resources,
        last,
        assoc(STAFF, staffUnion),
        assoc(CAMPAIGNS, campaignsUnion));
}


const constantProjectFields = ['id', 'relations', 'type', 'identifier'];


/**
 * @param resources ordered by time ascending
 *   expected to be of at least length 2.
 *
 * @returns a resolved resource and the positions of the resources that have been used to do this.
 *
 */
function solveProjectResourceConflicts(resources: Array<Resource>): [Resource, number[]] {

    if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

    const [collapsed, indicesOfUsedResources] = collapse(resources, []);
    return [collapsed[0], indicesOfUsedResources.reverse()];
}


function collapse(resources: Array<Resource>, indicesOfUsedResources: number[]): [Array<Resource>, number[]] {

    if (resources.length < 2) return [resources, indicesOfUsedResources];

    const ultimate = last(resources);
    const penultimate = getPenultimate(resources);

    const resolved = solveConflictBetween2ProjectDocuments(penultimate, ultimate);
    return resolved !== NONE
        ? replaceLastTwoThenCollapseRest(resources, resolved, indicesOfUsedResources.concat(resources.length - 2))
        : replaceLastTwoThenCollapseRest(resources, ultimate, indicesOfUsedResources);
}


function replaceLastTwoThenCollapseRest(resources: Array<Resource>, replacement: Resource, indices: number[]) {

    return collapse(replaceLastPair(resources, replacement), indices);
}


function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

    if (equal(left)(right)) return left;

    const l = withoutConstantProjectFields(left);
    const r = withoutConstantProjectFields(right);

    if      (isEmpty(l)) return right;
    else if (isEmpty(r)) return left;

    if (equal(withoutStaffAndCampaigns(l))(withoutStaffAndCampaigns(r))) {
        const lCampaigns = getOnOr(CAMPAIGNS, [])(l);
        const rCampaigns = getOnOr(CAMPAIGNS, [])(r);
        const lStaff = getOnOr(STAFF, [])(l);
        const rStaff = getOnOr(STAFF, [])(r);
        return flow(left,
            assoc(STAFF, union([lStaff, rStaff])),
            assoc(CAMPAIGNS, union([lCampaigns, rCampaigns])));
    }
    return NONE;
}


const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);


const withoutStaffAndCampaigns = compose(dissoc(STAFF), dissoc(CAMPAIGNS));


const lengthIs2 = compose(len, is(2));


/**
 * Gets the penultimate of an Array of A's, if it exists.
 * @returns A|undefined
 */
const getPenultimate = compose(
    takeRight(2),
    cond(
        lengthIs2,
        to('[0]'),
        val(undefined)));


const NONE = undefined;


const RESOURCE = 'resource';


const REV_MARKER = '_rev';