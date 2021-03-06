import {isNot, undefinedOrEmpty} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {RelationPicker} from './relation-picker';
import {RelationDefinition} from '../../../../core/configuration/model/relation-definition';
import {getSuggestions} from '../../../../core/docedit/widgets/relationpicker/get-suggestions';
import {ReadDatastore} from '../../../../core/datastore/model/read-datastore';


/**
 * @author Thomas Kleinke
 */
export class DefaultRelationPicker extends RelationPicker {

    constructor(private resource: Resource,
                private relationDefinition: RelationDefinition,
                private datastore: ReadDatastore,
                private relationIndex: number) {

        super();
    }


    public async updateSelectedTarget(): Promise<void> {

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();

        if (isNot(undefinedOrEmpty)(relationTargetIdentifier)) {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                return Promise.reject(err);
            }
        } else {
            this.selectedTarget = undefined;
        }
    }


    public createRelation(target: Document) {

        this.resource.relations[this.relationDefinition.name][this.relationIndex] = target.resource.id;
        this.selectedTarget = target;
    }


    public deleteRelation() {

        this.resource.relations[this.relationDefinition.name].splice(this.relationIndex, 1);

        if (this.resource.relations[this.relationDefinition.name].length === 0) {
            delete this.resource.relations[this.relationDefinition.name];
        }
    }


    public async leaveSuggestionMode() {

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();
        if (!relationTargetIdentifier || relationTargetIdentifier === '') return this.deleteRelation();

        if (!this.selectedTarget && relationTargetIdentifier && relationTargetIdentifier !== '') {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                console.error(err);
            }
        }
    }


    public getSuggestions(idSearchString: string): Promise<Array<Document>> {

        return getSuggestions(
            this.datastore, this.resource, this.relationDefinition, idSearchString
        );
    }


    private getRelationTargetIdentifier(): string {

        return this.resource.relations[this.relationDefinition.name][this.relationIndex];
    }
}
