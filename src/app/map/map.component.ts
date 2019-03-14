import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { MapService } from '../common/services/map.service';
import { first } from 'rxjs/operators';

@Component({
  selector   : 'app-map',
  templateUrl: './map.component.html',
  styleUrls  : ['./map.component.scss']
})
export class MapComponent implements OnInit {
  show: boolean = false;
  buttonName: string = '+';
  data: any = [];
  active: any = [];
  map: any;
  icon: any;
  inArray: any;
  outArray: any;
  markers: any = [];

  constructor(private http: HttpClient, private mapService: MapService) {
  }

  ngOnInit() {
    this.initMap();
    this.getData();
  }

  /**
   * To get data from JSON
   */
  getData() {
    this.mapService.getJSON().pipe(first()).subscribe(
      (response: any) => {
        this.data = response;
      },
      error => {
      });
  }

  /**
   * Init map
   */
  initMap() {
    this.map = L.map('frugalmap').setView([51.5, -0.09], 9);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map'
    }).addTo(this.map);
    this.icon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png'
    });
  }

  /**
   * To add marker to map
   * @param listName - source list
   * @param element - element which we add
   */
  addPoint(listName, element) {
    if (listName === 'data') {
      const elem = document.getElementById(element.name);
      let geo: any = [this.randomCoordinares(51.3, 51.8, 3), this.randomCoordinares(0.3, -0.4, 3)];
      if (elem.firstElementChild) {
        this.markers[element.name] = L.marker(geo, {icon: this.icon}).addTo(this.map).bindTooltip(element.name).openTooltip()
          .on('click', () => {
            this.clearMarkerByClick(this.markers[element.name], element.id);
          });
        element.children.forEach((item) => {
            geo = [this.randomCoordinares(51.3, 51.8, 3), this.randomCoordinares(0.3, -0.4, 3)];
            this.markers[item.name] = L.marker(geo, {icon: this.icon}).addTo(this.map).bindTooltip(item.name).openTooltip()
              .on('click', () => {
                this.clearMarkerByClick(this.markers[item.name], item.parent_id);
              });
          }
        );
      } else {
        this.markers[element.name] = L.marker(geo, {icon: this.icon}).addTo(this.map).bindTooltip(element.name).openTooltip()
          .on('click', () => {
            this.clearMarkerByClick(this.markers[element.name], element.id);
          });
      }
    }
  }

  /**
   * To remove marker and element in list by click on marker
   * @param element - marker from map
   * @param parentId
   */
  clearMarkerByClick(element, parentId) {
    const index = this.active.findIndex(item => item.name === element._tooltip._content);
    if (index !== -1) {
      this.changeListDestination('active', this.active[index]);
    } else {
      const indexParent = this.active.findIndex(item => item.id === parentId);
      const indexChild = this.active[indexParent].children.findIndex(item => item.name === element._tooltip._content);
      this.changeListDestination('active', this.active[indexParent].children[indexChild]);
    }
  }

  /**
   * To delete marker from map by click on list element
   * @param listName - source list
   * @param element - element which we delete
   */
  clearMarker(listName, element) {
    if (listName === 'active') {
      if (element.hasOwnProperty('children')) {
        this.map.removeLayer(this.markers[element.name]);
        delete this.markers[element.name];
        for (let i = 0; i < element.children.length; i++) {
          if (this.markers[element.children[i].name] !== 'undefined') {
            this.map.removeLayer(this.markers[element.children[i].name]);
            delete this.markers[element.children[i].name];
          }
        }
      } else {
        this.map.removeLayer(this.markers[element.name]);
        delete this.markers[element.name];
      }
    }
  }

  /**
   * To get random coordinates for markers
   * @param from
   * @param to
   * @param fixed
   * @returns {number}
   */
  randomCoordinares(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
  }

  /**
   * To change list source
   * @param listName - source list
   * @param element - element which was clicked
   */
  changeListDestination(listName, element) {
    listName === 'data' ? (this.inArray = this.active, this.outArray = this.data) : (this.inArray = this.data, this.outArray = this.active);
    this.moveElement(listName, element);
  }

  /**
   * To display changed arrays
   * @param listName - source list
   */
  displayChanges(listName) {
    listName === 'data' ? (this.active = this.inArray, this.data = this.outArray) : (this.data = this.inArray, this.active = this.outArray);
  }

  /**
   * Move elements to another array
   * @param listName - source list
   * @param element - element which we move
   */
  moveElement(listName, element) {
    this.clearMarker(listName, element);
    if (element.hasOwnProperty('children')) {
      const index = this.outArray.findIndex(item => item.id === element.id);
      if (this.inArray.find(x => x.parent_id === element.id)) {
        this.findAndRemoveElement(index, element);
      }
      this.inArray.push(element);
      this.addPoint(listName, element);
      this.outArray.splice(index, 1);
      this.displayChanges(listName);
    } else {
      event.stopPropagation();
      const indexOfParent = this.inArray.findIndex(item => item.id === element.parent_id);
      if (indexOfParent !== -1) {
        this.inArray[indexOfParent].children.push(element);
        const index = this.outArray.indexOf(element);
        this.outArray.splice(index, 1);

      } else {
        this.inArray.push(element);
        this.addPoint(listName, element);
        const index = this.outArray.findIndex(item => item.id === element.parent_id);
        const index2 = this.findChild(this.outArray[index], element.name);
        this.outArray[index].children.splice(index2, 1);
        this.displayChanges(listName);
      }
    }
  }

  /**
   * To find child index which we going to delete
   * @param parentElement
   * @param nameChild
   * @returns {any}
   */
  findChild(parentElement, nameChild) {
    let index;
    for (let i = 0; i < parentElement.children.length; i++) {
      if (parentElement.children[i].name === nameChild) {
        index = i;
      }
    }
    return index;
  }

  /**
   * Return to parent element all children elements from array in which we going to push parent element
   * @param indexInData - index parent element in source array
   * @param element - parent element
   */
  findAndRemoveElement(indexInData, element) {
    const newArray = [];
    for (let i = 0; i < this.inArray.length; i++) {
      if (this.inArray[i].parent_id === element.id) {
        this.outArray[indexInData].children.push(this.inArray[i]);
      } else {
        newArray.push(this.inArray[i]);
      }
    }
    this.inArray = newArray;
  }

  /**
   * To show/hide list
   */
  toggleList() {
    this.show = !this.show;
    if (this.show) {
      this.buttonName = '-';
    } else {
      this.buttonName = '+';
    }
  }
}
