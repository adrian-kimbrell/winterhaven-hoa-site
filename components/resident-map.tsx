/* The resident's street on a Mapbox map, with a copper pin drawn over
   its center. The picture comes through /api/map, so the page itself
   carries neither the coordinates nor the Mapbox token. */
export function ResidentMap({
  userId,
  address,
  name,
}: {
  userId: string;
  address: string;
  name: string;
}) {
  return (
    <section className="resident-section">
      <h2 className="replies-head">Where to Find Us</h2>
      <figure className="resident-map">
        <div className="resident-map-frame">
          <img
            src={`/api/map/${userId}`}
            alt={`Map of the streets around ${name}'s home at ${address}`}
            loading="lazy"
          />
          <span className="map-pin" aria-hidden="true" />
        </div>
      </figure>
    </section>
  );
}
