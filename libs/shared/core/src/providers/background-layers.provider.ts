import { InjectionToken } from '@angular/core';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import BaseLayer from 'ol/layer/Base';
import TileLayer from 'ol/layer/Tile';
import { OSM, XYZ } from 'ol/source';
import WMTS, { Options, optionsFromCapabilities } from 'ol/source/WMTS';

const ARCGIS_WMTS =
  'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/1.0.0/WMTSCapabilities.xml';
const ARCGIS_LAYER_NAME = 'World_Imagery';
const ARCGIS_LIGHT_GRAY_TILES =
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

const resolveWmtsOptions = (
  capabilities: unknown,
  layerNames: string[],
  layerDisplayName: string
): Options => {
  for (const layerName of layerNames) {
    const options = optionsFromCapabilities(capabilities, {
      layer: layerName,
    });
    if (options) {
      return options as Options;
    }
  }

  throw new Error(`Unable to resolve WMTS options for ${layerDisplayName}`);
};
const layers: DefaultLayer[] = [
  {
    name: 'Orthophoto',
    factory: async () => {
      const parser = new WMTSCapabilities();
      const map = await fetch(ARCGIS_WMTS);
      const text = await map.text();
      const capabilities = parser.read(text);
      const options = resolveWmtsOptions(capabilities, [ARCGIS_LAYER_NAME], 'Orthophoto');
      const mainLayer = new TileLayer({
        source: new WMTS(options),
      });
      return mainLayer;
    },
  },
  {
    name: 'Light Gray',
    factory: async () => {
      return new TileLayer({
        source: new XYZ({
          url: ARCGIS_LIGHT_GRAY_TILES,
          crossOrigin: 'anonymous',
        }),
      });
    },
  },
  {
    name: 'OpenStreetMap',
    factory: async () => {
      return new TileLayer({
        source: new OSM(),
      });
    },
  },
]

type DefaultLayer = {
  name: string;
  factory: () => Promise<BaseLayer>;
};

type BackgroundLayers = {
  default: string;
  layers: DefaultLayer[];
};

export const BACKGROUND_LAYERS = new InjectionToken<BackgroundLayers>('BACKGROUND_LAYERS', {
  factory: () => ({
    default: 'Orthophoto',
    layers,
  }),
});
