import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {NavigationService} from '../navigation-service';
import {BaseList} from '../base-list';


@Component({
    selector: 'sidebar-list',
    moduleId: module.id,
    templateUrl: './sidebar-list.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */

export class SidebarListComponent extends BaseList {

    @Input() activeTab: string;

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private navigationService: NavigationService,
        public loading: Loading
    ) {
        super(resourcesComponent, viewFacade, loading)
    }


    public moveInto = (document: IdaiFieldDocument) => this.navigationService.moveInto(document);


    public showMoveIntoOption = (document: IdaiFieldDocument) => this.navigationService.showMoveIntoOption(document);


    public select(document: IdaiFieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            this.viewFacade.setSelectedDocument(document);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }
}