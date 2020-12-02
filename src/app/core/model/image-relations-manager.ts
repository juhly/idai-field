import {Document, FieldDocument, ImageDocument, Resource, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {ImageRelations} from './relation-constants';
import {flatten, includedIn, isDefined, isNot, on, set} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {TreeList} from '../util/tree-list';
import {Category} from '../configuration/model/category';
import DEPICTS = ImageRelations.DEPICTS;
import ISDEPICTEDIN = ImageRelations.ISDEPICTEDIN;
import {Injectable} from '@angular/core';
import {ProjectCategories} from '../configuration/project-categories';
import {ResourceId} from '../constants';
import {clone} from '../util/object-util';


@Injectable()
export class ImageRelationsManager {

    // TODO review
    public static IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'persistenceHelper/errors/imagestoreInvalidPathDelete';
    public static IMAGESTORE_ERROR_DELETE = 'persistenceHelper/errors/imagestoreErrorDelete';

    private categoryTreelist: TreeList<Category>

    constructor(private datastore: DocumentDatastore,
                private relationsManager: RelationsManager,
                private imagestore: Imagestore,
                projectConfiguration: ProjectConfiguration) {

        this.categoryTreelist = projectConfiguration.getCategoryTreelist();
    }

    public async getRelatedImageDocuments(documents: Array<Document>): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments: Array<ResourceId> = flatten(
            documents
                .map(_ => _.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds)));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return await this.datastore.get(id);
        });
    }


    public async remove(document: Document) {

        if (ProjectCategories.getImageCategoryNames(this.categoryTreelist)
            .includes(document.resource.category)) {
            throw 'illegal argument - document must not be of an Image category';
        }
        if (this.imagestore.getPath() === undefined) {
            throw 'illegal state - imagestore.getPath() must not return undefined';
        }

        const documentsToBeDeleted =
            (await this.relationsManager.fetchChildren(document)).concat([document]);
        await this.relationsManager.remove(document);

        const catalogImages = set(on([Document.RESOURCE, Resource.ID]), await this.getLeftovers(documentsToBeDeleted));

        for (let catalogImage of catalogImages) {
            await this.imagestore.remove(catalogImage.resource.id);
            await this.datastore.remove(catalogImage);
        }
    }


    // TODO test
    public async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument, selectedImages: Array<ImageDocument>) {

        for (let imageDocument of selectedImages) {
            const oldVersion: ImageDocument = clone(imageDocument);
            const depictsRelations: string[] = imageDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.relationsManager.persist(
                imageDocument, oldVersion
            );
        }
    }


    // TODO test
    /**
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE]
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_DELETE]
     */
    public async deleteSelectedImageDocuments(selectedImages: Array<ImageDocument>) {

        if (!this.imagestore.getPath()) throw [ImageRelationsManager.IMAGESTORE_ERROR_INVALID_PATH_DELETE];

        for (let document of selectedImages) {
            if (!document.resource.id) continue;
            const resourceId: string = document.resource.id;

            try {
                await this.imagestore.remove(resourceId);
            } catch (err) {
                throw [ImageRelationsManager.IMAGESTORE_ERROR_DELETE, document.resource.identifier];
            }

            await this.relationsManager.remove(document);
        }
    }


    // TODO test
    public async removeDepictsRelationsOnSelectedDocuments(selectedImages: Array<ImageDocument>) {

        for (let document of selectedImages) {
            const oldVersion: ImageDocument = clone(document);
            document.resource.relations.depicts = [];

            await this.relationsManager.persist(
                document, oldVersion
            );
        }
    }


    private async getLeftovers(documentsToBeDeleted: Array<Document>) {

        const idsOfDocumentsToBeDeleted = documentsToBeDeleted.map(toResourceId);

        const leftovers = [];
        for (let imageDocument of (await this.getRelatedImageDocuments(documentsToBeDeleted))) {
            let depictsOnlyDocumentsToBeDeleted = true;
            for (let depictsTargetId of imageDocument.resource.relations[DEPICTS]) {
                if (!idsOfDocumentsToBeDeleted.includes(depictsTargetId)) depictsOnlyDocumentsToBeDeleted = false;
            }
            if (depictsOnlyDocumentsToBeDeleted) leftovers.push(imageDocument);
        }
        return leftovers;
    }
}
