/* Turns a resident's address into map coordinates using the US Census
   geocoder (free, no key). Residents usually type just the street, so
   the community's city is added when no city or ZIP is given. Called
   only when an address is saved; a miss or an outage just means no
   map pin. */

const ENDPOINT =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const DEFAULT_LOCALITY = "Tucson, AZ";

export type Coordinates = { latitude: number; longitude: number };

export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  const hasLocality = /,|\b\d{5}\b|\b(az|arizona)\b/i.test(address);
  const query = hasLocality ? address : `${address}, ${DEFAULT_LOCALITY}`;
  const url = new URL(ENDPOINT);
  url.searchParams.set("address", query);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0]?.coordinates;
    if (typeof match?.x !== "number" || typeof match?.y !== "number") {
      return null;
    }
    return { latitude: match.y, longitude: match.x };
  } catch {
    return null;
  }
}
