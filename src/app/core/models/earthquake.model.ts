export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  depth: number;
  url: string;
  tsunamiFlag: boolean;
  felt: number | null;
  alert: string | null;
  type: string;
  coordinates: [number, number, number]; // [lng, lat, depth]
}

export interface QuakeFeed {
  type: string;
  metadata: { generated: number; count: number; title: string };
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
    felt: number | null;
    alert: string | null;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  id: string;
}

export function featureToEarthquake(feature: GeoJSONFeature): Earthquake {
  return {
    id: feature.id,
    magnitude: feature.properties.mag ?? 0,
    place: feature.properties.place ?? 'Unknown',
    time: feature.properties.time,
    depth: feature.geometry.coordinates[2],
    url: feature.properties.url,
    tsunamiFlag: feature.properties.tsunami === 1,
    felt: feature.properties.felt,
    alert: feature.properties.alert,
    type: feature.properties.type,
    coordinates: feature.geometry.coordinates,
  };
}
