import './style.css';
import {Map, View, Overlay} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import FullScreen from 'ol/control/FullScreen.js';
import {useGeographic} from 'ol/proj.js';


useGeographic();


// Define all content of popup window
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Define view
const view = new View({
  center: [-99.095, 31.556],
  zoom: 6.5,
  minZoom: 6,
  extent: [-118.71, 21.94, -81.85, 42.13]
});

// Define Units layer
const units = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: './data/units.geojson',
  })
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    units
  ],
  overlays: [overlay],
  view: view,
});

// Add controls to map
const fullscreen = new FullScreen();
map.addControl(fullscreen);

// Define actions to popup for execution
// Closes popup
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Displays text in popup window
map.on('click', function (evt) {
  var feature = map.forEachFeatureAtPixel(evt.pixel, 
    function (feature, layer) {
      if (layer === units) {
        return feature;
      }
    });
    if (feature) {
      container.scrollTop = 0;
      const unnecessaryKeys = {'Name': "", 'Address': "", 'Senior Warden': "", 'Senior Warden Image': "", 'geometry': "", 'Phone': "", 'Location':""}
      var popupContent = '<h2>' + feature.get('Name') + '</h2>';

      // Primary Information
      popupContent += '<p> Address: ' + feature.get('Address') + '</p>';
      popupContent += '<p> Phone Number: ' + feature.get('Phone') + '</p>';
      popupContent += '<p> Senior Warden: ' + feature.get('Senior Warden') + '</p>';
      popupContent += '<img src=' + feature.get('Senior Warden Image') + ' alt="Senior Warden" width="200" height="200"></img>'

      // Additional Information
      popupContent += '<hr> <h4>Additional Infromation:</h4>';
      var unitsData = feature.getProperties()
      var unitsDataKeys = Object.keys(unitsData)
      var dataContent = '\n';
      for (let i = 0; i < unitsDataKeys.length; i++) {
        if (unitsDataKeys[i] in unnecessaryKeys === false) { 
          dataContent += '<p>' + unitsDataKeys[i] + ': ' + unitsData[unitsDataKeys[i]] + '</p>'; }
      }
      popupContent += dataContent;

      content.innerHTML = popupContent;
      const coordinate = evt.coordinate;
      overlay.setPosition(coordinate);
    }
})

map.on('pointermove', function(e){
  var pixel = map.getEventPixel(e.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  map.getViewport().style.cursor = hit ? 'pointer' : '';
});
