import {Observable, Observer} from 'rxjs';
import {FieldDocument, Document} from 'idai-components-2';
import {ObserverUtil} from '../../util/observer-util';
import {ProjectConfiguration} from '../../configuration/project-configuration';
import {RelationDefinition} from '../../configuration/model/relation-definition';
import {Category} from '../../configuration/model/category';
import {ViewFacade} from '../view/view-facade';
import {RoutingService} from '../../../components/routing-service';


/**
 * This serves to centralize the behaviour of navigation buttons of both the sidebar as well as the
 * full scale list.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationService {

    private moveIntoObservers: Array<Observer<any>> = [];

    constructor(private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,
                private viewFacade: ViewFacade) {
    }


    public moveIntoNotifications = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.moveIntoObservers);


    public async jumpToView(document: FieldDocument) {

        await this.routingService.jumpToOperationView(document);
    }


    public shouldShowArrowTopRight(document: FieldDocument) {

        return this.showJumpToViewOption(document);
    }


    public async moveInto(document: FieldDocument|undefined) {

        await this.viewFacade.moveInto(document);
        ObserverUtil.notify(this.moveIntoObservers, undefined);
    }


    public async jumpToResourceInSameView(document: FieldDocument) { // arrow up

        await this.viewFacade.setExtendedSearchMode(false);
        await this.routingService.jumpToResource(document);
    }


    public async jumpToResourceFromOverviewToOperation(document: FieldDocument) { // arrow top right, when in search

        await this.routingService.jumpToResource(document);
        await this.viewFacade.setExtendedSearchMode(false);
        await this.routingService.jumpToResource(document);
    }


    public shouldShowArrowBottomRight(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.isInExtendedSearchMode()) return false;

        return (this.projectConfiguration
            .getRelationDefinitionsForRangeCategory(document.resource.category)
            .map((_: RelationDefinition) => _.name)
            .indexOf('liesWithin') !== -1);
    }


    public shouldShowArrowTopRightForSearchMode(document: FieldDocument) {

        return (this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode()
            && (!this.projectConfiguration
                .isSubcategory(document.resource.category, 'Operation')
                    && document.resource.category !== 'Place')
        );
    }


    public shouldShowArrowUpForSearchMode(document: FieldDocument) {

        return (!this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode())
            || (this.viewFacade.isInOverview() && this.viewFacade.isInExtendedSearchMode()
                && (this.projectConfiguration
                    .isSubcategory(document.resource.category, 'Operation')
                    || document.resource.category === 'Place')
            );
    }


    private showJumpToViewOption(document: FieldDocument): boolean {

        if (!document.resource.id) return false; // do not show as long as it is not saved
        if (this.viewFacade.isInExtendedSearchMode()) return false;

        const operationCategory: Category|undefined
            = this.projectConfiguration.getCategory('Operation');

        return operationCategory !== undefined && operationCategory.children !== undefined
            && operationCategory.children
                .map((category: Category) => category.name)
                .includes(document.resource.category);
    }
}
