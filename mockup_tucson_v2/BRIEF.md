# Winterhaven Village — Tucson v2 Shared Content Brief

Every mockup in this folder uses EXACTLY this content. Only the visual style varies.

## Setting

Winterhaven Village is a real-feeling HOA community in **Tucson, Arizona** — Sonoran desert, in the shadow of the Santa Catalina mountains. All copy, imagery captions, and motifs must feel authentically Tucson: saguaro, ocotillo, palo verde, prickly pear, adobe, monsoon skies, the Catalinas at sunset, desert wildlife (quail, javelina, hummingbirds). NO references to ridges, cedars, pines, coasts, or alpine anything.

## Homepage content

- Community name: **Winterhaven Village** · Tucson, Arizona
- Nav: Home, Directory, Board, News, CC&Rs, Community Board
- Hero: community name, tagline **"Desert living, neighborly spirit."** + scenic photo + CTA button "Resident Directory"
- Section "This Week at Winterhaven Village" — 3 news items:
  1. "Pool resurfacing begins Monday — swim laps under the Catalinas by July"
  2. "New native pollinator garden at the east gate — penstemon, fairy duster, and desert marigold are in"
  3. "Sunset potluck on the commons — June 21, bring a dish and a lawn chair"
- Section "The Lighter Side" (humor column teaser): "Caption contest: the Hendersons' cat vs. the drip irrigation system. Voting closes Friday."
- Section "From the Board": meeting minutes link ("May minutes posted"), project update "Clubhouse facelift: bids under review"
- Section "CC&R Corner — Question of the Week": Q: "Can I park my RV in my driveway overnight?" A: "Up to 72 hours for loading/unloading — see section 4.3."
- Section "Meet Your Neighbors" (directory preview): 3 resident cards — Margaret & Tom Ellis (and Biscuit the corgi), Robin Calloway, The Okafor Family (and Mango the parrot). The Margaret & Tom Ellis card MUST link to this style's profile page.
- Footer: "Winterhaven Village Homeowners Association · Tucson, Arizona · Est. 1987" + nav links
- Street names, if shown: Saguaro Lane, Ocotillo Court, Palo Verde Drive, Mesquite Way, Cholla Vista

## Profile page content (the demo directory entry)

- Residents: **Margaret & Tom Ellis** — 12 Ocotillo Court — residents since 1994
- Contact: (555) 012-3847 · m.ellis@example.com
- Portraits: Margaret https://i.pravatar.cc/400?img=32 · Tom https://i.pravatar.cc/400?img=11
- Bio paragraph: "Margaret taught third grade for thirty years and now runs the village book club with the same gentle authority. Tom, a retired civil engineer, spends his mornings on the loop trail before the heat sets in, photographing whatever the desert offers up. Their courtyard garden — penstemon, agave, and one stubborn rosebush — wins the spring garden walk more years than not, and they host the first porch gathering of every monsoon season."
- Residence photo (labeled as their home): https://picsum.photos/seed/ellishouse/1200/800
- Pets ("photo and name of pets"): **Biscuit** · Pembroke Welsh Corgi → https://placedog.net/600/450?id=12 ; **Clementine** · Tabby cat → https://placecats.com/400/300
- Include somewhere tasteful: "Directory listings are opt-in. Residents choose what to share."
- Profile page has same nav/footer as its homepage + a "← Back to Directory" affordance. Home links back to the homepage file.

## Assets

- Scenic photos: use the local `img/` folder — real Sonoran desert photos from Wikimedia Commons (see `img/CREDITS.txt`). Available: `sunset1.jpg` (saguaro sunset, landscape), `sonoran.jpg` (desert landscape), `pool.jpg` (Tucson resort pool), `house.jpg` (adobe house + ramada), `garden.jpg` (desert courtyard garden), `tucson.jpg` (Gates Pass), `catalinas.jpg` (Sabino Canyon, portrait), `saguaro-np.jpg` (portrait), `ocotillo.jpg` (portrait), `wildflowers.jpg` (portrait), `prickly-pear.jpg`, `saguaro-close.jpg`. NEVER use picsum.photos — it serves random non-desert imagery (snow!). Replace with real Winterhaven Village photos before anything ships.
- Avatars: https://i.pravatar.cc/300?img=N (homepage cards: 32, 12, 56)
- Pets: https://placedog.net and https://placecats.com
- Google Fonts via <link> allowed.

## Hard rules

- **NO EMOJIS. EVER.** Not in headings, buttons, badges, stickers, captions, or anywhere else. Use inline SVG icons or typographic glyphs instead. Monochrome print ornaments (fleurons, stars, the ≡ menu glyph) are acceptable; pictographic emoji are not.

## Quality bar

$20k-agency polish. Obsess over typography scale, spacing rhythm, hover states. Responsive (desktop-first, must not break on mobile). All CSS inline in a <style> tag, self-contained single files, no JS frameworks (tiny vanilla JS allowed).
