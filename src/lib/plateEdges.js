// Outer-ring outlines of the PB2002 plate polygons as LineStrings, minus the
// synthetic edges that the dataset adds along the +/-180 meridian where it
// splits plates that cross the antimeridian (Pacific, Antarctic, ...).
// Stroking those would draw a bogus vertical line across the globe.
//
// Every outer ring in the dataset is clockwise, so a line-offset to the right
// of the direction of travel always lands INSIDE the plate -- that's what lets
// the selected-plate highlight sit inside its edge instead of covering the
// boundary lines drawn on the edge itself.
const AM = 179.999

const isSeam = (a, b) =>
  Math.abs(a[0]) >= AM && Math.abs(b[0]) >= AM && Math.sign(a[0]) === Math.sign(b[0])

export function plateEdges(polygons) {
  const features = []
  for (const f of polygons?.features ?? []) {
    const g = f.geometry
    const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]
    for (const poly of polys) {
      const ring = poly[0]
      let run = []
      const flush = () => {
        if (run.length > 1) {
          features.push({
            type: 'Feature',
            properties: { Code: f.properties.Code },
            geometry: { type: 'LineString', coordinates: run },
          })
        }
        run = []
      }
      for (let i = 0; i < ring.length - 1; i++) {
        if (isSeam(ring[i], ring[i + 1])) { flush(); continue }
        if (!run.length) run.push(ring[i])
        run.push(ring[i + 1])
      }
      flush()
    }
  }
  return { type: 'FeatureCollection', features }
}
