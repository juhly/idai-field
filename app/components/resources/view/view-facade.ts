import {Document} from 'idai-components-2/core';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {OperationViews} from './operation-views';
import {SettingsService} from '../../../core/settings/settings-service';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';

/**
 * Manages an overview of operation type resources
 * and different views for each operation type.
 *
 * In the overview the document list contains the operation type resources.
 * In the operation type views the list contains resources recorded in
 * one selected operation type resource.
 *
 * Apart from that, each view behaves the same in that the document list
 * can get filteres etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {


    private views: OperationViews;
    private viewManager: ViewManager;
    private mainTypeDocumentsManager: MainTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private resourcesState: ResourcesState,
        private viewsList: any
    ) {
        this.views = new OperationViews(viewsList);
        this.viewManager = new ViewManager(
            this.views,
            resourcesState,
        );
        this.mainTypeDocumentsManager = new MainTypeDocumentsManager(
            datastore,
            this.viewManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            changesStream,
            settingsService,
            this.viewManager,
            this.mainTypeDocumentsManager
        );
    }


    public isInOverview() {

        return this.viewManager.isInOverview();
    }

    
    public getCurrentViewName() {

        if (!this.viewManager.getViewName()) return;
        return this.viewManager.getViewName();
    }


    public getOperationSubtypeViews() {

        return this.views.get();
    }


    /**
     * @returns the main type of the currently selected view.
     * This is either 'Project' or one of the operation types names.
     */
    public getCurrentViewMainType(): string|undefined {

        if (!this.viewManager.getViewName()) return undefined;
        if (this.viewManager.getViewName() == 'project') return 'Project';

        return this.viewManager.getViewType();
    }


    public getMainTypeHomeViewName(mainTypeName: string): string|undefined {

        if (!mainTypeName) return undefined;
        if (mainTypeName == 'Project') return 'project';

        return this.views.getViewNameForOperationSubtype(mainTypeName);
    }


    public getMainTypeLabel() {

        if (this.isInOverview()) throw ViewFacade.err('getMainTypeLabel');
        return this.viewManager.getMainTypeLabel();
    }


    public getActiveDocumentViewTab(): string|undefined {

        return this.viewManager.getActiveDocumentViewTab();
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.viewManager.setActiveDocumentViewTab(activeDocumentViewTab);
    }


    public deselect() {

        return this.documentsManager.deselect();
    }


    public getMode() {

        return this.viewManager.getMode();
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public getProjectDocument() {

        return this.documentsManager.projectDocument;
    }


    public async handleMainTypeDocumentOnDeleted() {

        const selectedDocument = this.mainTypeDocumentsManager.getSelectedDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.id) return;

        this.viewManager.removeActiveLayersIds(selectedDocument.resource.id);
        this.viewManager.setLastSelectedOperationTypeDocumentId(undefined);
        await this.populateMainTypeDocuments();
    }


    // TODO it should not be necessary to specify mainTypeDocumentResourceId, it simply should be the currently selected mainTypeDocument
    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        return this.viewManager.setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds);
    }


    // TODO it should not be necessary to specify mainTypeDocumentResourceId, it simply should be the currently selected mainTypeDocument
    public getActiveLayersIds(mainTypeDocumentResourceId: string): string[] {

        const ids: string[] = this.viewManager.getActiveLayersIds(mainTypeDocumentResourceId);

        return ids ? ids : [];
    }


    public getSelectedMainTypeDocument(): IdaiFieldDocument|undefined {

        if (this.isInOverview()) throw ViewFacade.err('getSelectedMainTypeDocument');
        return this.mainTypeDocumentsManager.getSelectedDocument();
    }


    public getMainTypeDocuments() {

        if (this.isInOverview()) throw ViewFacade.err('getMainTypeDocuments');
        return this.mainTypeDocumentsManager.getDocuments();
    }


    public async getAllOperationSubtypeWithViewDocuments() {

        const viewMainTypes = this.views.get()
            .map((view: any) => {return view.operationSubtype});

        let mainTypeDocuments: Array<Document> = [];

        for (let viewMainType of viewMainTypes) {
            if (viewMainType == 'Project') continue;

            mainTypeDocuments = mainTypeDocuments.concat(
                (await this.datastore.find({ q: '', types: [viewMainType] })).documents);
        }

        return mainTypeDocuments;
    }


    public getFilterTypes() {

        return this.viewManager.getFilterTypes();
    }


    public getQueryString() {

        return this.viewManager.getQueryString();
    }


    public setMode(mode: string) {

        this.viewManager.setMode(mode);
    }


    public setSelectedDocumentById(id: string) {

        return this.documentsManager.setSelectedById(id);
    }


    public isNewDocumentFromRemote(document: Document) {

        return this.documentsManager.isNewDocumentFromRemote(document);
    }


    public remove(document: Document) {

        return this.documentsManager.remove(document);
    }


    public getSelectedDocument() {

        return this.documentsManager.getSelectedDocument();
    }


    /**
     * Sets the this.documentsManager.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.documntsManager.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.documentsManager.selectedDocument is part of the search hits of the document list.
     *
     * @param document exits immediately if this is
     *   a) the same as this.documentsManager.selectedDocument or
     *   b) the same as this.mainTypeManager.selectedMainTypeDocument or
     *   c) undefined
     * @returns {Document}
     */
    public setSelectedDocument(document: Document) {

        return this.documentsManager.setSelected(document);
    }


    public getDocuments() {

        return this.documentsManager.getDocuments();
    }


    public setSearchString(q: string): Promise<boolean> {

        return this.documentsManager.setQueryString(q);
    }


    public setTypesToFilterBy(types: string[]) { // TODO make it return a promise, like setSearchString

        return this.documentsManager.setQueryTypes(types);
    }


    /**
     * Sets the document whose children are shown, when getDocuments() is called.
     * If resourceId is undefined, then all top level elements of the currently
     * selected mainTypeDocument are shown.
     */
    public async setRootDocument(resourceId: string|undefined) {

        if (this.isInOverview()) throw ViewFacade.err('setQueryLiesWithinConstraint');
        await this.documentsManager.setRootDocument(resourceId);
    }


    public async getBreadcrumb(): Promise<any[]|undefined> {

        if (this.isInOverview()) return undefined;
        if (!this.getSelectedMainTypeDocument()) return undefined;

        const rootDocumentResourceId = this.viewManager.fetchQueryLiesWithinPathFromResourcesState(
            (this.mainTypeDocumentsManager.getSelectedDocument() as any).resource.id as any);
        if (!rootDocumentResourceId) return undefined;
        if (rootDocumentResourceId.length < 1) return undefined;


        const segments = [{
            id: undefined, // TODO remove this hack, it is used to call setRootDocument with undefined, but could be the mainTypeDocument
            identifier: (this.mainTypeDocumentsManager.getSelectedDocument() as any).resource.identifier as any
        }];


        let currentResourceId = rootDocumentResourceId;
        while (true) {

            const segment = await this.datastore.get(currentResourceId);
            segments.push({
                id: (segment as any).resource.id,
                identifier: (segment as any).resource.identifier
            });

            if (!segment.resource.relations['liesWithin']
                || segment.resource.relations['liesWithin'].length < 1) break;

            currentResourceId = segment.resource.relations['liesWithin']
                [0]; // TODO we need to handle cases where more relation targets are present

        }

        return segments;
    }


    public getCurrentFilterType() {

        return this.viewManager.getCurrentFilterType();
    }


    /**
     * @param mainTypeDoc
     * @returns true if isSelectedDocumentRecordedInSelectedMainTypeDocument
     */
    public async selectMainTypeDocument(mainTypeDoc: Document): Promise<boolean> {

        if (this.isInOverview()) throw ViewFacade.err('selectMainTypeDocument/1');
        this.mainTypeDocumentsManager.select(mainTypeDoc as IdaiFieldDocument);

        await this.populateDocumentList();

        if (!this.isSelectedDocumentRecordedInSelectedMainTypeDocument()) {
            this.documentsManager.deselect();
            return false;
        } else {
            return true;
        }
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     *
     * @returns {Promise<any>}
     */
    public async populateMainTypeDocuments() {

        if (this.isInOverview()) throw ViewFacade.err('populateMainTypeDocuments');
        await this.mainTypeDocumentsManager.populate();
    }


    public async setupView(viewName: string, defaultMode: string) {

        await this.viewManager.setupView(viewName, defaultMode);
        await this.documentsManager.populateProjectDocument();

        if (!this.isInOverview()) {
            await this.populateMainTypeDocuments();
            this.viewManager.setupLiesWithinPath(this.getSelectedMainTypeDocument());
        }

        await this.populateDocumentList();
    }


    private isSelectedDocumentRecordedInSelectedMainTypeDocument(): boolean {

        if (!this.documentsManager.getSelectedDocument()) return false;

        return this.mainTypeDocumentsManager.isRecordedInSelectedOperationTypeDocument(
            this.documentsManager.getSelectedDocument()
        );
    }


    private static err(fnName: string, notAllowedWhenIsInOverview = true) {
        
        const notMarker = notAllowedWhenIsInOverview ? '' : '! ';
        return 'Calling ' + fnName + ' is forbidden when ' + notMarker + 'isInOverview';
    }
}