/* Mapbox settings for the resident map. The map only appears once
   MAPBOX_TOKEN is set (a public "pk." token from account.mapbox.com). */
export const MAP_STYLE = "mapbox/outdoors-v12";
export const MAP_ZOOM = 15.8;
export const MAP_SIZE = "800x440";

export function mapboxToken() {
  return process.env.MAPBOX_TOKEN || null;
}
