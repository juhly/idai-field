import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiWidgetsModule} from 'idai-components-2';
import {imagesRouting} from './image-overview.routing';
import {ImageOverviewComponent} from './image-overview.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {ImagesState} from './view/images-state';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewTaskbarComponent} from './image-overview-taskbar.component';
import {ImageOverviewSearchBarComponent} from './searchbar/image-overview-search-bar.component';
import {ImageOverviewSearchConstraintsComponent} from './searchbar/image-overview-search-constraints.component';
import {DeleteModalComponent} from './delete-modal.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiWidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageOverviewComponent,
        ImageOverviewTaskbarComponent,
        ImageOverviewSearchBarComponent,
        ImageOverviewSearchConstraintsComponent,
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent,
        DeleteModalComponent
    ],
    providers: [
        ImagesState
    ]
})

export class ImageOverviewModule {}