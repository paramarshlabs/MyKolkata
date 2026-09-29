# /pujo: explore and plan together

The route is `/pujo` (`frontend/app/(main)/pujo/`). This is the feature spec: what the Pujo data in Supabase holds, and everything people can do with it. The data was checked against the live database on 30 Sep 2026.

## In one screen

- **Explore:** every pujo we have, split into the famous ones and the para pujos, on a map and in a list, with a page for each pujo.
- **Search** that forgives the fifteen ways "Sarbojanin" gets spelled. It works on its own and while adding pujos to a route.
- **Groups:** a group is one trip on one date. Pick any day from Mahalaya to Dashami, invite up to 25 people, and add up to 20 pujos.
- **The route** orders itself, is drawn on our map, and is followed live on the day. Google Maps export is there when someone needs it, 5 stops per link.
- **Food:** good places to eat in each area, and food stops added to the route alongside the pujos.
- **Where to meet:** members say where they're coming from. The app suggests fair halfway spots, the group agrees on one, and everyone gets directions to it from where they are.
- **Before you go:** an essentials checklist, and the helplines and help points near the route.

## What's there now

- **"Pandals near you"** shows two hardcoded pandals with made-up distances (`NEARBY_PANDALS` in `PujoClient.tsx`) next to a Google Maps iframe with no pandals on it.
- **"Where to go"** shows four cards from the old `regions` table, plus the search over the Pujo Personality's editorial routes (`RouteSearch.tsx`).
- **No code reads the 11 `kolkata_puja_*` tables.**
- **No groups exist.** `app/api/squad/rooms/{join,leave}` and `lib/squad` are empty folders.
- **Already in place:**
  - Ola Maps on `/near-you`: `components/explore/NearYouMap.tsx` and the tile proxy in `app/api/maps/ola/`.
  - Ola place search: `app/api/explore/search`.
  - OG image generation, used by the personality cards.
- **Sign-in doesn't return people to where they were.** `requireUser()` redirects to `/login` without a return path, and the Google button doesn't pass one, although `/auth/callback` already reads `?next=`.

## The data

### `kolkata_puja_pandals`: 776 rows

| Zone | Pandals | On the map | Pincodes |
| --- | --- | --- | --- |
| south | 365 | 276 | 51 |
| north | 171 | 158 | 17 |
| east | 111 | 107 | 21 |
| howrah | 64 | 58 | 16 |
| others (shown as "Suburbs") | 44 | 44 | 27 |
| central | 21 | 19 | 6 |

- **626 pandals have coordinates and aren't hidden.** Only those can go into a route. The other 114 still get a page and appear in lists.
- **Use:**
  - name
  - zone
  - locality and address
  - pincode
  - lat/lng
  - `is_featured`
  - the Red Road carnival rank and awards
- **Never show:** these columns are scraper filler.
  - `rating`, `view_count` and `crowd_level` are synthetic. The "low crowd" pandals have the most views.
  - `theme_description` is one of three templates ("…official registered member of Forum for Durgotsab…").
  - `sculpted_by` is "Kumartuli Artisan Committee" on 466 rows.
  - `established` is 1945 on 196 rows.
  - `nearby_slugs` is alphabetical.
  - `bus_routes` has 22 distinct lists across 776 rows.
  - `categories` says `unesco-listed` on 98 pandals. UNESCO listed Kolkata's Durga Puja as a whole; no single pandal is listed.
- **Fix in code, never in the table:**
  - **Merge duplicates** through a curated `DUPLICATES` map. Bagbazar appears 3 times, Ahiritola, Deshapriyanagar and Tridhara twice. The Bagbazar (#4) and Chetla Agrani (#1) carnival ranks sit on hidden rows, so merging has to carry them across.
  - **Shorten the names.** "HATIBAGAN SARBOJONIN DURGOTSAB COMMITTEE" becomes "Hatibagan Sarbojonin".
  - **Move wrong pins.** United Club (Ultadanga) is plotted in the south.
- **Nearest Metro and nearby pujos are computed from coordinates.** The scraped strings aren't used.

### Famous and para pujos

- **Famous** means `is_featured` (30) or a Red Road carnival rank (8). That's 34 pujos once duplicates merge.
- **Para pujos** are everything else: 592 on the map.
- **An app-owned override can promote or demote a pujo.** Some iconic pujos aren't marked featured in the data: Maddox Square, Mohammad Ali Park, Santosh Mitra Square, Singhi Park and Salt Lake FD Block (see "Still open").

### Sectors

- **Zones:** North, South, Central, East, Howrah, Suburbs.
- **Areas inside each zone** come from a curated pincode map in `lib/pujo/sectors.ts`, about 15–20 in all. For example:
  - Bagbazar–Kumartuli: 700003, 700005
  - Hatibagan–Shyambazar: 700004, 700006
  - Ballygunge–Gariahat: 700019, 700029
  - Kalighat–Bhowanipore: 700025, 700026
  - Behala–Barisha: 700008, 700034, 700038
  - Jadavpur–Garia: 700032, 700084
- **Pandals without a pincode** join the area with the nearest centre.

### The other tables

| Table | Use |
| --- | --- |
| `kolkata_puja_pois` (111) | 55 Metro stations with their line, 19 ferry ghats, 3 Puja help desks, 5 police stations, 4 hospitals, 5 landmarks, 2 car parks. Used for meeting spots, nearest Metro, and help near a route. |
| `kolkata_puja_helplines` (15) | City numbers for the essentials. Verify each before shipping; "Durga Puja Central Help Desk 1800-345-0345" has no source. |
| `kolkata_puja_panzika` (6) | Ritual times on Pujo days, like Sandhi Puja from 8:54 to 9:42 PM on Ashtami. |
| `kolkata_puja_gallery` (270) | **Not used.** The links expire on 4 Oct and the photos belong to other people. |
| `kolkata_puja_food_trail` (12) | Seeds our food picks (see "Places to eat" below). |
| hotels, chronicles, metro lines, immersion ghats | Not needed for these features. |

### Food data

There's little food data, and none of it says which places are good.

| Source | What it has | Use |
| --- | --- | --- |
| `kolkata_puja_food_trail` | 12 well-known places with what to order and hours, like Putiram's kochuri and Gupta Brothers' phuchka. Area only ("South Kolkata"), no coordinates. | Seed for our picks, after placing each on the map |
| `kolkata_puja_pois` restaurants | 5 with coordinates; 3 repeat the food trail. Kasturi Restaurant says Shyambazar but is plotted about 3 km south of it. | Seed for our picks, after checking |
| Pujo Personality plates (`lib/pujo-personality/recommendations.ts`) | Named picks with a dish: fish kabiraji at Mitra Café, egg devil at Niranjan Agar, daab sherbet at Paramount, biryani at Royal Indian Hotel and Aminia | Seed for our picks |
| Ola nearby search (already behind `/near-you`) | Real coverage: 20 places within 800 m of Bagbazar, including Mitra Cafe, Coffee O Kobita and Ganesh's fish kachori. No ratings: Mitra Cafe's details come back with a rating of −1 and no reviews. It also returns duplicates and some non-food places typed as restaurants: a grocery market and two clubs. | "More places near here", unranked |

- **About 20 places in total,** once the lists are merged.
- **Almost all of them are in Central and North Kolkata** and around Park Circus.
- **Howrah, the suburbs, Salt Lake, Dum Dum, Behala and Jadavpur have none yet.**

## Explore

### The `/pujo` page, top to bottom

1. **The countdown scene**, as it is now, with the Mahalaya player.
2. **Your groups:** a card per active group, soonest first. Each card shows:
   - the name
   - the day, as "Ashtami · Mon 19 Oct · in 5 days"
   - "7 of 25 people · 12 of 20 pujos"
   - the meeting spot, once it's set

   **"Plan a pujo trip"** is the page's one Crimson button. With no groups yet, the section reads: "No trips yet. Pick a day and a side of the city."
3. **Search** (below).
4. **The famous ones:** 34 larger cards on a horizontal rail on phones and in a grid on desktop, filterable by zone. Each card shows:
   - the name and area
   - "Red Road Carnival #1" or "Featured"
   - an "Add to a trip" button
5. **The map and list** (below).
6. **Para pujos by area:** compact rows grouped under area headings, like "Hatibagan–Shyambazar · 23". Each row shows the name, the nearest Metro and an Add button. Areas collapse to their first 5 rows with "Show all 23".
7. **Where to eat**, by area (see "Places to eat").
8. **Ready-made routes:** the existing `RouteSearch`, unchanged.
9. **The personality quiz entry**, as now.

The old region cards, `NEARBY_PANDALS` and the Google iframe go.

### The map

- **Built on the shared Ola setup.** Pull the boot code out of `NearYouMap.tsx` into a hook, and load the SDK only when the map nears the viewport.
- **Pujos are dots in a circle layer, not photo pins.** 626 pins would hide each other; dots show where Pujo is dense.
- **Filter chips:**
  - zone, then the areas inside it
  - "Famous only"
  - "Near a Metro" (156 pandals are within 500 m of a station)
- **"Near me"** asks for location on tap, never on page load. It shows a "you" dot and sorts the list by distance, all on the device.
- **Layers, off by default:**
  - Metro stations in their official line colours
  - help points: police stations, hospitals and Puja help desks
  - food: our picks at any zoom, and Ola's places once zoomed into a street
- **Tapping a pujo opens its info sheet** (below). The map always has a list beside it (side by side on desktop, a toggle on phones), and the list works when Ola doesn't.

### Pujo pages: `/pujo/pandal/[slug]`

- **Every pujo gets a page by its id (the slug).** Pages are public, so a link shared in WhatsApp opens for anyone. Adding a pujo to a trip needs sign-in.
- **What the page shows, all from real data:**
  - the short name, with the full registered name under it
  - the tier: Famous, with the carnival rank and awards, or "Para pujo"
  - zone and area, address and pincode
  - a small map of the pujo and its neighbours
  - the nearest Metro station and its line, with walking distance
  - the 5 nearest pujos, with walking minutes, famous ones marked
  - **Eat nearby:** our picks within ~800 m, with what to order, then "More places near here" from Ola
  - **Add to a trip:** pick one of your groups, shown with its date and count ("12 of 20", or "Full"), or start a new one
  - **Directions** (Google Maps) and **Share**
  - **"Pin in the wrong place?"**, a one-line report. 432 pins came from Google Places and nobody has checked them.
- **Filled in later:** photos, this year's theme, the artist, a short history. They live in an app-owned `PujoPandalDetail` table, so a re-scrape never overwrites them, and a section appears only once it has content. No "coming soon" placeholders.
- **Pujos without coordinates** get a page that says "No map location yet". Their Add button is off, because a route needs a position.

### The info sheet

The pujo page's content, in a sheet over the map or the add flow: bottom sheet on phones, side panel on desktop. It shows the same fields and the same Add button, plus "Open full page". People can read about a pujo without losing their place.

### Places to eat

- **Our picks are the "good places":** a hand-picked, app-owned list (`PujoFoodSpot`). Each pick has:
  - name, area and position
  - what to order, e.g. "Fish kabiraji"
  - hours, when known
  - diet: veg only, veg-friendly or mostly non-veg
  - a one-line note

  Picks are labelled "Our pick". The list starts with the ~20 places from the sources above, each placed and checked by hand, and grows area by area.
- **"More places near here"** comes from Ola's nearby search, labelled "Nearby, from Ola Maps" with no claim that the places are good.
  - Night clubs, grocery stores and markets are filtered out, and so are names that are only a locality.
  - Duplicates are merged by name and distance.
  - Results are cached per area for a day to save API calls, through the existing `placeSearchService`.
- **No ratings are shown.** Ola has none for these places, and the scraped pujo ratings are fake. To rank places properly later, add an Anakin feed of Google Maps or Zomato ratings per area. The Anakin account had 0 credits on 29 Sep.
- **Where food appears:**
  - "Where to eat" on `/pujo`: our picks as small cards under each area, with Ola's list below them. An area without picks shows only Ola's list.
  - the food map layer
  - "Eat nearby" on pujo pages
  - search
  - "Add a food stop" in the route

## Search

- **One search, everywhere:** the `/pujo` page, the "Add pujos" sheet in a group, and the nearby lists. It runs in the browser over all 740 records, so it's instant and works on a weak connection.
- **What it matches:**
  - name and full name
  - area, locality and pincode ("700006")
  - zone
  - nearest Metro: "Shyambazar metro" finds pujos near that station
  - our food picks by name ("mitra cafe"), listed in their own group under the pujos
- **It forgives spelling.** The data spells the same words many ways:

  | Word | Spellings in the data |
  | --- | --- |
  | Sarbojanin | Sarbojanin 161, Sarbojonin 22, Sarbajanin 8 |
  | Durgotsab | Durgotsab 118, Durgotsav 32, Durgotsob 3, Durgatsab 2 |
  | Pally | Pally 47, Palli 23 |
  | Samity | Samity 60, Samiti 8 |

  Query and names are normalised to one form. Filler words (Durga, Puja, Pujo, Committee, Sarbojanin) are ignored unless they're all that was typed. So "bagbazar" finds Bagbazar Sarbojanin, and "dum dum park" finds all three Dum Dum Park pujos.
- **Result order:**
  - famous first
  - then by distance: from the trip's route while adding pujos, from you if "Near me" is on, otherwise alphabetical
- **Each result shows:**
  - name, area and tier
  - distance, e.g. "0.4 km from your last stop"
  - Add, inside a group
  - tapping opens the info sheet
- **With no match:** "No pujo called 'xyz'. Try the para's name or a Metro station."

## Groups

A group is one pujo trip: a name, one date, its people, its route and its meeting spot.

### Creating one

One short sheet, three fields:

1. **The day.** A date strip from Mahalaya (10 Oct) to Dashami (21 Oct): any day, before or during Pujo. Each date carries its name in Bengali and English:

   | Date | Day |
   | --- | --- |
   | Sat 10 Oct | মহালয়া Mahalaya |
   | 11 Oct | প্রতিপদ Pratipada |
   | 12 Oct | দ্বিতীয়া Dwitiya |
   | 13 Oct | তৃতীয়া Tritiya |
   | 14 Oct | চতুর্থী Chaturthi |
   | 15 Oct | পঞ্চমী Panchami |
   | Fri 16 Oct | ষষ্ঠী Shashthi |
   | Sat 17 and Sun 18 Oct | সপ্তমী Saptami |
   | Mon 19 Oct | অষ্টমী Ashtami |
   | Tue 20 Oct | নবমী Navami |
   | Wed 21 Oct | দশমী Dashami |

   Past dates can't be picked. The window and labels live in `lib/pujo.ts`, next to `PUJO_DAYS`.
2. **The side of the city**, optional: a zone or an area. It frames the map and sets the default search filter. Any pujo can still be added.
3. **The name**, prefilled from the other two, like "North Kolkata, Tritiya". It can be edited.

"Create group" opens the new group with the Add pujos sheet up and an invite prompt.

### Limits

These are enforced in the database, not only in the UI:

- **25 members per group, hard cap**, organiser included. The join and the count happen in one transaction, so two people joining at once can't make 26.
- **20 pujos per group.** The Add sheet shows "12 of 20".
- **5 food stops per group,** on top of the 20 pujos.
- **10 active groups created per person**, and all writes are rate-limited (`lib/rateLimit.ts`).

### Inviting and joining

- **"Invite"** shares `/pujo/join/<code>` through the phone's share sheet, so it can go straight to WhatsApp. The code is random (128-bit). Any member can share it; the organiser can reset it, which kills the old link.
- **The invite page is public:**
  - the group name, day and date, and side of the city
  - the organiser's first name
  - "7 of 25 people · 12 pujos"
  - a small drawing of the route

  No other member names appear.
- **Guests and new users** see "Sign in to join". The button goes to Google, back to the invite page, and into the group in one flow. Signing up is signing in: Google is the only way in.
  - **This needs the return-path fix first.** `requireUser()` and the Google button carry `?next=` through `/login` and `/auth/callback`, accepting only same-site paths.
- **Signed-in visitors** tap "Join", and are in.
- **Edge cases:**
  - Full: "This group has 25 people, the most a group can hold. Ask Riya to make room."
  - Ended: "This trip has ended."
  - Reset link: "This link no longer works. Ask for a new one."
  - Already a member: straight to the group.

### Who can do what

| Action | Organiser | Member |
| --- | --- | --- |
| Add pujos | yes | yes |
| Remove a pujo | any | the ones they added |
| Reorder the route by hand | yes | no |
| Propose a meeting spot, say "Works for me" | yes | yes |
| Confirm the meeting spot | yes | no |
| Rename, move the date | yes | no |
| Share the invite link | yes | yes |
| Reset the invite link | yes | no |
| Remove members | yes | no |
| Delete the group | yes | no |
| Leave | the role passes to the longest-standing member | yes |

- Members appear by first name and initial, taken from their Google profile when they join. No emails and no photos.
- Every change shows who made it, e.g. "Added by Oishani".

### Expiry

- **A group expires when its day is over, at 6 am the next morning** (Kolkata time). Pandal hopping runs past midnight, so a midnight cut-off would end the trip mid-route.
- **At expiry:**
  - the group closes and leaves "Your groups"
  - the invite link stops working
  - live locations stop and starting points are deleted at once
  - everything else is deleted within a day

  A daily cron does the sweep, and every read checks `expiresAt` anyway.
- **The organiser can move the date** to another day in the window until the day starts; rain happens. Members see "Moved to Ashtami, Mon 19 Oct" at the top of the group.

### Staying in sync

The group updates for everyone while it's open. When anything changes, members get a nudge over a Supabase Realtime channel and refetch. As a fallback, the page refetches every 15 s and whenever the tab regains focus.

## The route

### Adding pujos

- **Only pujos from our data** with a map position can be added. Duplicates are refused.
- **The "Add pujos" sheet** has search at the top and three shortcuts under it:
  - **Famous in North Kolkata**, or whichever side the group is set to
  - **Near your route:** the closest pujos to the route's stops that aren't in it yet
  - **Pick on the map:** tap a dot, then Add
- **The info sheet opens from any result,** so people can read about a pujo before adding it.
- **Pujos can also be added from their own page** or from a card on `/pujo`.

### Food stops

- **A route holds pujos and food stops.** Food stops don't count toward the 20 pujos; a group can have up to 5.
- **Where food stops come from:**
  - our picks
  - Ola's places near the route: restaurants, cafés and sweet shops, filtered and de-duplicated
  - search by name, limited to places to eat

  A typed address can't be a food stop; it has to be a real place on the map.
- **"Add a food stop" sits between every two stops.** It lists places within ~400 m of that stretch: our picks first with what to order, then Ola's places.
- **Food stops take part in the automatic order:** each goes where it adds the least walking. A food stop can be anchored instead ("After Kumartuli Park"), and then it stays there.
- **Each food stop shows:**
  - who added it
  - what to order, for our picks
  - opening hours, when known
  - whether it's veg-friendly, when known
- **A Veg filter on the group** narrows suggestions to veg-friendly picks. Ola's places carry no diet information, so the filter hides them.

### Automatic order

- **By default the route orders itself.** It starts at the meeting spot once there is one. Before that, it starts wherever makes the shortest walk.
- **How:** nearest-neighbour, then 2-opt, over walking distance estimated as straight-line × 1.3. For 20 stops that runs on the device in milliseconds, and needs no API.
- **A new pujo or food stop goes where it adds the least walking,** not at the end.
- **The organiser can drag stops into their own order.** Move up and move down buttons do the same for keyboard and screen readers. The route then shows "Order set by Kaushik", and "Order automatically" brings the automatic order back.
- **The route shows:**
  - each leg's distance and walking time
  - the total distance for the day
  - which sectors it covers, e.g. "Bagbazar–Kumartuli, Hatibagan–Shyambazar"
- **Long legs get a hint.** Over about 2.5 km: "Long walk, 3.1 km. The Metro from Girish Park to Kalighat is quicker (Blue Line)." That hint appears only when both stations are within 800 m of the stops and on the same line. Otherwise: "Take a cab or an auto for this stretch."

### The walking path, live on our map

- **Once ordered, the route is drawn on our map:** the real walking path, numbered stops, and the meeting spot.
- **The path comes from Ola's Directions API in walking mode,** through a server route (`POST /api/pujo/route`). It uses the server key, has its own rate limit, and caches results by the ordered stop list. If Ola caps waypoints below 20, the route is requested in chunks and stitched together. Check the exact parameters in Ola's API reference first; the public overview pages don't list them.
- **If Ola fails,** stops are joined by dashed straight lines and the estimates stay.
- **The route is followed here.** Our map is where the group sees it, edits it and follows it on the day (see "On the day").

### Export to Google Maps

For when someone wants turn-by-turn directions in Google Maps. It's never the main path.

- **Google Maps takes 5 stops per link on phones:** a start, 3 stops in between, and an end. Food stops count as stops.
- **Long routes are split into linked legs** that share their ends: 1–5, 5–9, 9–13, and so on.
- **The export says so:** "Google Maps takes 5 stops at a time on phones. The whole route stays live here."
- Route links use walking mode.
- The personal link to the meeting spot is under "Where to meet".

## Where to meet

Members don't start from the same place. This tab helps the group pick one spot that's fair for everyone, then gets each person there.

### 1. Where everyone is coming from

- Each member can set a starting point, and it's optional. Three ways:
  - **Use my location.** Read on the phone, then snapped to the nearest Metro station or locality for display ("near Dum Dum Metro") and stored rounded to about 200 m.
  - **Type a place,** like "Dum Dum Metro" or "Garia bus stand". Our 55 Metro stations and the landmarks come up first, then Ola place search (`app/api/explore/search`).
  - **Drop a pin** on the map.
- **Others see a place name and a dot,** never exact coordinates. "Nobody's said where they're coming from yet" until someone does.

### 2. Suggested meeting spots

- **Suggestions appear once 2 or more members have a starting point** and the route has at least one pujo. The app suggests up to 3 spots.
- **Candidates:** the 55 Metro stations, the landmarks, and the route's first 3 pujos.
- **Each suggestion carries a label:**
  - **Fairest for everyone:** the farthest member's trip is as short as possible
  - **Least travel overall:** the lowest total distance
  - **Right by the first pujo:** saves a walk once everyone meets
- **Each one shows** every member's distance to it, as dashed lines on the map and in a list: "Riya 4.2 km · Oishani 6.8 km · you 3.1 km".
- **Distances are straight-line.** A spot on your Metro line can be quicker than a nearer one that isn't; Metro-aware scoring comes later.

### 3. Deciding together

- **Anyone can propose a spot:** tap a suggestion, pick a point on the map, or type a place. An optional note says where exactly, like "Gate 1, by the ticket counter". Up to 5 proposals are open at once.
- **Members tap "Works for me"** on a proposal, and the counts show. The organiser confirms one.
- **A confirmed spot:**
  - is pinned on everyone's map in Taxi Yellow
  - becomes the route's start, and the order recomputes
  - if changed later, shows everyone "Meeting spot moved to Shyambazar Metro"

### 4. Your way there

Once the spot is confirmed, each member sees their own way there:

- **"From you: 6.2 km."**
- **The Metro hint:** "Nearest Metro to you: Dum Dum (Blue Line). Nearest to the meeting spot: Shyambazar (Blue Line). Same line." When the lines differ, it names both stations.
- **"Directions to the meeting spot":** a Google Maps link. The start is the phone's current position, read when tapped; the end is the meeting spot; the mode is public transport. The position goes into the link and nowhere else.
- **"Route from the meeting spot":** the 5-pandal Google Maps legs from the export above.

### 5. The trip card

- **A shareable image** (1080×1350) of the plan:
  - the group name
  - the day in Bengali and English, and the date
  - the meeting spot
  - the numbered pujos drawn over the area's dots
  - the total distance
- **Made on the server with `next/og`,** like the personality cards, and shared through the share sheet.
- **It carries no member names and no starting points.**

## On the day

On the group's date, the group opens on the **Live** tab, from the morning until expiry at 6 am.

- **Share my live location:**
  - opt-in, off by default, and only on the group's date
  - visible only to the group's members
  - sent over a private Supabase Realtime channel that checks membership, and **never written to the database**
  - updates every ~15 s or every 25 m moved
  - stops at expiry, when turned off, or when the tab closes

  Members show as initials on the map. Someone who hasn't updated recently shows "seen 4 min ago".
- **Before everyone meets:** the map centres on the meeting spot. The list reads "Here", "1.2 km away" or "Not sharing" for each member.
- **After meeting:**
  - the next stop, with the walking time from you
  - "5 of 12 done"
  - within ~60 m of a stop, "At Kumartuli Park? Mark it done". Done stops dim with a tick for everyone.
- **"Lost the group?"** is one tap, because people get separated in Pujo crowds. It turns on location sharing (asking first), points everyone to the regroup spot (the next pujo, or the meeting spot if nobody's moved on), and shows the help numbers.
- **On Pujo days,** the day's ritual moments from the panjika sit at the top, e.g. "Sandhi Puja tonight, 8:54 to 9:42 PM".
- **Weak network:** mobile data drops in crowds. The route, stops, meeting spot and essentials are kept on the phone after the first load, so the list keeps working. The map shows whatever tiles it already has.

## Before you go

The **Essentials** tab, and a banner the day before: "Tomorrow's the trip. Check your essentials."

### The checklist

Each person ticks their own. Ticks are saved to their account, so they show on any device.

- Shoes you've already worn in. New shoes and twelve pandals means blisters.
- Band-aids
- A water bottle
- Sunscreen and a cap, if you're starting in daylight
- An umbrella or a raincoat. October still rains.
- A power bank, and a charged phone
- Cash in small notes. UPI slows down in a crowd.
- Tissues and sanitiser
- Your medicines, and a sachet of ORS
- A photo ID
- A small bag worn in front
- With children: your number on a card in their pocket

People can add their own items. The copy follows DESIGN.md §12: specific, no exclamation marks, no emoji.

### Shared items

Things one person brings for everyone: a power bank, an umbrella, a first-aid kit. Anyone can tap "I'll bring it", and the list shows "Riya's bringing the first-aid kit". Anyone can add a shared item.

### Help near your route

- **City numbers, always shown, tap to call:**

  | Service | Number |
  | --- | --- |
  | Police | 100 |
  | Emergency | 112 |
  | Ambulance | 102 |
  | Women's helpline | 1091 |
  | Child helpline | 1098 |
  | Fire | 101 |

- **The nearest police station, hospital and Puja help desk to the route,** with distance, from `kolkata_puja_pois`. The data is thin (5 police stations, 4 hospitals, 3 help desks), so a place is shown only if it's within ~3 km of a stop.
- **Every number is checked before it ships.**

## Design

### Layout

- **Phones first.** Every screen works at 390 px wide with a 16 px gutter.
- **On a phone:**
  - the map fills the top ~45% of the screen and the panel is a bottom sheet that drags up
  - the group page has four tabs: **Route · Meet · People · Essentials**, and on the day **Live** comes first
- **On desktop:** the map on the left (60%), the panel on the right.
- **The group header:**
  - the name
  - "অষ্টমী Ashtami · Mon 19 Oct · in 5 days"
  - member initials, "7 of 25", "12 of 20 pujos"
  - the Invite button

### The map's marks

| Thing | Mark | Colour |
| --- | --- | --- |
| Para pujo | 5 px dot, name from zoom ~14.5 | Pearl at 50% |
| Famous pujo | 9 px dot with a ring, name from zoom ~12 | Pop White |
| Route stop | 22 px numbered disc | Pop White disc, Obsidian numeral |
| Route path | 3 px line; dashed when estimated | Pearl at 70% |
| Selected pujo, or the next stop on the day | ring or pulse | Crimson, the one Crimson element on screen |
| Meeting spot | taxi pin | Taxi Yellow |
| You | dot with a soft halo | Pop White |
| Other members | initials in a disc | Slate disc, Pearl text |
| Metro stations (layer) | small square | official line colours (approved exception) |
| Help points (layer) | cross | Ash |
| Food stop in the route | numbered disc with a phuchka glyph | Obsidian disc, Pearl ring and glyph |
| Food pick (layer) | 14 px phuchka glyph | Pearl; Ola's places smaller, at 50% |

This keeps DESIGN.md's budgets: one Crimson moment, and yellow only for the meeting spot, the taxi being literally that yellow. Zones are told apart by filtering, never by colour.

### Behaviour

- **One primary action per screen:** "Plan a pujo trip", "Add pujos", "Invite", "Confirm this spot".
- **Every map action has a list equivalent.** Reordering works with buttons as well as drag. Changes are announced to screen readers. Touch targets are at least 44 px.
- **Motion:** the route line draws in when the order changes, and sheets slide. With reduced motion, both just appear.
- **Copy:**
  - empty states invite: "No pujos yet. Start with the famous ones in North Kolkata."
  - errors say the fix: "That place didn't match. Try a Metro station or a landmark."
- **Bengali day names** are set in Noto Sans Bengali, next to the English.

## Data model

New app-owned tables, added with `npm run db:push`, locked with RLS like the rest, and reached only through Prisma on the server:

```text
PujoGroup          id, name, date, area?, ownerId, inviteCode (unique), memberCount,
                   orderMode (auto | manual), meetingName?, meetingLat?, meetingLng?,
                   meetingNote?, meetingConfirmedAt?, createdAt, expiresAt
PujoGroupMember    groupId, userId, displayName, role (organiser | member),
                   startName?, startLat?, startLng?, checklist (json), joinedAt     @@id([groupId, userId])
PujoGroupStop      id, groupId, kind (pujo | food), pandalSlug?, foodSpotId?,
                   place (json: name, lat, lng, olaPlaceId)?, anchorAfter?,
                   position, addedBy, doneAt?                                       @@unique([groupId, pandalSlug])
PujoFoodSpot       id, name, area, zone, lat, lng, order, hours?, diet, note?, source, updatedAt
PujoMeetingOption  id, groupId, proposedBy, name, lat, lng, note?, createdAt
PujoMeetingVote    optionId, userId                                                  @@id([optionId, userId])
PujoGroupItem      id, groupId, label, claimedBy?
PujoPandalDetail   slug, description?, theme?, artist?, photos (json)?, famous?, updatedAt
PujoPinReport      id, pandalSlug, userId, note, createdAt
```

- **An Ola place is saved on the stop as a snapshot** (`place`), so the route still shows it if Ola changes or drops the place.
- **`pandalSlug` has no foreign key,** because the scraper can drop rows. A missing pujo shows as "No longer listed" instead of breaking the route.
- **Every route handler checks membership.** `tests/authBoundary.test.mjs` already enforces that writing routes call `currentUserId()`.
- **Live locations aren't a table.** They exist only on the Realtime channel.

### Privacy

- **Starting points** are optional, rounded to ~200 m, shown as a place name, and deleted at expiry.
- **Live location** is opt-in, only on the day, never stored, and visible only to the group.
- **The position used for a Google Maps link** is read on the phone and goes only into the link.
- **Members see each other** by first name and initial.
- **A group and everything in it** is deleted within a day of expiry.

## Build order

Each step depends on the one before. Ship one PR per step.

1. **Data:** the pandal loader (`lib/pujo/pandals.ts`), duplicate merge, display names, famous tier, sectors, and the search normaliser, with tests.
2. **Explore:**
   - the `/pujo` sections: famous rail, para pujos by area, map and list
   - the info sheet
   - pujo pages
   - "Pin in the wrong place?"
3. **Groups:**
   - the sign-in return path
   - create, invite, join, roles, limits and expiry
   - "Your groups"
4. **Route:** add pujos, automatic order, the Ola walking path, Google Maps export.
5. **Food:** our picks, "Where to eat", "Eat nearby", food stops in the route.
6. **Meet:** starting points, suggestions, proposals and votes, your way there, the trip card.
7. **On the day:** live locations, next stop, "Lost the group?", offline list.
8. **Before you go:** the checklist, shared items, help near the route.
9. **Map layers:** Metro, help points and food.

**Verify each step** with `npm test`, lint, and headless Chrome screenshots at 390 px and 1280 px (Chrome on this machine can't reach the dev server; use a CDP harness). Production needs `OLA_MAPS_API_KEY` and `OLA_MAPS_REQUEST_ORIGIN` on Vercel.

## Not in this version

- **Chat:** WhatsApp already does it.
- **Push notifications:** in-app banners only.
- **Photos and descriptions:** the `PujoPandalDetail` slots wait for verified content.
- **Crowd reports.**
- **Metro-aware meeting suggestions.**
- **Turning ready-made routes into trips.**
- **Food ratings,** until there's an Anakin feed for them.
- **The group leaderboard** (next section).

## Future: the group leaderboard

Not in this version. It ranks which groups travelled the most and saw the most pujos.

- **Taking part:**
  - The organiser enters the group; its name then shows publicly on the board.
  - Group names are checked against a blocklist.
- **What counts:** only pujos on the group's route, ticked on the group's date. A tick needs a geotagged photo, matched against the pandal's position:
  - The photo is taken in the app, and the phone's live location is read at the same moment. That location has to be within ~100 m of the pandal, allowing for the reading's accuracy.
  - If the photo carries its own location tag, it must agree. The tag has to be read on the phone before upload, because the upload redraws the photo, which drops the tag (`lib/ashtami-date/jpeg.ts`).
- **Why not the photo's tag alone:** it often isn't there, and it's easy to fake.
  - iPhones remove it when a photo is picked in the browser, and WhatsApp removes it too.
  - Anyone can edit it.
- **Score:**
  - Pujos verified first, then distance travelled.
  - Distance is measured along the chain of verified pujos (straight-line × 1.3), not from continuous tracking.
  - Impossible hops, like 5 km in 3 minutes, don't count.
  - One verified tick per pujo per group, and any member's photo counts for the group.
- **Boards:** the whole season, each day (the Ashtami board), and each zone. A "Leaderboard" band on `/pujo` shows the top groups, and each group's page shows its rank.
- **What's kept:**
  - Groups are deleted after their day, so the board keeps its own row per group: name, date, zone, pujos and distance. The board itself is deleted after the season.
  - Photos stay private to the group, in a private bucket through the Ashtami date's photo pipeline (`lib/ashtami-date/photos.ts`: EXIF stripped, signed URLs). They're deleted when the group expires.

## Decisions

Settled by the owner, 30 Sep:

1. **A group is one trip on one date.** Any day from Mahalaya to Dashami, not only the Pujo days. It expires when that day is over.
2. **Up to 25 members (hard cap) and up to 20 pujos per group.**
3. **The route lives on our platform.** Google Maps export exists, and says it takes 5 stops per link.
4. **Pujos come only from our data.** A meeting spot can be anywhere.
5. **The meeting spot is decided together.** Members share where they're coming from, the app suggests halfway spots, and each person gets directions from where they are.
6. **Guests and new users sign in to join.**
7. **Famous and para pujos are shown apart**, using `is_featured` and the carnival rank.
8. **No gallery photos.** Pictures and descriptions get filled in later.
9. **Metro lines use their official colours.**
10. **The dates:**
    - Mahalaya: Sat 10 Oct
    - Shashthi: Fri 16 Oct
    - Saptami: Sat–Sun 17–18 Oct
    - Ashtami and Sandhi Puja: Mon 19 Oct
    - Navami: Tue 20 Oct
    - Dashami and Sindoor Khela: Wed 21 Oct

    `lib/pujo.ts` has them.
11. **Food stops can be added to the route,** and the page shows good places to eat in each area.
12. **The group leaderboard is a future feature,** verified with geotagged photos.

Defaults chosen in this spec, easy to change:

- **Expiry at 6 am the next morning,** not midnight.
- **The organiser confirms the meeting spot;** members propose and vote.
- **Members remove only the pujos they added.**
- **Pujo pages are public.**
- **Up to 5 food stops per group,** on top of the 20 pujos.
- **Food stops must be real places:** our picks or Ola's, never a typed address.
- **"Good" means our picks.** Ola's places are listed as nearby, without ranking.

## Still open

- **Pre-Pujo day names.** Pratipada to Panchami (11–15 Oct) are counted back from Shashthi. Check them against the panjika.
- **Famous overrides.** Should Maddox Square, Mohammad Ali Park, Santosh Mitra Square, Singhi Park and Salt Lake FD Block count as famous? The data doesn't mark them.
- **Food picks for the empty areas:** Howrah, the suburbs, Salt Lake, Dum Dum, Behala and Jadavpur. Someone who knows them should add a few each, or ratings should come from Anakin.
- **The area list.** The pincode groups are a first cut. Someone who knows the paras should check the names and boundaries, for example whether Lake Town goes with Dum Dum or with Salt Lake.
