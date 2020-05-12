import {IndexFacade} from './core/datastore/index/index-facade';
import {ConstraintIndex} from './core/datastore/index/constraint-index';
import {ProjectConfiguration} from './core/configuration/project-configuration';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module IndexerConfiguration {


    export function configureIndexers(projectConfiguration: ProjectConfiguration, showWarnings = true) {

        const createdConstraintIndex = ConstraintIndex.make({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain', recursivelySearchable: true },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' },
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'isDepictedIn:exist': { path: 'resource.relations.isDepictedIn', type: 'exist' },
            'isInstanceOf:contain': { path: 'resource.relations.isInstanceOf', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' },
            'geometry:exist': { path: 'resource.geometry', type: 'exist' },
            'georeference:exist': { path: 'resource.georeference', type: 'exist' },
            'conflicts:exist': { path: '_conflicts', type: 'exist' },
        }, projectConfiguration.getCategoriesMap());

        const createdFulltextIndex = {};
        const createdIndexFacade = new IndexFacade(
            createdConstraintIndex,
            createdFulltextIndex,
            projectConfiguration.getCategoriesMap(),
            showWarnings
        );

        return { createdConstraintIndex, createdFulltextIndex, createdIndexFacade };
    }
}