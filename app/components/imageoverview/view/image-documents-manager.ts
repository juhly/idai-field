import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {Query} from 'idai-components-2/datastore';
import {ViewFacade} from '../../resources/view/view-facade';
import {ImagesState} from './images-state';
import {Injectable} from '@angular/core';
import {IdaiFieldImageDocumentReadDatastore} from "../../../core/datastore/idai-field-image-document-read-datastore";


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageDocumentsManager {

    private documents: Array<IdaiFieldImageDocument>;

    public selected: Array<IdaiFieldImageDocument>  = [];

    private depictsRelationsSelected: boolean = false;


    constructor(
        public viewFacade: ViewFacade,
        private imagesState: ImagesState,
        private imageDatastore: IdaiFieldImageDocumentReadDatastore
    ) {
    }


    public getSelected(): Array<IdaiFieldImageDocument> {

        return this.selected
    }


    public getDocuments(): Array<IdaiFieldImageDocument> {

        return this.documents;
    }


    public getDepictsRelationsSelected(): boolean {

        return this.depictsRelationsSelected;
    }


    public remove(document: IdaiFieldImageDocument) {

        this.documents.splice(
            this.documents.indexOf(document), 1);
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) {
            this.selected.push(document);
        } else {
            this.selected.splice(this.selected.indexOf(document), 1);
        }

        this.depictsRelationsSelected = this.doSelectedDocumentsContainDepictsRelations();
    }


    private doSelectedDocumentsContainDepictsRelations(): boolean {

        for (let document of this.selected) {

            // TODO make sure the DAO always returns docs with depicts, then simplify here
            if (document.resource.relations.depicts &&
                    document.resource.relations.depicts.length > 0) {
                return true;
            }
        }

        return false;
    }


    public clearSelection() {

        this.selected = [];
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public async fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        console.debug("fetch docs",query);
        let documents;
        try {
            console.debug("fetch docs end");
            documents =
            this.documents = await this.imageDatastore.find(query);
        } catch (errWithParams) {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }
    }
}