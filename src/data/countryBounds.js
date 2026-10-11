// Approximate bounding boxes [west, south, east, north] of each country in the
// dataset, used to frame the camera when a country is picked from the search box.
// Derived from Natural Earth 1:50m (via the world-atlas package). Only the parts
// of a country near its volcanoes are counted, so far-flung territories
// (Easter Island, the Canaries, Alaska vs. Hawaii...) don't blow the box up, and
// longitudes are unwrapped around the volcanoes so antimeridian-crossing
// countries (Russia, New Zealand, Tonga...) get a compact box (east may exceed 180).
export const COUNTRY_BOUNDS = {
  Cameroon: [8.5, 1.7, 16.2, 13.1],
  'Cape Verde': [-25.3, 14.8, -22.7, 17.2],
  Chile: [-79, -53.9, -67, -17.5],
  Colombia: [-79, -4.2, -66.9, 12.4],
  Comoros: [43.2, -12.4, 44.5, -11.4],
  'Costa Rica': [-85.9, 8.1, -82.6, 11.2],
  'Dem. Rep. Congo': [12.2, -13.5, 31.3, 5.3],
  Ecuador: [-81, -5, -75.2, 1.5],
  Ethiopia: [33, 3.5, 48, 14.9],
  France: [55.2, -21.4, 55.8, -20.9],
  Greece: [19.6, 34.9, 28.2, 41.7],
  Guatemala: [-92.2, 13.7, -88.2, 17.8],
  Iceland: [-24.5, 63.4, -13.6, 66.5],
  Indonesia: [95.2, -10.9, 126.8, 5.9],
  Iran: [44, 25.1, 63.3, 39.8],
  Italy: [6.6, 36.7, 18.5, 47.1],
  Japan: [123.7, 24.3, 145.8, 45.5],
  Mexico: [-117.1, 14.5, -86.8, 32.7],
  'New Zealand': [166.5, -47.3, 183.9, -34.4],
  'North Korea / China': [124.3, 37.7, 130.7, 43],
  'Papua New Guinea': [140.9, -11.6, 156, -1.4],
  Peru: [-81.3, -18.3, -68.7, 0],
  Philippines: [117, 5.1, 126.6, 20.8],
  Russia: [27.4, 41.2, 190.3, 77.7],
  'Saint Vincent': [-61.4, 12.7, -61.1, 13.4],
  'South Korea': [126, 33.2, 130.9, 38.6],
  Spain: [-18.2, 27.6, -13.4, 29.2],
  Tanzania: [29.3, -11.7, 40.5, -1],
  Tonga: [-175.4, -21.5, -173.9, -18.6],
  Turkey: [26.1, 35.8, 44.8, 42.1],
  USA: [-171.8, 19, -67, 71.4],
  'United Kingdom': [-62.2, 16.7, -62.2, 16.7],
  Vanuatu: [166.5, -20.2, 169.9, -13.7],
}
