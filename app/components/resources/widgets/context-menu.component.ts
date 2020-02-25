import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ResourcesComponent} from '../resources.component';
import {ProjectTypes} from '../../../core/configuration/project-types';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {ContextMenu} from './context-menu';


export type ContextMenuAction = 'edit'|'move'|'delete'|'create-polygon'|'create-line-string'|'create-point'
    |'edit-geometry';

type ContextMenuOrientation = 'top'|'bottom';


@Component({
    selector: 'context-menu',
    moduleId: module.id,
    templateUrl: './context-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ContextMenuComponent implements OnChanges {

    @Input() contextMenu: ContextMenu;

    @Output() onSelectAction: EventEmitter<ContextMenuAction> = new EventEmitter<ContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private projectTypes: ProjectTypes) {}


    ngOnChanges() {

        this.orientation = ContextMenuComponent.computeOrientation(this.contextMenu.position?.y);
    }


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }


    public getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }


    public isCreateGeometryOptionAvailable(): boolean {

        return this.contextMenu.document !== undefined
            && this.projectTypes.isGeometryType(this.contextMenu.document.resource.type)
            && !this.contextMenu.document.resource.geometry;
    }


    public isEditGeometryOptionAvailable(): boolean {

        return this.contextMenu.document !== undefined
            && this.projectTypes.isGeometryType(this.contextMenu.document.resource.type)
            && this.contextMenu.document.resource.geometry !== undefined;
    }


    public isMoveOptionAvailable(): boolean {

        if (!this.contextMenu.document) return false;

        return this.projectTypes.getHierarchyParentTypes(this.contextMenu.document.resource.type).length > 0;
    }


    private static computeOrientation(yPosition?: number): ContextMenuOrientation {

        return !yPosition || yPosition <= window.innerHeight * 0.6
            ? 'top'
            : 'bottom';
    }
}