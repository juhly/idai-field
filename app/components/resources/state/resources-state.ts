import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment} from './navigation-path-internal';
import {includedIn, takeUntil} from '../../../util/list-util';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    private viewStates: { [viewName: string]: ResourcesViewState } = { 'project': ResourcesViewState.default() };
    private view: string = 'project';
    public loaded = false;
    private activeDocumentViewTab: string|undefined;


    constructor(
        private serializer: StateSerializer,
        private views: OperationViews
    ) {}


    /**
     * @throws if already initialized
     */
    public async initialize(viewName: string, defaultMode?: string): Promise<any> {

        if (!this.loaded) {
            this.viewStates = ResourcesViewState.complete(
                await this.serializer.load(StateSerializer.RESOURCES_STATE));
        }
        this.view = viewName;
        if (!this.viewStates[this.view]) this.viewStates[this.view] = ResourcesViewState.default();

        // if (defaultMode) this.setMode(defaultMode);
        // this.setActiveDocumentViewTab(undefined);
        this.loaded = true;
    }

    
    public resetForE2E = () => this.viewStates = { [this.view]: ResourcesViewState.default() };

    public getActiveDocumentViewTab = () => this.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getTypeForName(this.getView());

    public isInOverview = () => this.getView() == 'project';

    public getView = () => this.view;

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getTypeForName = (name: string) => this.views.getTypeForName(name);

    public getMainTypeDocument = (): IdaiFieldDocument|undefined => this.viewStates[this.view].mainTypeDocument;

    public getMode = () => this.viewStates[this.view].mode;

    public setMode = (mode: string) => this.viewStates[this.view].mode = mode;

    private serialize = () => this.serializer.store(StateSerializer.RESOURCES_STATE, this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.activeDocumentViewTab = activeDocumentViewTab;


    public setMainTypeDocument(document: IdaiFieldDocument|undefined) {

        if (document && !this.viewStates[this.view].navigationPaths[document.resource.id as string]) {
            this.viewStates[this.view].navigationPaths[document.resource.id as string] = NavigationPath.empty();
        }

        this.viewStates[this.view].mainTypeDocument = document;
    }


    public setQueryString(q: string) {

        this.withNavPath(
                navPath => !q ? this.getRootSegment(navPath).q = ''
                    : this.getRootSegment(navPath).q = q,
                navPath => !q ? navPath.q = ''
                    : navPath.q = q
            );
    }


    /**
     * @param types set undefined to erase types for current element
     */
    public setTypeFilters(types: string[]|undefined) {

        this.withNavPath(
                navPath => !types ? delete this.getRootSegment(navPath).types
                        : this.getRootSegment(navPath).types = types,
                navPath => !types ? delete navPath.types
                        : navPath.types = types
            );
    }


    public getQueryString(): string {

        const q = this.withNavPath(
                navPath => this.getRootSegment(navPath).q,
                navPath => navPath.q
            );
        return q ? q : '';
    }


    private getRootSegment(navigationPath: NavigationPathInternal) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
                (navigationPath.rootDocument as IdaiFieldDocument).resource.id)as NavigationPathSegment;
    }


    public getTypeFilters(): string[]|undefined {

        return this.withNavPath(
                navPath => this.getRootSegment(navPath).types,
                navPath => navPath.types
            ) as string[]|undefined;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(): string[] {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return [];

        const layersIds = this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string];
        return layersIds ? layersIds : [];
    }


    public removeActiveLayersIds() {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        delete this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string];
        this.serialize();
    }


    /**
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public moveInto(document: IdaiFieldDocument|undefined) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].navigationPaths[
            mainTypeDocument.resource.id as string] = ResourcesState.makeNewNavigationPath(
                this.getNavigationPathInternal(mainTypeDocument), document);
    }


    public setNavigationPath(newNavigationPath: NavigationPath) {

        const mainTypeDocument: IdaiFieldDocument|undefined = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        const currentNavigationPath: NavigationPathInternal = this.getNavigationPathInternal(mainTypeDocument);
        const currentNavigationPathResourceIds: Array<string> = currentNavigationPath.elements
            .map(element => element.document.resource.id as string);

        const result: NavigationPathInternal = {
            elements: [],
            rootDocument: newNavigationPath.rootDocument,
            q: currentNavigationPath.q,
            types: currentNavigationPath.types
        };

        if (!newNavigationPath.rootDocument ||
                currentNavigationPathResourceIds.indexOf(newNavigationPath.rootDocument.resource.id as string) > -1) {
            result.elements = currentNavigationPath.elements;
        } else {
            for (let document of newNavigationPath.elements) {
                const index: number = currentNavigationPathResourceIds.indexOf(document.resource.id as string);
                result.elements.push(index > -1 ?
                    currentNavigationPath.elements[index] :
                    {document: document}
                );
            }
        }

        this.viewStates[this.view].navigationPaths[mainTypeDocument.resource.id as string] = result;
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return NavigationPath.empty();

        return {
            elements: this.getNavigationPathInternal(mainTypeDocument).elements.map(toDocument),
            rootDocument: this.getNavigationPathInternal(mainTypeDocument).rootDocument
        }
    }


    private getNavigationPathInternal(operationTypeDocument: IdaiFieldDocument): NavigationPathInternal {

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[operationTypeDocument.resource.id as string];

        return path ? path : NavigationPath.empty();
    }


    private getCurrentNavigationPath(): NavigationPathInternal|undefined {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return NavigationPath.empty();

        return this.viewStates[this.view].navigationPaths[
                mainTypeDocument.resource.id as string
            ];
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this.viewStates[viewName].layerIds) objectToSerialize[viewName].layerIds = this.viewStates[viewName].layerIds;
        }

        return objectToSerialize;
    }


    private withNavPath(doWhenRootExists: (n: NavigationPathInternal) => any,
                        doWhenRootNotExists: (n: NavigationPathInternal) => any) {

        const navigationPath = this.getCurrentNavigationPath();
        if (!navigationPath) return;

        return navigationPath.rootDocument
            ? doWhenRootExists(navigationPath)
            : doWhenRootNotExists(navigationPath);
    }


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPathInternal,
        newRootDocument: IdaiFieldDocument|undefined): NavigationPathInternal {

        return (newRootDocument)
            ? {
                elements: this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    newRootDocument),
                rootDocument: newRootDocument,
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
            : {
                elements: oldNavigationPath.elements,
                // rootDocument <- undefined, because no document
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
    }


    private static rebuildElements(oldElements: Array<NavigationPathSegment>, oldRoot: IdaiFieldDocument|undefined,
                                   newRoot: IdaiFieldDocument) {

        if (includedIn(oldElements.map(toDocument))(newRoot)) return oldElements;

        return (oldRoot ? takeUntil(isSameSegment(oldRoot))(oldElements) : []).concat([{document: newRoot}]);
    }
}


const toDocument = (segment: NavigationPathSegment) => segment.document;

const isSameSegment = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;