import {Observable} from 'rxjs';
import {DatastoreErrors, Document, NewDocument} from 'idai-components-2';
import {IdGenerator} from './id-generator';
import {ObserverUtil} from '../../util/observer-util';
import {PouchdbProxy} from './pouchdb-proxy';
import {ChangeHistoryMerge} from './change-history-merge';
import {clone} from '../../util/object-util';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    public ready = () => this.db.ready();

    private changesObservers = [];
    private deletedObservers = [];

    // There is an issue where docs pop up in }).on('change',
    // despite them beeing deleted in remove before. When they
    // pop up in 'change', they do not have the deleted property.
    // So in order to identify them as to remove from the indices
    // they are marked 'manually'.
    private deletedOnes = [];


    constructor(
        private db: PouchdbProxy,
        private idGenerator: IdGenerator,
        setupChangesEmitter = true
        ) {

        if (setupChangesEmitter) this.setupChangesEmitter();
    }

    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.changesObservers);

    public deletedNotifications = (): Observable<Document> => ObserverUtil.register(this.deletedObservers);


    /**
     * @returns newest revision of the document fetched from db
     * @throws [DOCUMENT_RESOURCE_ID_EXISTS]
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async create(document: NewDocument, username: string): Promise<Document> {

        if (!Document.isValid(document as Document, true)) throw [DatastoreErrors.INVALID_DOCUMENT];
        if (document.resource.id) await this.assertNotExists(document.resource.id);

        try {
            return await this.performPut(
                PouchdbDatastore.initalizeDocument(document, username, this.idGenerator.generateId()));
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    /**
     * @returns newest revision of the document fetched from db
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async update(
        document: Document,
        username: string,
        squashRevisionsIds?: string[]): Promise<Document> {

        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];
        if (!Document.isValid(document)) throw [DatastoreErrors.INVALID_DOCUMENT];

        const fetchedDocument = await this.fetch(document.resource.id);

        const clonedDocument = clone(document);
        clonedDocument.created = fetchedDocument.created;
        clonedDocument.modified = fetchedDocument.modified;
        if (squashRevisionsIds) {
            await this.mergeModifiedDates(clonedDocument, squashRevisionsIds);
            await this.removeRevisions(clonedDocument.resource.id, squashRevisionsIds);
        }
        clonedDocument.modified.push({ user: username, date: new Date() });
        (clonedDocument as any)['_id'] = clonedDocument.resource.id;

        try {
            return await this.performPut(clonedDocument);
        } catch (err) {
            throw err.name && err.name === 'conflict'
                ? [DatastoreErrors.SAVE_CONFLICT]
                : [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     */
    public async remove(document: Document): Promise<void> {

        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];

        this.deletedOnes.push(document.resource.id as never);

        const fetchedDocument = await this.fetch(
            document.resource.id, { conflicts: true }, true) as any;

        if (fetchedDocument['_conflicts'] && fetchedDocument['_conflicts'].length > 0) {
            await this.removeRevisions(fetchedDocument.resource.id, fetchedDocument['_conflicts']);
        }

        try {
            await this.db.remove(fetchedDocument)
        } catch (genericerror) {
            throw [DatastoreErrors.GENERIC_ERROR, genericerror];
        }
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetch(resourceId: string,
                 options: any = { conflicts: true }, skipValidationAncDateConversion = false): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.

        return this.db.get(resourceId, options)
            .then(
                (result: any) => {
                    if (!skipValidationAncDateConversion) {
                        if (!Document.isValid(result)) return Promise.reject([DatastoreErrors.INVALID_DOCUMENT]);
                        PouchdbDatastore.convertDates(result);
                    }
                    return Promise.resolve(result as Document);
                },
                (_: any) => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
    }


    public fetchMultiple(resourceIds: string[], options: any = { conflicts: true }): Promise<any> {

        options.keys = resourceIds;
        options.include_docs = true;

        return this.db.allDocs(options);
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetchRevision(resourceId: string, revisionId: string): Promise<Document> {

        return this.fetch(resourceId, { rev: revisionId });
    }


    private async performPut(document: any) {

        await this.db.put(document, { force: true });
        return this.fetch(document.resource.id);
    }


    private async mergeModifiedDates(document: Document, squashRevisionsIds: string[]) {

        for (let revisionId of squashRevisionsIds) {
            ChangeHistoryMerge.mergeChangeHistories(
                document,
                await this.fetchRevision(document.resource.id, revisionId)
            );
        }
    }


    private async removeRevisions(resourceId: string|undefined, squashRevisionsIds: string[]): Promise<any> {

        if (!resourceId) return;

        try {
            for (let revisionId of squashRevisionsIds) await this.db.remove(resourceId, revisionId);
        } catch (err) {
            console.error('Error while removing revision', err);
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    private setupChangesEmitter(): void {

        this.db.ready().then((db: any) => {

            db.changes({
                live: true,
                include_docs: false, // we do this and fetch it later because there is a possible leak, as reported in https://github.com/pouchdb/pouchdb/issues/6502
                conflicts: true,
                since: 'now'
            }).on('change', (change: any) => {
                // it is noteworthy that currently often after a deletion of a document we get a change that does not reflect deletion.
                // neither is change.deleted set nor is sure if the document already is deleted (meaning fetch still works)

                if (!change || !change.id) return;
                if (change.id.indexOf('_design') == 0) return; // starts with _design

                if (change.deleted || this.deletedOnes.indexOf(change.id as never) != -1) {
                    ObserverUtil.notify(this.deletedObservers, {resource: {id: change.id}} as Document);
                    return;
                }

                this.handleNonDeletionChange(change.id);

            }).on('complete', (info: any) => {
                // console.debug('changes stream was canceled', info);
            }).on('error', (err: any) => {
                console.error('changes stream errored', err);
            });
        });
    }


    private async handleNonDeletionChange(changeId: string): Promise<void> {

        try {
            ObserverUtil.notify(this.changesObservers, await this.fetch(changeId));
        } catch (e) {
            console.warn('Document from remote change not found or not valid', changeId);
            throw e;
        }
    }


    private async assertNotExists(resourceId: string) {

        let exists = false;
        try {
            await this.db.get(resourceId);
            exists = true;
        } catch (_) {}
        if (exists) throw [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS];
    }


    private static convertDates(result: any): Document {

        result.created.date = new Date(result.created.date);
        for (let modified of result.modified) modified.date = new Date(modified.date);
        return result;
    }


    private static initalizeDocument(document: NewDocument, username: string, generatedId: string) {

        const clonedDocument = clone(document);
        if (!clonedDocument.resource.id) clonedDocument.resource.id = generatedId;
        (clonedDocument as any)['_id'] = clonedDocument.resource.id;
        (clonedDocument as any)['created'] = { user: username, date: new Date() };
        (clonedDocument as any)['modified'] = [];
        return clonedDocument;
    }
}
