// PB2002 plate codes -> full plate names (fraxen/tectonicplates, Open Data
// Commons Attribution License -- credited in the app footer). Used to label
// neighboring plates in the plate detail modal, including ones that have no
// on-map label of their own.
export const PLATE_CODE_NAMES = {
  AF: 'Africa', AN: 'Antarctica', SO: 'Somalia', IN: 'India', AU: 'Australia',
  EU: 'Eurasia', NA: 'North America', SA: 'South America', NZ: 'Nazca',
  PA: 'Pacific', AR: 'Arabia', SU: 'Sunda', TI: 'Timor', KE: 'Kermadec',
  TO: 'Tonga', NI: "Niuafo'ou", WL: 'Woodlark', MO: 'Maoke', SB: 'South Bismarck',
  SS: 'Solomon Sea', NB: 'North Bismarck', NH: 'New Hebrides', CA: 'Caribbean',
  CO: 'Cocos', OK: 'Okhotsk', JF: 'Juan de Fuca', AP: 'Altiplano', ND: 'North Andes',
  ON: 'Okinawa', PS: 'Philippine Sea', AM: 'Amur', CL: 'Caroline', MA: 'Mariana',
  FT: 'Futuna', SC: 'Scotia', SL: 'Shetland', AS: 'Aegean Sea', AT: 'Anatolia',
  YA: 'Yangtze', BU: 'Burma', RI: 'Rivera', BH: "Bird's Head", MS: 'Molucca Sea',
  BS: 'Banda Sea', MN: 'Manus', CR: 'Conway Reef', BR: 'Balmoral Reef',
  EA: 'Easter', JZ: 'Juan Fernandez', GP: 'Galapagos', SW: 'Sandwich', PM: 'Panama',
}

// Curated data for the 15 plates with clickable labels (see PLATES in
// PlateLabels.jsx -- keyed by the same `name` string).
//
// Area: Wikipedia, "List of tectonic plates"
//   https://en.wikipedia.org/wiki/List_of_tectonic_plates
// Velocity + direction: consolidated from published approximate rate
// ranges (USGS-style educational figures). These are representative
// ranges, not a single precise vector -- real plate motion varies by
// point on the plate and by reference frame.
export const PLATE_META = {
  'Pacific Plate':        { code: 'PA', type: 'major', areaKm2: 103_300_000, velocity: [7, 10],    direction: 'northwest',        crust: 'Mostly oceanic', feature: 'Hosts the Hawaiian hotspot; borders the San Andreas Fault and the Mariana Trench', coords: [-155,   5] },
  'North American Plate': { code: 'NA', type: 'major', areaKm2: 75_900_000,  velocity: [1.5, 2.5],  direction: 'west-southwest',   crust: 'Mixed', feature: 'Mid-Atlantic Ridge on its eastern edge; Yellowstone hotspot beneath its interior', coords: [-100,  48] },
  'South American Plate': { code: 'SA', type: 'major', areaKm2: 43_600_000,  velocity: [2, 3],      direction: 'west',             crust: 'Mixed', feature: 'Forms the southern Mid-Atlantic Ridge; its collision with Nazca raised the Andes', coords: [ -55, -18] },
  'Eurasian Plate':       { code: 'EU', type: 'major', areaKm2: 67_800_000,  velocity: [0.7, 1.4],  direction: 'east-southeast',   crust: 'Mixed', feature: 'Collision with India raised the Himalayas; the Mid-Atlantic Ridge rift drives volcanism in Iceland', coords: [  55,  52] },
  'African Plate':        { code: 'AF', type: 'major', areaKm2: 61_300_000,  velocity: [2, 2.5],    direction: 'northeast',        crust: 'Mixed', feature: 'East African Rift is splitting the plate; Mid-Atlantic Ridge along its western edge', coords: [  22,   8] },
  'Australian Plate':     { code: 'AU', type: 'major', areaKm2: 47_000_000,  velocity: [6, 7],      direction: 'north-northeast',  crust: 'Mixed', feature: 'Tonga–Kermadec Trench to the east; the Alpine Fault crosses New Zealand', coords: [ 125, -28] },
  'Antarctic Plate':      { code: 'AN', type: 'major', areaKm2: 60_900_000,  velocity: [1, 2],      direction: 'the Atlantic',     crust: 'Mixed', feature: 'Bounded almost entirely by mid-ocean ridges; the West Antarctic Rift built the Transantarctic Mountains', coords: [   0, -78] },
  'Nazca Plate':          { code: 'NZ', type: 'minor', areaKm2: 15_600_000,  velocity: [6, 9],      direction: 'east-northeast',   crust: 'Oceanic', feature: 'Subducts under South America at the Peru–Chile Trench; East Pacific Rise on its western edge', coords: [ -95, -22] },
  'Caribbean Plate':      { code: 'CA', type: 'minor', areaKm2: 3_300_000,   velocity: [2, 2],      direction: 'east',             crust: 'Mostly oceanic', feature: 'Lesser Antilles volcanic arc on its east; Puerto Rico Trench is the deepest point of the Atlantic', coords: [ -75,  15] },
  'Cocos Plate':          { code: 'CO', type: 'minor', areaKm2: 2_900_000,   velocity: [6, 9],      direction: 'northeast',        crust: 'Oceanic', feature: 'Subducts at the Middle America Trench, feeding the Central America volcanic arc', coords: [ -88,  10] },
  'Philippine Plate':     { code: 'PS', type: 'minor', areaKm2: 5_500_000,   velocity: [4, 8],      direction: 'northwest',        crust: 'Oceanic', feature: 'Subducts at the Philippine Trench; meets the Okhotsk microplate at the Nankai Trough', coords: [ 133,  20] },
  'Arabian Plate':        { code: 'AR', type: 'minor', areaKm2: 5_000_000,   velocity: [1.5, 4.65], direction: 'northeast',        crust: 'Continental', feature: 'The Red Sea Rift split it from Africa; collision with Eurasia pushes up the Zagros Mountains', coords: [  47,  24] },
  'Indian Plate':         { code: 'IN', type: 'minor', areaKm2: 11_900_000,  velocity: [4, 5],      direction: 'north-northeast',  crust: 'Mixed', feature: 'Collision with Eurasia built the Himalayas and Tibetan Plateau; Central Indian Ridge on its west', coords: [  78,  22] },
  'Juan de Fuca Plate':   { code: 'JF', type: 'minor', areaKm2: 250_000,     velocity: [3, 4],      direction: 'east-northeast',   crust: 'Oceanic', feature: 'Cascadia subduction zone beneath North America builds the Cascade Range', coords: [-130,  47] },
  'Scotia Plate':         { code: 'SC', type: 'minor', areaKm2: 1_600_000,   velocity: [2, 2],      direction: 'west-southwest',   crust: 'Mixed', feature: 'Linked to the opening of the Drake Passage; East Scotia Ridge spreads 60–90 mm/yr', coords: [ -40, -57] },
}

// Boundary-type composition + neighboring plates, computed from the same
// plate_boundaries.json already driving the geo-transform / geo-divergent /
// geo-subduction map layers -- no new dataset needed for this part.
export function computePlateStats(code, boundaries) {
  const counts = { divergent: 0, subduction: 0, transform: 0 }
  const neighbors = new Map() // neighbor code -> Set<boundaryType>

  for (const f of boundaries?.features ?? []) {
    const { plateA, plateB, boundaryType } = f.properties || {}
    if (!plateA || !plateB || !boundaryType) continue
    if (plateA !== code && plateB !== code) continue

    counts[boundaryType] = (counts[boundaryType] || 0) + 1

    const other = plateA === code ? plateB : plateA
    if (!neighbors.has(other)) neighbors.set(other, new Set())
    neighbors.get(other).add(boundaryType)
  }

  return { counts, neighbors }
}
