import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, Messages} from 'idai-components-2';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';
import {DeleteModalComponent} from './delete-modal.component';
import {ImageOverviewComponent} from './image-overview.component';


@Component({
    selector: 'image-overview-taskbar',
    moduleId: module.id,
    templateUrl: './image-overview-taskbar.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewTaskbarComponent {

    @Input() imageGrid: any;

    public getDepictsRelationsSelected = () => this.imageOverviewFacade.getDepictsRelationsSelected();
    public clearSelection = () => this.imageOverviewFacade.clearSelection();


    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceHelper: PersistenceHelper,
        private imageOverviewComponent: ImageOverviewComponent
    ) {
        this.imageOverviewFacade.initialize();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.imageOverviewComponent.modalOpened) this.clearSelection();
    }


    public async openLinkModal() {

        this.imageOverviewComponent.modalOpened = true;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                LinkModalComponent, { keyboard: false }
            );
            modalRef.componentInstance.initializeFilterOptions();

            const targetDocument: FieldDocument = await modalRef.result;
            if (!targetDocument) return;

            try {
                await this.persistenceHelper.addDepictsRelationsToSelectedDocuments(targetDocument);
                this.imageOverviewFacade.clearSelection();
            } catch(msgWithParams) {
                this.messages.add(msgWithParams);
            }
        } catch(err) {
            // LinkModal has been canceled
        } finally {
            this.imageOverviewComponent.modalOpened = false;
        }
    }


    public async openDeleteModal() {

        this.imageOverviewComponent.modalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.numberOfSelectedImages = this.imageOverviewFacade.getSelected().length;

        try {
            if ((await modalRef.result) === 'delete') await this.deleteSelected();
        } catch(err) {
            // DeleteModal has been canceled
        } finally {
            this.imageOverviewComponent.modalOpened = false;
        }
    }


    public async openRemoveLinkModal() {

        this.imageOverviewComponent.modalOpened = true;

        try {
            await this.modalService.open(RemoveLinkModalComponent, { keyboard: false }).result;
            await this.persistenceHelper.removeDepictsRelationsOnSelectedDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch(err) {
            // RemoveLinkModal has been canceled
        } finally {
            this.imageOverviewComponent.modalOpened = false;
        }
    }


    private async deleteSelected() {

        try {
            await this.persistenceHelper.deleteSelectedImageDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }
}