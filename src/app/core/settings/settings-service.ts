import {Injectable} from '@angular/core';
import {isString, set} from 'tsfun';
import {Settings} from './settings';
import {SettingsSerializer} from './settings-serializer';
import {PouchdbManager} from '../datastore/pouchdb/pouchdb-manager';
import {PouchdbServer} from '../datastore/pouchdb/pouchdb-server';
import {SampleDataLoader} from '../datastore/field/sample-data-loader';
import {M} from '../../components/messages/m';
import {SyncService} from '../sync/sync-service';
import {Name} from '../constants';
import {AppConfigurator} from '../configuration/app-configurator';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {Imagestore} from '../images/imagestore/imagestore';
import {ImageConverter} from '../images/imagestore/image-converter';
import {ImagestoreErrors} from '../images/imagestore/imagestore-errors';
import {Messages} from '../../components/messages/messages';
import {InitializationProgress} from '../initialization-progress';
import {jsonClone} from 'tsfun/struct';

const {remote, ipcRenderer} = typeof window !== 'undefined' ? window.require('electron') : require('electron');


export const PROJECT_MAPPING = {
    'meninx-project': { prefix: 'Meninx', label: 'Meninx' },
    'pergamongrabung': { prefix: 'Pergamon', label: 'Pergamon' },
    'wes': { prefix: 'WES', label: 'Warka Environs Survey' },
    'bogazkoy-hattusa': { prefix: 'Boha', label: 'Boğazköy-Ḫattuša' },
    'campidoglio': { prefix: 'Campidoglio', label: 'Campidoglio' },
    'castiglione': { prefix: 'Castiglione', label: 'Castiglione' },
    'kephissostal': { prefix: 'Kephissostal', label: 'Kephissostal' },
    'monte-turcisi': { prefix: 'MonTur', label: 'Monte Turcisi' },
    'al-ula': { prefix: 'AlUla', label: 'Al Ula' },
    'kalapodi': { prefix: 'Kalapodi', label: 'Kalapodi' },
    'gadara_bm': { prefix: 'Gadara', label: 'Gadara' },
    'sudan-heritage': { prefix: 'SudanHeritage', label: 'Sudan Heritage' },
    'ayamonte': { prefix: 'Ayamonte', label: 'Ayamonte' },
    'abbircella': { prefix: 'AbbirCella', label: 'AbbirCella' },
    'karthagocircus': { prefix: 'KarthagoCircus', label: 'Karthago Circus' },
    'selinunt': { prefix: 'Selinunt', label: 'Selinunt' },
    'olympia_sht': { prefix: 'Olympia', label: 'Olympia' }
};


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * It is connected to the imagestore and datastore
 * subsystems which are controlled based on the settings.
 *
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SettingsService {

    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();


    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private pouchdbServer: PouchdbServer,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private imageConverter: ImageConverter,
                private synchronizationService: SyncService) {
    }


    /**
     * Retrieve the current settings.
     * Returns a clone of the settings object in order to prevent the settings
     * object from being changed without explicitly saving the settings.
     * @returns {Settings} the current settings
     */
    public getSettings(): Settings {

        const settings = jsonClone(this.settings);
        settings.selectedProject =
            settings.dbs && settings.dbs.length > 0
                ? settings.dbs[0]
                : 'test';
        return settings;
    }


    public async bootProjectDb(settings: Settings, progress?: InitializationProgress): Promise<void> {

        try {
            await this.updateSettings(settings);

            if (progress) await progress.setPhase('settingUpDatabase');

            await this.pouchdbManager.loadProjectDb(
                this.getSettings().selectedProject,
                new SampleDataLoader(
                    this.imageConverter, this.settings.imagestorePath, Settings.getLocale(), progress
                )
            );

            if (this.settings.isSyncActive) await this.setupSync();
            await this.createProjectDocumentIfMissing();
        } catch (msgWithParams) {
            console.error(msgWithParams);
            await progress.setError('databaseError');
            throw msgWithParams;
        }
    }


    private static getConfigurationName(projectName: Name): Name|undefined {

        for (let [name, project] of Object.entries(PROJECT_MAPPING)) {
            if (projectName === name || projectName.startsWith(name + '-')) return project.prefix;
        }

        return undefined;
    }


    public async loadConfiguration(configurationDirPath: string,
                                   progress?: InitializationProgress): Promise<ProjectConfiguration> {

        if (progress) await progress.setPhase('loadingConfiguration');

        try {
            return this.appConfigurator.go(
                configurationDirPath,
                SettingsService.getConfigurationName(this.getSettings().selectedProject),
                this.settings.languages
            );
        } catch (msgsWithParams) {
            if (isString(msgsWithParams)) {
                msgsWithParams = [[msgsWithParams]];
            } else if (msgsWithParams.length > 0 && isString(msgsWithParams[0])) {
                msgsWithParams = [msgsWithParams];
            }

            msgsWithParams.forEach((msg: any) => console.error('Error in project configuration', msg));
            if (msgsWithParams.length > 1) {
                console.error('Number of errors in project configuration:', msgsWithParams.length);
            }

            await progress.setError('configurationError', msgsWithParams);
            throw 'Could not boot project';
        }
    }

    public async setupSync() {

        this.synchronizationService.stopSync();

        if (!this.settings.isSyncActive
                || !this.settings.dbs
                || !(this.settings.dbs.length > 0))
            return;

        if (!SettingsService.isSynchronizationAllowed(this.getSettings().selectedProject)) return;

        this.synchronizationService.init(this.settings);
        return this.synchronizationService.startSync();
    }


    public async addProject(project: Name) {

        this.settings.dbs = set(this.settings.dbs.concat([project]));
        await this.settingsSerializer.store(this.settings);
    }


    public async selectProject(project: Name) {

        this.synchronizationService.stopSync();

        this.settings.dbs = set([project].concat(this.settings.dbs));
        await this.settingsSerializer.store(this.settings);
    }


    public async deleteProject(project: Name) {

        this.synchronizationService.stopSync();

        await this.pouchdbManager.destroyDb(project);
        this.settings.dbs.splice(this.settings.dbs.indexOf(project), 1);
        await this.settingsSerializer.store(this.settings);
    }


    public async createProject(project: Name, destroyBeforeCreate: boolean) {

        this.synchronizationService.stopSync();

        await this.selectProject(project);

        await this.pouchdbManager.createDb(
            project,
            SettingsService.createProjectDocument(this.getSettings()),
            destroyBeforeCreate
        );
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     */
    public async updateSettings(settings: Settings) {

        settings = jsonClone(settings);
        this.settings = SettingsService.initSettings(settings);

        if (this.settings.syncTarget.address) {
            this.settings.syncTarget.address = this.settings.syncTarget.address.trim();
            if (!SettingsService.validateAddress(this.settings.syncTarget.address))
                throw 'malformed_address';
        }

        if (ipcRenderer) ipcRenderer.send('settingsChanged', this.settings);

        this.pouchdbServer.setPassword(this.settings.hostPassword);

        return this.imagestore.setPath(settings.imagestorePath, this.getSettings().selectedProject as any)
            .catch((errWithParams: any) => {
                if (errWithParams.length > 0 && errWithParams[0] === ImagestoreErrors.INVALID_PATH) {
                    this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
                } else {
                    console.error('Something went wrong with imagestore.setPath', errWithParams);
                }
            })
            .then(() => this.settingsSerializer.store(this.settings));
    }


    private async createProjectDocumentIfMissing() {

        try {
            await this.pouchdbManager.getDbProxy().get('project');
        } catch {
            console.warn('Didn\'t find project document, creating new one');
            await this.pouchdbManager.getDbProxy().put(
                SettingsService.createProjectDocument(this.getSettings())
            );
        }
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || remote.getGlobal('mode') === 'test');
    }


    private static validateAddress(address: any) {

        return (address == '')
            ? true
            : new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$').test(address);
    }


    /**
     * initializes settings to default values
     * @param settings provided settings
     * @returns {Settings} settings with added default settings
     */
    private static initSettings(settings: Settings): Settings {

        if (!settings.username) settings.username = 'anonymous';
        if (!settings.dbs || settings.dbs.length === 0) settings.dbs = ['test'];
        if (!settings.isSyncActive) settings.isSyncActive = false;
        if (settings.hostPassword === undefined) settings.hostPassword = this.generatePassword();

        if (settings.imagestorePath) {
            let path: string = settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            settings.imagestorePath = path;
        } else {
            if (remote.app){ // jasmine unit tests
                settings.imagestorePath = remote.app.getPath('appData') + '/'
                    + remote.app.getName() + '/imagestore/';
            }
        }
        return settings;
    }


    private static createProjectDocument(settings: Settings): any {

        return {
            _id: 'project',
            resource: {
                category: 'Project',
                identifier: settings.selectedProject,
                id: 'project',
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: settings.username, date: new Date() },
            modified: [{ user: settings.username, date: new Date() }]
        };
    }


    private static generatePassword(): string {

        const length: number = 8;
        const charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        let password: string = '';
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }

        return password;
    }
}
