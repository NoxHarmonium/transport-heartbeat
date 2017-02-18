
export default function setupBaseLayer() {

  const layer = new L.StamenTileLayer("toner-background", {
    opacity: 0.5,
  });
  const map = new L.Map("mapid", {
      center: new L.LatLng(-37.8136, 144.9631),
      zoom: 12,
  });
  map.addLayer(layer);

  return map;
}
