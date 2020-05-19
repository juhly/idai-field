import {Component, Input, ChangeDetectionStrategy, EventEmitter, Output} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {NavigationService} from '../../../core/resources/navigation/navigation-service';
import { PopoverMenu, ResourcesComponent } from '../resources.component';


@Component({
    selector: 'list-button-group',
    templateUrl: './list-button-group.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ListButtonGroupComponent {

    @Input() document: FieldDocument;
    @Input() activePopoverMenu: PopoverMenu;
    @Input() isDocumentSelected: boolean;
    @Output() popoverMenuToggled = new EventEmitter<PopoverMenu>();

    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                public projectCategories: ProjectCategories,
                private navigationService: NavigationService) {
    }


    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public jumpToResourceInSameView = () => this.navigationService.jumpToResourceInSameView(this.document);

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);

    public togglePopoverMenu = (popoverMenu: PopoverMenu) => this.popoverMenuToggled.emit(popoverMenu);


    public async jumpToResourceFromOverviewToOperation() {

        this.resourcesComponent.closePopover();
        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
        this.resourcesComponent.setScrollTarget(this.document);
    }
}
