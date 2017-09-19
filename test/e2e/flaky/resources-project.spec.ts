import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';
import {DoceditPage} from '../docedit/docedit.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

    beforeAll(() => {
        removeResourcesStateFile();
    });

    beforeEach(() => {
        return ProjectPage.get();
    });

    const appDataPath = browser.params.appDataPath;

    afterEach(done => {

        removeResourcesStateFile();
        common.resetConfigJson().then(done);
    });

    function performCreateProject() {

        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickProjectsBadge();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        browser.ignoreSynchronization=true;  // or false
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest * 50);
        ProjectPage.get();
        browser.ignoreSynchronization=false;  // or false
    }

    function removeResourcesStateFile() {

        const filePath = appDataPath + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    it('create & switch project', () => {

        performCreateProject();

        browser.sleep(1000);



        // -------------------
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType('trench');
        // browser.sleep(1000);
        ResourcesPage.clickSelectGeometryType();
        // DoceditPage.typeInInputField('abc_t1');
        // if (inputFieldText && inputFieldIndex) {
        //     DoceditPage.typeInInputField(inputFieldText, inputFieldIndex);
        // }
        // ResourcesPage.scrollUp();
        // DoceditPage.clickSaveDocument();
        // browser.sleep(delays.shortRest);

        // -------------------
        // ResourcesPage.performCreateResource('abc_t1', 'trench');




        // NavbarPage.clickNavigateToBuilding();
        // NavbarPage.clickNavigateToProject();
        // browser.sleep(delays.shortRest);
        //
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
        //
        // ProjectPage.clickProjectsBadge();
        //
        // ProjectPage.getProjectNameOptionText(1).then(t=>{
        //     expect(t).toContain('test')
        // });
        // NavbarPage.clickSelectProject(1);
        //
        // browser.sleep(delays.shortRest * 20);
        //
        // NavbarPage.clickNavigateToSettings();
        // NavbarPage.clickNavigateToExcavation();
        //
        // browser.sleep(delays.shortRest * 5);
        // ResourcesPage.typeInIdentifierInSearchField('con');
        // browser.sleep(delays.shortRest * 5);
        //
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
        //
        // ProjectPage.clickProjectsBadge();
        //
        // ProjectPage.getProjectNameOptionText(1).then(t=>{
        //     expect(t).toContain('abc')
        // });
        // NavbarPage.clickSelectProject(1);
        // browser.sleep(delays.shortRest * 10);
        //
        // NavbarPage.clickNavigateToProject();
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });
});
