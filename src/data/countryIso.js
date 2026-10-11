// Shared by the map (country polygons) and the search bar (country results).
// Maps the `country` field used in our dataset to ISO 3166-1 alpha-2 codes,
// which is how mapbox.country-boundaries-v1 identifies each country polygon.
// Only covers the countries actually present in volcanoes.json.
export const COUNTRY_ISO = {
  Cameroon: 'CM', 'Cape Verde': 'CV', Chile: 'CL', Colombia: 'CO', Comoros: 'KM',
  'Costa Rica': 'CR', 'Dem. Rep. Congo': 'CD', Ecuador: 'EC', Ethiopia: 'ET',
  France: 'FR', Greece: 'GR', Guatemala: 'GT', Iceland: 'IS', Indonesia: 'ID',
  Iran: 'IR', Italy: 'IT', Japan: 'JP', Mexico: 'MX', 'New Zealand': 'NZ',
  // Baekdu straddles the border and its `country` field reflects that --
  // mapped to North Korea's ISO since that's the primary attribution.
  'North Korea / China': 'KP',
  'Papua New Guinea': 'PG', Peru: 'PE', Philippines: 'PH', Russia: 'RU',
  'Saint Vincent': 'VC', 'South Korea': 'KR', Spain: 'ES', Tanzania: 'TZ',
  Tonga: 'TO', Turkey: 'TR', 'United Kingdom': 'GB', USA: 'US', Vanuatu: 'VU',
}
export const ISO_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_ISO).map(([name, iso]) => [iso, name])
)
