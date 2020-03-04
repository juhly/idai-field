import {Static} from '../../../static';
import {NavigationService} from '../../../../../app/core/resources/navigation/navigation-service';


describe('NavigationService', () => {

    let viewFacade;
    let projectConfiguration;
    let navigationService;


    beforeEach(() => {

        viewFacade = jasmine.createSpyObj(
            'vf',
            ['isInOverview', 'moveInto', 'isInExtendedSearchMode']
        );

        projectConfiguration = jasmine.createSpyObj(
            'pc',
            ['getRelationDefinitions', 'getTypesMap']
        );

        navigationService = new NavigationService(projectConfiguration, undefined, viewFacade);

        viewFacade.isInOverview.and.returnValue(false);
        viewFacade.isInExtendedSearchMode.and.returnValue(false);
    });


    it('show jump to view buttons in overview for operation subtypes ', () => {

        viewFacade.isInOverview.and.returnValue(true);
        projectConfiguration.getTypesMap.and.returnValue({
            Operation: { children: [ { name: 'operationSubtype' } ] }
        });

        expect(navigationService.showJumpToViewOption(
            Static.fieldDoc('abc', 'def', 'operationSubtype', 'jkl'))
        ).toEqual(true);
    });


    it('show move into buttons for resources that can be a liesWithin target', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'liesWithin'}]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            Static.fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(true);
    });


    it('do not show move into buttons for resources that cannot be a liesWithin target', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'abc'}]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            Static.fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(false);
    });


    it('do not show move into buttons for newly created resources without id', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'liesWithin'}]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            Static.fieldDoc('abc', 'def', 'ghi'))
        ).toEqual(false);
    });


    it('do not show hierarchy buttons in extended search mode', () => {

        viewFacade.isInOverview.and.returnValue(true);
        viewFacade.isInExtendedSearchMode.and.returnValue(true);

        projectConfiguration.getTypesMap.and.returnValue({
            Operation: { children: [ { name: 'operationSubtype' } ] }
        });

        expect(navigationService.shouldShowArrowBottomRight(
            Static.fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(false);

        expect(navigationService.showJumpToViewOption(
            Static.fieldDoc('abc', 'def', 'operationSubtype', 'jkl'))
        ).toEqual(false);
    });
});
