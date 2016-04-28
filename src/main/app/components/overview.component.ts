import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef} from 'angular2/core';
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";
import {ObjectList} from "../services/object-list";
import {ProjectConfiguration} from "../services/project-configuration";
import {Http} from "angular2/http";
import {Messages} from "../services/messages";
import {ConfigLoader} from "../services/config-loader";

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent],
    providers: [ObjectList]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    /**
     * The object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;
    
    private projectConfiguration: ProjectConfiguration;


    /**
     * The object under creation which has not been yet put to the list permanently.
     * As soon as it is validated successfully newObject is set to "undefined" again.
     */
    private newObject: any;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        private objectList: ObjectList,
        private configLoader: ConfigLoader) {
    }

    public onSelect(object: IdaiFieldObject) {

        this.objectList.validateAndSave(this.selectedObject, true, true);

        if (this.newObject && object != this.newObject) this.removeObjectFromListIfNotSaved();

        this.selectedObject = object;
    }

    public onCreate() {

        this.objectList.validateAndSave(this.selectedObject, true, true);

        if (this.newObject) this.removeObjectFromListIfNotSaved();

        this.newObject = {};
        this.objectList.getObjects().unshift(this.newObject);

        this.selectedObject = this.newObject;
    }

    public ngOnInit() {
        this.configLoader.getProjectConfiguration().then((dmc)=>{
            this.projectConfiguration=dmc;
            if (this.config.environment == "test") {
                setTimeout(() => this.fetchObjects(), 500);
            } else {
                this.fetchObjects();
            }
        });
    }

    onKey(event:any) {

        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.objectList.setObjects(objects);
        }).catch(err => console.error(err));
    }

    private removeObjectFromListIfNotSaved() {

        if (!this.newObject.id) {
            var index = this.objectList.getObjects().indexOf(this.newObject);
            this.objectList.getObjects().splice(index, 1);
        }
        this.newObject = undefined;
    }

}
