import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {DoceditImageTabPage} from '../docedit/docedit-image-tab.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {MapPage} from '../map/map.page';
import {ImageViewPage} from '../images/image-view.page';
import {ImageRowPage} from '../images/image-row.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * creation
 *   creation with relations
 *   messages
 *     after docedit closed, under various conditions
 * deletion
 *   including relations
 * operations
 *   creation, deletion, editing
 *   update of navbar
 * relations
 *   creation
 *   showing in sidebar
 *   showing in docedit afterwards
 * move
 *   contextMenu/moveModal
 * typechange
 * docedit/images
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 4);
        ResourcesPage.clickHierarchyButton('S1');
    });


    beforeEach(async done => {

        if (i > 0) {
            MenuPage.navigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickCloseNonResourcesTab();
            NavbarPage.clickTab('project');
            browser.sleep(delays.shortRest * 3);
            ResourcesPage.clickHierarchyButton('S1');
        }

        i++;
        done();
    });


    function addTwoImages(identifier) {

        ResourcesPage.openEditByDoubleClickResource(identifier);
        DoceditPage.clickGotoImagesTab();
        DoceditImageTabPage.clickInsertImage();

        DoceditImageTabPage.waitForCells();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }


    it('messages - everything fine / missing identifier', () => {

        ResourcesPage.performCreateResource('12');

        browser.sleep(2500);

        // warn if identifier is missing
        ResourcesPage.performCreateResource('', 'feature', 'diary',
            'p', false, false, false);

        NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        NavbarPage.awaitAlert('Bezeichner', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit('discard');
    });


    it('messages - same identifier', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,false, false,false);

        // do not warn if two different identifiers start with the same string
        ResourcesPage.performCreateResource('120',undefined,undefined,
            undefined,false, false,false);

        // same identifier
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,false, false,false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit('discard');
    });


    it('creation/docedit/savedialog -- save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('save');

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('2'));
    });


    it('creation/docedit/savedialog -- discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('discard');

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('1'));
    });


    it('creation/docedit/savedialog -- cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('cancel');
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit('discard');
    });


    it('create/edit/delete an operation and update navbar', () => {

        // edit
        NavbarPage.clickTab('project');
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toContain('S1'));

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest * 2);
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toContain('newIdentifier'));

        // delete
        ResourcesPage.clickOpenContextMenu('newIdentifier');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('newIdentifier');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(NavbarPage.getTab('resources', 't1')), delays.ECWaitTime);

        // create
        ResourcesPage.performCreateOperation('newTrench');
        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toContain('newTrench'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('fields', () => { // formerly sidebar/info

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'diary', '100');
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldName(0, 1).then(value => {
            expect(value).toBe('Tagebuch'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0, 1).then(value => {
            expect(value).toBe('100');
        });

        // Make sure there are only so much as expected
        FieldsViewPage.getFields(1).then(items => {
            expect(items.length).toBe(2);
        });
    });


    it('relations', () => {

        ResourcesPage.performCreateLink();

        // sidebar
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.clickAccordionTab(1);

        FieldsViewPage.getRelationValue(1, 0).then(value => {
            expect(value).toBe('2');
        });
        FieldsViewPage.getRelationName(1, 0).then(value => {
            expect(value).toBe('Zeitlich nach');
        });
        // Make sure there are only so much as expected
        FieldsViewPage.getRelations(1).then(relations => expect(relations.length).toBe(1));

        ResourcesPage.clickSelectResource('2', 'info');
        FieldsViewPage.getRelationName(1, 0).then(value => expect(value).toBe('Zeitlich vor'));
        FieldsViewPage.getRelationValue(1, 0).then(value => expect(value).toBe('1'));

        // docedit
        ResourcesPage.openEditByDoubleClickResource('1');
        expect(DoceditRelationsTabPage.getRelationButtonText('zeitlich-nach')).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText('zeitlich-vor')).toEqual('1');

        // deletion
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices('zeitlich-vor');
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
        ResourcesPage.clickSelectResource('2', 'info');
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('relations -- do not show new relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickGotoTimeTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('zeitgleich-mit');
        DoceditRelationsTabPage.typeInRelationByIndices('zeitgleich-mit', 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion('zeitgleich-mit', 0, 0);
        DoceditPage.clickCloseEdit('discard');

        ResourcesPage.clickSelectResource('1', 'info');
        browser.wait(EC.visibilityOf(element(by.id('popover-menu'))), delays.ECWaitTime);
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1)); // Only core
    });


    it('show only values of parent resource for campaign field in editor', () => {

        NavbarPage.clickTab('project');
        ResourcesPage.performCreateResource('trench', 'trench');
        ResourcesPage.clickHierarchyButton('trench');
        ResourcesPage.performCreateResource('feature', 'feature');
        ResourcesPage.openEditByDoubleClickResource('feature');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => expect(checkboxes.length).toBe(0));

        DoceditPage.clickCloseEdit();
        NavbarPage.clickTab('project');
        ResourcesPage.openEditByDoubleClickResource('trench');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => {
                expect(checkboxes.length).toBe(2);
                expect(checkboxes[0].getText()).toEqual('Testkampagne 1');
                expect(checkboxes[1].getText()).toEqual('Testkampagne 2');
            });

        DoceditPage.clickCheckbox('campaign', 0);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickHierarchyButton('trench');
        ResourcesPage.openEditByDoubleClickResource('feature');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => {
                expect(checkboxes.length).toBe(1);
                expect(checkboxes[0].getText()).toEqual('Testkampagne 1');
            });

        DoceditPage.clickCloseEdit();
    });


    it('deletion', () => {

        ResourcesPage.performCreateLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        ResourcesPage.clickOpenContextMenu('2');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);

        // relations
        ResourcesPage.clickSelectResource('1', 'info');
        // browser.wait(EC.visibilityOf(element(by.id('#relations-view'))), delays.ECWaitTime); // make sure relations view is really open
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1)); // Only core
    });


    it('do not reflect changes in list while editing resource', () => {

        ResourcesPage.performCreateResource('1a');
        DetailSidebarPage.doubleClickEditDocument('1a');
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1a');
        });
        DoceditPage.clickCloseEdit('discard');
    });


    it('typechange', () => {

        // toggleRangeOnOff to child type
        ResourcesPage.performCreateResource('1', 'feature');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldValue(0, 0).then(typeLabel => expect(typeLabel).toEqual('Architektur'));


        // delete invalid fields when changing the type of a resource to its parent type
        DetailSidebarPage.doubleClickEditDocument('1');

        DoceditPage.clickGotoChildPropertiesTab();
        DoceditPage.clickSelectOption('wallType', 1);
        DoceditPage.clickSaveDocument();

        browser.sleep(delays.shortRest);
        // ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.getFieldValue(1, 0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();

        FieldsViewPage.clickAccordionTab(0);
        FieldsViewPage.getFieldValue(0, 0).then(fieldValue => expect(fieldValue).toEqual('Stratigraphische Einheit'));
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
    });


    xit('hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });


    xit('remove new resource from list if docedit modal is canceled during resource creation', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        MapPage.clickMapOption('ok');
        DoceditPage.clickCloseEdit();
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(0));
    });


    xit('duplicate a resource', () => {

        ResourcesPage.performCreateResource('resource1', 'feature');
        ResourcesPage.openEditByDoubleClickResource('resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource3')), delays.ECWaitTime);
    });


    xit('create two instances of a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', 'resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
    });


    xit('contextMenu/moveModal - move a resource', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S2');
        ResourcesPage.clickResourceListItemInMoveModal('S2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toContain('S2'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(7));

        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    xit('contextMenu/moveModal - move an operation to root level', () => {

        NavbarPage.clickTab('project');
        browser.sleep(delays.shortRest * 2);
        ResourcesPage.performCreateResource('P1', 'place');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('P');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('Projekt');
        });
        ResourcesPage.typeInMoveModalSearchBarInput('P1');
        ResourcesPage.clickResourceListItemInMoveModal('P1');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(1));

        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('P');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            expect(labels[0].getText()).toEqual('Projekt');
        });
        ResourcesPage.clickResourceListItemInMoveModal('Projekt');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(5));
    });


    it('contextMenu/moveModal - show only type filter options for allowed parent types in move modal', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(7);
            expect(labels[0].getText()).toEqual('Schnitt');
            expect(labels[1].getText()).toEqual('Stratigraphische Einheit');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();

        NavbarPage.clickTab('project');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(1);
            expect(labels[0].getText()).toEqual('Ort');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();
    });


    it('contextMenu/moveModal - do not suggest current parent resource', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('trench', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
           for (let label of labels) expect(label.getText()).not.toEqual('S1');
        });
        ResourcesPage.clickCancelInMoveModal();

        ResourcesPage.performDescendHierarchy('SE0');

        ResourcesPage.clickOpenContextMenu('testf1');
        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('SE0');
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    it('contextMenu/moveModal - do not suggest descendants of current resource', () => {

        ResourcesPage.performDescendHierarchy('SE0');
        ResourcesPage.performCreateResource('SE-D1', 'feature');
        ResourcesPage.performDescendHierarchy('SE-D1');
        ResourcesPage.performCreateResource('SE-D2', 'feature');

        ResourcesPage.clickOperationNavigationButton();
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) {
                expect(label.getText()).not.toEqual('SE-D1');
                expect(label.getText()).not.toEqual('SE-D2');
            }
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    it('images', () => {

        // create links for images

        addTwoImages('SE0');
        ResourcesPage.clickSelectResource('SE0', 'info');
        ResourcesPage.clickThumbnail();
        ImageRowPage.getImages().then(images => expect(images.length).toBe(2));

        ImageViewPage.clickCloseButton();


        // delete links to one image

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();

        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(1);
        });
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickThumbnail();
        ImageRowPage.getImages().then(images => expect(images.length).toBe(1));

        ImageViewPage.clickCloseButton();


        // delete links to the other

        browser.wait(EC.presenceOf(ResourcesPage.getThumbnail()), delays.ECWaitTime);

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => expect(cells.length).toBe(0));
        DoceditPage.clickSaveDocument();

        browser.wait(EC.stalenessOf(ResourcesPage.getThumbnail()), delays.ECWaitTime);
    });
});
