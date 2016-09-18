import {Component, Input, OnChanges} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";

@Component({
    selector: 'map',
    template: `<div id="mapContainer"></div>`
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() documents: any;

    private map: L.Map;
    private mapElements: Array<L.ILayer> = [];

    constructor(private router: Router) {}

    public ngOnChanges() {

        if (!this.map) {
            this.initializeMap();
        } else {
            this.clearMap();
            this.map.setView([0, 0], 5);
        }

        for (var i in this.documents) {
            var resource = this.documents[i].resource;
            for (var j in resource.geometries) {
                this.addToMap(resource.geometries[j], this.documents[i]);
            }
        }
    }

    private initializeMap() {

        this.map = L.map("mapContainer", { crs: L.CRS.Simple }).setView([0, 0], 5);
        L.tileLayer("").addTo(this.map);
    }

    private clearMap() {

        for (var i in this.mapElements) {
            this.map.removeLayer(this.mapElements[i]);
        }

        this.mapElements = [];
    }
    
    private addToMap(geometry: any, document: IdaiFieldDocument) {

        switch(geometry.type) {
            case "Point":
                this.addMarkerToMap(geometry, document);
                break;
            case "Polygon":
                this.addPolygonToMap(geometry, document);
                break;
        }
    }

    private addMarkerToMap(geometry: any, document: IdaiFieldDocument) {

        var latLng = L.latLng(geometry.coordinates);
        var marker = new IdaiFieldMarker(latLng, { title: this.getShortDescription(document.resource) });
        marker.setDocument(document);

        var mapComponent = this;
        marker.on('click', function() {
            mapComponent.router.navigate(['resources',this.getDocument().resource.id]);
        });

        marker.addTo(this.map);
        this.mapElements.push(marker);
    }

    private addPolygonToMap(geometry: any, document: IdaiFieldDocument) {

        var polygon = new IdaiFieldPolygon(geometry.coordinates);
        polygon.setDocument(document);

        var mapComponent = this;
        polygon.on('click', function() {
            mapComponent.router.navigate(['resources',this.getDocument().resource.id]);
        });

        polygon.addTo(this.map);
        this.mapElements.push(polygon);
    }

    private getShortDescription(resource: IdaiFieldResource) {

        var shortDescription = resource.id;
        if (resource.shortDescription && resource.shortDescription.length > 0) {
            shortDescription += " | " + resource.shortDescription;
        }

        return shortDescription;
    }

}



