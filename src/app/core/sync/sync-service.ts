import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {SyncStatus} from './sync-process';
import {PouchdbManager} from '../datastore/pouchdb/pouchdb-manager';
import {ObserverUtil} from '../util/observer-util';
import {Settings} from '../settings/settings';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SyncService {

    private status: SyncStatus = SyncStatus.Offline;
    private syncTarget: string;
    private project: string;
    private password: string = '';
    private currentSyncTimeout: any;

    private statusObservers: Array<Observer<SyncStatus>> = [];


    public constructor(private pouchdbManager: PouchdbManager) {}


    public getStatus = (): SyncStatus => this.status;


    public init(settings: Settings) {

        this.syncTarget = settings.syncTarget.address;
        this.project = settings.selectedProject;
        this.password = settings.syncTarget.password;
    }


    public statusNotifications = (): Observable<SyncStatus> => ObserverUtil.register(this.statusObservers);


    public async startSync() {

        if (!this.syncTarget || !this.project) return;

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        const url = SyncService.generateSyncUrl(this.syncTarget, this.project, this.password);
        const syncProcess = await this.pouchdbManager.setupSync(url, this.project);
        syncProcess.observer.subscribe(
            status => this.setStatus(status),
            err => {
                this.setStatus(err);
                syncProcess.cancel();
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            }
        );
    }


    public stopSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        this.pouchdbManager.stopSync();
        this.setStatus(SyncStatus.Offline);
    }


    public setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    private static generateSyncUrl(syncTarget: string, project: string, password: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        return !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + password + '@');
    }
}
