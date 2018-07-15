import {Component, Input, OnChanges} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ProjectConfiguration, FieldDefinition} from 'idai-components-2/core';
import {ViewFacade} from '../view/view-facade';


type ConstraintListItem = { name: string; label: string; searchTerm: string };


@Component({
    moduleId: module.id,
    selector: 'search-constraints',
    templateUrl: './search-constraints.html'
})
/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsComponent implements OnChanges {

    @Input() type: string;

    public fields: Array<FieldDefinition>;
    public selectedField: FieldDefinition|undefined;
    public searchTerm: string = '';
    public constraintListItems: Array<ConstraintListItem> = [];

    private static textFieldInputTypes: string[] = ['input', 'text', 'unsignedInt', 'float', 'unsignedFloat'];


    constructor(private projectConfiguration: ProjectConfiguration,
                private modalService: NgbModal,
                private viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(() => this.reset());
    }


    ngOnChanges() {

        this.updateFields();
    }


    public async openModal(modal: any) {

        if (await this.modalService.open(modal).result == 'ok') await this.addNewConstraint();
    }


    public getSearchInputType(field: FieldDefinition|undefined): 'input'|'dropdown'|undefined {

        if (!field) return undefined;

        if (SearchConstraintsComponent.textFieldInputTypes.includes(field.inputType as string)) {
            return 'input';
        } else if (field.inputType === 'dropdown') {
            return 'dropdown';
        } else {
            return undefined;
        }
    }


    public selectField(fieldName: string) {

        this.selectedField = this.fields.find(field => field.name === fieldName);
        this.searchTerm = '';
    }


    public async removeConstraint(constraintName: string) {

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        delete constraints[constraintName];
        await this.viewFacade.setCustomConstraints(constraints);

        this.reset();
    }


    private async addNewConstraint() {

        if (!this.selectedField || this.searchTerm.length == 0) return;

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        constraints[this.selectedField.name + ':match'] = this.searchTerm;
        await this.viewFacade.setCustomConstraints(constraints);

        this.reset();
    }


    private reset() {

        this.updateConstraintListItems();
        this.selectedField = undefined;
        this.searchTerm = '';
    }


    private updateFields() {

        this.fields = this.projectConfiguration.getFieldDefinitions(this.type)
            .filter(field => field.constraintIndexed && this.getSearchInputType(field));
    }


    private updateConstraintListItems() {

        const constraints: { [name: string]: string } = this.viewFacade.getCustomConstraints();
        this.constraintListItems = Object.keys(constraints)
            .map(constraintName => {
                return {
                    name: constraintName,
                    label: this.getLabel(constraintName),
                    searchTerm: constraints[constraintName]
                }
            });
    }


    private getLabel(constraintName: string): string {

        const fieldName: string = constraintName.substring(0, constraintName.indexOf(':'));

        return this.projectConfiguration.getTypesMap()[this.type].fields
            .find((field: FieldDefinition) => field.name === fieldName).label;
    }
}