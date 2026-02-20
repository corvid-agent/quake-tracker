import { Page } from '@playwright/test';

const QUAKE_FEATURE = {
  type: 'Feature',
  id: 'us7000test',
  properties: {
    mag: 5.2, place: '10km SW of Test City', time: Date.now(), updated: Date.now(),
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000test',
    detail: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us7000test&format=geojson',
    felt: 100, alert: 'green', tsunami: 0, type: 'earthquake', title: 'M 5.2 - 10km SW of Test City',
  },
  geometry: { type: 'Point', coordinates: [-118.2, 34.0, 10.5] },
};

function makeFeatures() {
  return Array.from({ length: 5 }, (_, i) => ({
    ...QUAKE_FEATURE,
    id: `us7000test${i}`,
    properties: {
      ...QUAKE_FEATURE.properties,
      mag: 3.0 + i,
      place: `${10 + i * 5}km SW of City ${i + 1}`,
      title: `M ${3.0 + i} - City ${i + 1}`,
      tsunami: i === 4 ? 1 : 0,
    },
  }));
}

export async function mockUSGSAPI(page: Page) {
  await page.route('**/earthquake.usgs.gov/earthquakes/feed/**', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        metadata: { generated: Date.now(), count: 5, title: 'USGS All Earthquakes, Past Day' },
        features: makeFeatures(),
      }),
    })
  );

  await page.route('**/earthquake.usgs.gov/fdsnws/event/**', route => {
    const url = route.request().url();
    const match = url.match(/eventid=([^&]+)/);
    const eventId = match ? match[1] : 'us7000test0';

    // Find the matching feature or use the first one
    const features = makeFeatures();
    const feature = features.find(f => f.id === eventId) ?? features[0];

    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        metadata: { generated: Date.now(), count: 1, title: `USGS Event ${eventId}` },
        features: [feature],
      }),
    });
  });
}
