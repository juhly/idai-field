import {Component, OnChanges, Input} from '@angular/core';
import {ImageDocument} from 'idai-components-2';
import {ImageContainer} from '../../../core/images/imagestore/image-container';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole} from '../log-messages';


@Component({
    selector: 'image-viewer',
    moduleId: module.id,
    templateUrl: './image-viewer.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageViewerComponent implements OnChanges {

    @Input() image: ImageDocument;

    public imageContainer: ImageContainer;


    constructor(private imagestore: ReadImagestore) {}


    async ngOnChanges() {

        if (this.image) this.imageContainer = await this.loadImage(this.image);
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            image.imgSrc = await this.imagestore.read(
                document.resource.id, false, false
            );
        } catch (e) {
            image.imgSrc = BlobMaker.blackImg;
        }

        try {
            image.thumbSrc = await this.imagestore.read(
                document.resource.id, false, true
            );
        } catch (e) {
            image.thumbSrc = BlobMaker.blackImg;
        }

        this.showConsoleErrorIfImageIsMissing(image);

        return image;
    }


    private showConsoleErrorIfImageIsMissing(image: ImageContainer) {

        if (this.containsOriginal(image)) return;

        const imageId: string = image.document && image.document.resource
            ? image.document.resource.id
            : 'unknown';

        if (image.thumbSrc === BlobMaker.blackImg) {
            showMissingImageMessageOnConsole(imageId);
        } else {
            showMissingOriginalImageMessageOnConsole(imageId);
        }
    }
}
