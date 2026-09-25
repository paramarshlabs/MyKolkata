import type { ArchetypeId } from './types'

/*
 * The launch recommendations: editorial, curated per archetype, from
 * product-design/pujo-personality/06-recommendation-graph.md. Pujo 2026's
 * themes and timings are announced pandal by pandal after Mahalaya, so every
 * stop is re-checked before Shashthi, and the UI says so. Personalised ranking
 * over tagged places replaces this list in the next phase.
 */

export type Stop = { name: string; area: string; note: string }
export type Route = { id: string; title: string; when: string; zone: string; why: string; stops: Stop[] }
export type Diet = 'veg' | 'egg' | 'nonveg'
export type Pick = { name: string; area: string; note: string }
export type Plate = Pick & { diet: Diet }
export type Recommendations = {
  routes: Route[]
  pandals: Pick[]
  plates: Plate[]
  alsoTry: string[]
  playlist: { name: string; anchors: string[] }
}

export function mapsUrl(name: string, area?: string) {
  const query = [name, area, 'Kolkata'].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function listenUrl(query: string) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`
}

export const RECOMMENDATIONS: Record<ArchetypeId, Recommendations> = {
  night_owl: {
    routes: [
      {
        id: 'nabami-nishi-north', title: 'Nabami Nishi, North', when: 'Navami, 11:30 pm to 5:30 am', zone: 'North',
        why: 'The lights at their best, the queues gone, the river at the end.',
        stops: [
          { name: 'Tala Prattoy', area: 'Tala', note: 'Start where the lighting is strongest.' },
          { name: 'Hatibagan Sarbojanin', area: 'Hatibagan', note: 'The market is shut; the pandal is still lit.' },
          { name: 'Shyambazar five-point crossing', area: 'Shyambazar', note: 'A roll from whichever stall is still frying.' },
          { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'The old protima, with nobody in front of it.' },
          { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Where the goddess was made, lit for the night.' },
          { name: 'Ahiritola Sarbojanin', area: 'Ahiritola', note: 'Walk the lane slowly.' },
          { name: 'Bagbazar ghat', area: 'Bagbazar', note: 'First light over the river.' },
        ],
      },
      {
        id: 'after-the-adda-south', title: 'After the Adda, South', when: 'Ashtami, 1 am to 4:30 am', zone: 'South',
        why: 'The South, after the crowd goes home.',
        stops: [
          { name: 'Maddox Square', area: 'Ballygunge', note: 'Arrive as the adda thins.' },
          { name: 'Singhi Park', area: 'Gariahat', note: 'Traditional, and quiet by two.' },
          { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'The big protima, finally without a queue.' },
          { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'A theme reads better in an empty lane.' },
          { name: 'Deshapriya Park', area: 'Kalighat', note: 'The crowd that was here at nine has gone.' },
          { name: 'Tridhara Sammilani', area: 'Rashbehari', note: 'One of the South’s brightest, to finish.' },
        ],
      },
      {
        id: 'three-am-central', title: 'Three in the Morning, Central', when: 'Saptami, 2 am to 4 am', zone: 'Central',
        why: 'The viral pandals, at the one hour they are yours.',
        stops: [
          { name: 'College Square', area: 'College Street', note: 'The lights, doubled in the water.' },
          { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'The big one, without the queue.' },
          { name: 'Santosh Mitra Square', area: 'Bowbazar', note: 'This year’s replica, at its emptiest.' },
          { name: 'Sealdah station', area: 'Sealdah', note: 'Cha. The station never sleeps either.' },
        ],
      },
    ],
    pandals: [
      { name: 'College Square', area: 'College Street', note: 'Lights on the water after midnight.' },
      { name: 'Santosh Mitra Square', area: 'Bowbazar', note: 'The replica, with no queue at 3 am.' },
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'Sabeki, lit, and quiet after two.' },
      { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Where the goddess was made.' },
      { name: 'Ahiritola Sarbojanin', area: 'Ahiritola', note: 'A lane made for walking at night.' },
      { name: 'Tala Prattoy', area: 'Tala', note: 'Lighting worth the walk.' },
      { name: 'Hatibagan Sarbojanin', area: 'Hatibagan', note: 'The market asleep, the pandal awake.' },
      { name: 'Maddox Square', area: 'Ballygunge', note: 'After one, when the adda thins.' },
    ],
    plates: [
      { name: 'An egg-chicken roll', area: 'Near the big pandals', note: '2 am, eaten walking.', diet: 'nonveg' },
      { name: 'Cha in a bhaar', area: 'Outside the Metro', note: 'At 3 am, from the kettle that never goes cold.', diet: 'veg' },
      { name: 'Kochuri at dawn', area: 'North Kolkata sweet shops', note: 'As the shutters go up.', diet: 'veg' },
    ],
    alsoTry: [
      'End every night at a ghat, for first light.',
      'Jagaddhatri Puja in Chandannagar, 16 to 19 November: the lights, at their source.',
      'Walk it together, and share your plan with someone at home.',
    ],
    playlist: { name: 'Nabami Nishi', anchors: ['Bela Bose, Anjan Dutt', 'Moheener Ghoraguli', 'Fossils', 'Cizzy'] },
  },

  pandal_hunter: {
    routes: [
      {
        id: 'chaturthi-sweep-east', title: 'The Chaturthi Sweep, East', when: 'Chaturthi, 10 am to 4 pm', zone: 'East',
        why: 'The viral ones before the barricades, in one loop.',
        stops: [
          { name: 'Sreebhumi Sporting Club', area: 'Lake Town', note: 'The replica, before the barricades go up.' },
          { name: 'Dum Dum Park Tarun Sangha', area: 'Dum Dum Park', note: 'The first of the Dum Dum Park cluster.' },
          { name: 'Dum Dum Park Bharat Chakra', area: 'Dum Dum Park', note: 'Next door. Keep walking.' },
          { name: 'Salt Lake FD Block', area: 'Salt Lake', note: 'A Salt Lake fixture on the shortlists.' },
          { name: 'Beleghata 33 Pally', area: 'Beleghata', note: 'End on a theme the city will talk about.' },
        ],
      },
      {
        id: 'north-line-by-metro', title: 'The North Line, by Metro', when: 'Saptami, 11 am to 6 pm', zone: 'North',
        why: 'The North’s best, seven stations, no cab.',
        stops: [
          { name: 'Tala Prattoy', area: 'Near Belgachia Metro', note: 'Start at the top of the line.' },
          { name: 'Hatibagan Sarbojanin and Nalin Sarkar Street', area: 'Near Shyambazar Metro', note: 'Two themes, one walk.' },
          { name: 'Bagbazar Sarbojanin', area: 'Near Shyambazar Metro', note: 'The sabeki classic, for completeness.' },
          { name: 'Kumartuli Park', area: 'Near Shobhabazar Sutanuti Metro', note: 'Walk from the station.' },
          { name: 'Ahiritola Sarbojanin', area: 'Near Shobhabazar Sutanuti Metro', note: 'Two lanes from Kumartuli.' },
          { name: 'Kashi Bose Lane', area: 'Near Girish Park Metro', note: 'A community Pujo since 1937.' },
          { name: 'College Square and Mohammad Ali Park', area: 'Near Mahatma Gandhi Road Metro', note: 'Two in one stop, to finish.' },
        ],
      },
      {
        id: 'south-arc', title: 'The South Arc', when: 'Panchami, 11 am to 5 pm', zone: 'South',
        why: 'The South’s shortlist, in one clean arc.',
        stops: [
          { name: 'Suruchi Sangha', area: 'New Alipore', note: 'A South heavyweight. Go early.' },
          { name: 'Chetla Agrani', area: 'Chetla', note: 'The big one on this side.' },
          { name: 'Badamtala Ashar Sangha', area: 'Kalighat', note: 'Theme work worth the stop.' },
          { name: '66 Pally', area: 'Kalighat', note: 'Minutes away.' },
          { name: 'Deshapriya Park', area: 'Kalighat', note: 'Famous for going big.' },
          { name: 'Tridhara Sammilani', area: 'Rashbehari', note: 'A regular on the shortlists.' },
          { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'A theme to end on.' },
        ],
      },
    ],
    pandals: [
      { name: 'Sreebhumi Sporting Club', area: 'Lake Town', note: 'See it before it goes viral.' },
      { name: 'Tala Prattoy', area: 'Tala', note: 'On the shortlists, year after year.' },
      { name: 'Santosh Mitra Square', area: 'Bowbazar', note: 'The replica. Go before noon.' },
      { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'Big, central, one Metro stop.' },
      { name: 'Behala Notun Dal', area: 'Behala', note: 'The best reason to ride the Purple Line.' },
      { name: 'Barisha Club', area: 'Behala', note: 'Behala’s other must-see.' },
      { name: 'Salt Lake FD Block', area: 'Salt Lake', note: 'A Salt Lake fixture.' },
      { name: 'Kasba Bosepukur', area: 'Kasba', note: 'Famous for unusual materials.' },
    ],
    plates: [
      { name: 'Jhalmuri in a paper cone', area: 'Between any two pandals', note: 'Eaten walking. Obviously.', diet: 'veg' },
      { name: 'A cutlet, standing', area: 'The nearest cabin', note: 'Five minutes, then the next pandal.', diet: 'nonveg' },
      { name: 'Water, a banana, biscuits', area: 'Your bag', note: 'The Hunter’s lunch.', diet: 'veg' },
    ],
    alsoTry: [
      'The Kolkata Traffic Police Puja guide map, for the day’s diversions.',
      'The Purple Line to Behala: the fastest way to the South’s theme cluster.',
      'Blister plasters. You will need them by Saptami.',
    ],
    playlist: { name: 'Porer Ta', anchors: ['Holud Pakhi, Cactus', 'Fossils', 'Bollywood Pujo songs'] },
  },

  para_kid: {
    routes: [
      {
        id: 'amader-para', title: 'Amader Para, Ashtami', when: 'Ashtami, all day', zone: 'Your para',
        why: 'Your Pujo is where you belong.',
        stops: [
          { name: 'Your para’s pandal', area: 'Home', note: 'Anjali in the morning, new clothes on.' },
          { name: 'The bhog line', area: 'Home', note: 'Serve first. Then eat.' },
          { name: 'The evening function', area: 'Home', note: 'Stay for the uncle who sings Manna Dey.' },
          { name: 'The neighbouring paras', area: 'Next door', note: 'Three of them, to compare. And win.' },
          { name: 'The plastic chairs', area: 'Home', note: 'Till the lights go off.' },
        ],
      },
      {
        id: 'sabeki-classics', title: 'The Sabeki Classics', when: 'Saptami evening', zone: 'North',
        why: 'Community Pujos that feel like everyone’s para.',
        stops: [
          { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'An old-style protima and a real fair.' },
          { name: 'Kashi Bose Lane', area: 'North Kolkata', note: 'A community Pujo since 1937.' },
          { name: 'Kumartuli Sarbojanin', area: 'Kumartuli', note: 'The artisans’ own neighbourhood.' },
          { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'Where many old customs began. Check visiting hours.' },
        ],
      },
      {
        id: 'dashami-send-off', title: 'Dashami, the Send-off', when: 'Dashami', zone: 'Your para and the ghat',
        why: 'Asche bochor abar hobe.',
        stops: [
          { name: 'Sindoor khela and Bijoya', area: 'Your para', note: 'Hugs, pronam, a little crying.' },
          { name: 'The walk behind the truck', area: 'Your para', note: 'With the dhaak, all the way.' },
          { name: 'The ghat', area: 'Babughat, Bagbazar or wherever your para goes', note: 'Stay with your people.' },
          { name: 'The Bijoya rounds', area: 'Every relative', note: 'One more rosogolla, to be polite.' },
        ],
      },
    ],
    pandals: [
      { name: 'Your own para', area: 'Home', note: 'Always first.' },
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'A fair, a sabeki protima, a whole neighbourhood.' },
      { name: 'Kashi Bose Lane', area: 'North Kolkata', note: 'A community Pujo since 1937.' },
      { name: 'Samaj Sebi Sangha', area: 'Lake View Road', note: 'An old South Kolkata community Pujo.' },
      { name: 'Singhi Park', area: 'Gariahat', note: 'A South para favourite, traditional.' },
      { name: 'Ballygunge Cultural Association', area: 'Ballygunge', note: 'Traditional, and much loved.' },
      { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'A big community protima.' },
      { name: 'Maddox Square', area: 'Ballygunge', note: 'Where the South’s paras meet.' },
    ],
    plates: [
      { name: 'Khichuri bhog', area: 'Your para', note: 'Labra, beguni, a spoon of chutney. 1 pm.', diet: 'veg' },
      { name: 'The para stall’s chowmein', area: 'Your para', note: 'Evening. Every year. Never changes.', diet: 'egg' },
      { name: 'The Bijoya platter', area: 'Every relative', note: 'Nimki, narkel naru, ghugni.', diet: 'veg' },
    ],
    alsoTry: [
      'Look for the blood donation camps many committees run.',
      'Kojagari Lokkhi Pujo, five days after Dashami.',
      'Bring a friend who has never done a para Pujo.',
    ],
    playlist: { name: 'Amader Para', anchors: ['Mahishasuramardini', 'Old Pujo songs', 'Dola Re Dola'] },
  },

  pujo_romantic: {
    routes: [
      {
        id: 'ei-path-north', title: 'Ei Path, North', when: 'Ashtami, 4:30 pm to 8 pm', zone: 'North',
        why: 'Dusk, water, light and one plate.',
        stops: [
          { name: 'Kumartuli', area: 'Kumartuli', note: 'The lanes where the goddess was made.' },
          { name: 'Bagbazar ghat', area: 'Bagbazar', note: 'Sunset over the river, around 5:15.' },
          { name: 'A rickshaw to Shobhabazar', area: 'North Kolkata', note: 'The long way, on purpose.' },
          { name: 'Shobhabazar Sutanuti Metro', area: 'Shobhabazar', note: 'Three stops south.' },
          { name: 'College Square', area: 'College Street', note: 'The lights on the water.' },
          { name: 'Paramount', area: 'College Square', note: 'One daab sherbet, two straws.' },
        ],
      },
      {
        id: 'dusk-south', title: 'Dusk, South', when: 'Saptami, 5 pm to 9 pm', zone: 'South',
        why: 'The South before the crowd, and a table for two.',
        stops: [
          { name: 'Maddox Square', area: 'Ballygunge', note: 'Early, before the adda arrives.' },
          { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'A theme to talk about.' },
          { name: 'Roastery Coffee House', area: 'Hindustan Park', note: 'A table on the porch. Check Pujo hours.' },
          { name: 'Rabindra Sarobar', area: 'Southern Avenue', note: 'A slow walk by the lake.' },
          { name: 'Tridhara Sammilani', area: 'Rashbehari', note: 'The bright one, to end.' },
        ],
      },
      {
        id: 'dashami-ghat', title: 'Dashami, the Ghat', when: 'Dashami evening', zone: 'The river',
        why: 'The quietest moment of the loudest week.',
        stops: [
          { name: 'Your para', area: 'Home', note: 'Bijoya first.' },
          { name: 'Babughat', area: 'Strand Road', note: 'Watch the immersion, quietly.' },
          { name: 'Prinsep Ghat', area: 'Strand Road', note: 'The long walk back along the river.' },
        ],
      },
    ],
    pandals: [
      { name: 'College Square', area: 'College Street', note: 'Lights on the water.' },
      { name: 'Maddox Square', area: 'Ballygunge', note: 'Early evening, before the crowd.' },
      { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Lanes made for slow walks.' },
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'Old-style, with the ghat next door.' },
      { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'A thakur dalan at dusk.' },
      { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'Themes to talk about.' },
      { name: 'Singhi Park', area: 'Gariahat', note: 'Traditional, and lovely.' },
      { name: 'Samaj Sebi Sangha', area: 'Lake View Road', note: 'Heritage, and quiet corners.' },
    ],
    plates: [
      { name: 'One plate of phuchka, shared', area: 'Any stall with a queue of couples', note: 'Two people, no talking.', diet: 'veg' },
      { name: 'Daab sherbet', area: 'Paramount, College Square', note: 'One glass, two straws.', diet: 'veg' },
      { name: 'Mishti doi in a clay pot', area: 'A sweet shop on the way home', note: 'The last stop.', diet: 'veg' },
    ],
    alsoTry: [
      'The kaash fields along the Rajarhat roads, before Pujo.',
      'The Kojagari full moon at the ghat, five days after Dashami.',
      'Write someone a Bijoya letter.',
    ],
    playlist: { name: 'Ei Path', anchors: ['Ei Path Jodi Na Shesh Hoy', 'Amake Amar Moto Thakte Dao, Anupam Roy', 'Bojhena Shey Bojhena, Arijit Singh', 'Mone Pore Ruby Roy'] },
  },

  pet_pujari: {
    routes: [
      {
        id: 'bhog-to-biryani', title: 'Bhog to Biryani', when: 'Saptami, 1 pm to 2 am', zone: 'North and Central',
        why: 'Every pandal is next to something. This route is next to everything.',
        stops: [
          { name: 'A Pujo that serves public bhog', area: 'North Kolkata', note: 'Ask at the pandal. Many serve visitors at lunch.' },
          { name: 'Mitra Café', area: 'Shobhabazar', note: 'Fish kabiraji, fried the same way since 1920.' },
          { name: 'Ahiritola Sarbojanin', area: 'Ahiritola', note: 'A pandal, for digestion.' },
          { name: 'Niranjan Agar', area: 'Girish Park', note: 'The egg devil.' },
          { name: 'Paramount', area: 'College Square', note: 'A sherbet, and the College Square pandal.' },
          { name: 'Royal Indian Hotel', area: 'Chitpur Road', note: 'Biryani. With the aloo.' },
          { name: 'Park Circus', area: 'Park Circus', note: 'Kebabs, late.' },
        ],
      },
      {
        id: 'cabin-crawl-north', title: 'The Cabin Crawl, North', when: 'Ashtami, 3 pm to 8 pm', zone: 'North',
        why: 'Five legacy kitchens and the pandals between them.',
        stops: [
          { name: 'Allen’s Kitchen', area: 'Shobhabazar', note: 'The prawn cutlet.' },
          { name: 'Mitra Café', area: 'Shobhabazar', note: 'Brain chop, or the fish kabiraji.' },
          { name: 'Golbari', area: 'Shyambazar', note: 'Kosha mangsho.' },
          { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'The fair’s telebhaja.' },
          { name: 'Niranjan Agar', area: 'Girish Park', note: 'The egg devil, to finish.' },
        ],
      },
      {
        id: 'dawn-and-dumplings', title: 'Dawn and Dumplings', when: 'Navami, 6 am to 11 am', zone: 'Central',
        why: 'The best Pujo breakfast nobody talks about.',
        stops: [
          { name: 'Tiretta Bazaar', area: 'Poddar Court', note: 'Chinese breakfast at first light.' },
          { name: 'Bhim Chandra Nag', area: 'Bowbazar', note: 'Sandesh from an old sweet house.' },
          { name: 'Putiram', area: 'College Street', note: 'Kochuri.' },
          { name: 'Indian Coffee House', area: 'College Street', note: 'Infusion and a cutlet.' },
        ],
      },
    ],
    pandals: [
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'The fair, and its telebhaja.' },
      { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'Mitra Café is round the corner.' },
      { name: 'Ahiritola Sarbojanin', area: 'Ahiritola', note: 'On the way to Niranjan Agar.' },
      { name: 'College Square', area: 'College Street', note: 'Paramount is on the square.' },
      { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'Chitpur Road’s kitchens are close.' },
      { name: 'Santosh Mitra Square', area: 'Bowbazar', note: 'Bowbazar’s sweet shops are next door.' },
      { name: 'Maddox Square', area: 'Ballygunge', note: 'The stalls around the lawn.' },
      { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'Gariahat’s stalls.' },
    ],
    plates: [
      { name: 'Kolkata biryani, with the aloo', area: 'Royal Indian Hotel, Arsalan or Aminia', note: 'The potato is non-negotiable.', diet: 'nonveg' },
      { name: 'Fish kabiraji', area: 'Mitra Café, Shobhabazar', note: 'Since 1920.', diet: 'nonveg' },
      { name: 'Egg devil', area: 'Niranjan Agar, Girish Park', note: 'A whole egg in mince and crumbs.', diet: 'nonveg' },
      { name: 'Khichuri bhog', area: 'A Pujo that serves visitors', note: 'The best free lunch in the city. Ask at the pandal.', diet: 'veg' },
    ],
    alsoTry: [
      'Tiretta Bazaar’s Chinese breakfast, at dawn.',
      'Zakaria Street’s evening food walks in Ramadan.',
      'Nolen gur season, in winter.',
    ],
    playlist: { name: 'Pet Pujo', anchors: ['Whatever the stall is playing', 'Coffee House, Manna Dey'] },
  },

  art_kid: {
    routes: [
      {
        id: 'placard-south', title: 'Placard, South', when: 'Saptami, 2:30 pm to 6:30 pm', zone: 'South',
        why: 'The South’s concept Pujos, in the four o’clock light.',
        stops: [
          { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'Folk forms, reinterpreted.' },
          { name: 'Samaj Sebi Sangha', area: 'Lake View Road', note: 'Heritage, made new.' },
          { name: 'Tridhara Sammilani', area: 'Rashbehari', note: 'Light and scale.' },
          { name: 'Santoshpur Lake Pally', area: 'Santoshpur', note: 'Golden hour.' },
          { name: 'A café on Southern Avenue', area: 'Southern Avenue', note: 'Sit down and look at your photos.' },
        ],
      },
      {
        id: 'north-themes', title: 'The North’s Themes', when: 'Panchami, 3 pm to 7 pm', zone: 'North',
        why: 'Four concept Pujos and the neighbourhood where the idols are made.',
        stops: [
          { name: 'Tala Prattoy', area: 'Tala', note: 'Bhabatosh Sutar made its centenary theme in 2025.' },
          { name: 'Kashi Bose Lane', area: 'North Kolkata', note: 'Thoughtful tributes, since 1937.' },
          { name: 'Ahiritola Sarbojanin', area: 'Ahiritola', note: 'Artistry and legacy.' },
          { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Themes, next to the studios.' },
        ],
      },
      {
        id: 'behala-purple-line', title: 'Behala, by the Purple Line', when: 'Panchami, 2 pm to 7 pm', zone: 'Behala',
        why: 'The city’s densest cluster of theme work, one Metro line.',
        stops: [
          { name: 'Behala Notun Dal', area: 'Behala', note: 'Behala’s theme heavyweight.' },
          { name: 'Barisha Club', area: 'Behala', note: 'The other must-see.' },
          { name: 'Behala Club', area: 'Behala', note: 'One more, if the light holds.' },
        ],
      },
    ],
    pandals: [
      { name: 'Tala Prattoy', area: 'Tala', note: 'On the shortlists, year after year.' },
      { name: 'Kashi Bose Lane', area: 'North Kolkata', note: 'Thoughtful themes since 1937.' },
      { name: 'Samaj Sebi Sangha', area: 'Lake View Road', note: 'Heritage, made new.' },
      { name: 'Hindustan Park Sarbojanin', area: 'Gariahat', note: 'Folk forms, reinterpreted.' },
      { name: 'Santoshpur Lake Pally', area: 'Santoshpur', note: 'Revived the Bengal School’s wash technique in 2025.' },
      { name: 'Behala Notun Dal', area: 'Behala', note: 'Behala’s theme heavyweight.' },
      { name: 'Barisha Club', area: 'Behala', note: 'Behala’s other concept Pujo.' },
      { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Themes where the goddess is made.' },
    ],
    plates: [
      { name: 'Lunch at a design-led café', area: 'Hindustan Park', note: 'Between the South’s themes.', diet: 'veg' },
      { name: 'Cha in a bhaar', area: 'Kumartuli', note: 'Watching the artisans work.', diet: 'veg' },
      { name: 'A phuchka', area: 'Any stall', note: 'As cultural research.', diet: 'veg' },
    ],
    alsoTry: [
      'Kumartuli before Mahalaya, while the idols are being made.',
      'Experimenter and Emami Art, after Pujo.',
      'The Chandannagar lights at Jagaddhatri Puja, 16 to 19 November.',
    ],
    playlist: { name: 'Placard', anchors: ['Aswekeepsearching', 'Parekh & Singh', 'Satyajit Ray’s film scores'] },
  },

  addabaaz: {
    routes: [
      {
        id: 'maddox-oclock', title: 'Maddox O’Clock', when: 'Ashtami, 9 pm to 1:30 am', zone: 'South',
        why: 'One place to sit, four to show the visitors, everyone home safe.',
        stops: [
          { name: 'Maddox Square', area: 'Ballygunge', note: 'Base camp, on the grass.' },
          { name: 'Ballygunge Cultural Association', area: 'Ballygunge', note: 'A short walk.' },
          { name: 'Singhi Park', area: 'Gariahat', note: 'Show the visitors.' },
          { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'The big protima.' },
          { name: 'Gariahat’s stalls', area: 'Gariahat', note: 'Food for twelve.' },
          { name: 'Back to Maddox', area: 'Ballygunge', note: 'Headcount at one. Nobody goes home alone.' },
        ],
      },
      {
        id: 'college-street-adda', title: 'The College Street Adda', when: 'Saptami, noon to 5 pm', zone: 'Central',
        why: 'The original adda, and the pandal across the road.',
        stops: [
          { name: 'Indian Coffee House', area: 'College Street', note: 'Push two tables together.' },
          { name: 'College Square', area: 'College Street', note: 'The pandal across the road.' },
          { name: 'Paramount', area: 'College Square', note: 'Sherbets for the whole group.' },
          { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'The big one, together.' },
        ],
      },
      {
        id: 'reunion-north', title: 'The Reunion, North', when: 'Navami, 8 pm to midnight', zone: 'North',
        why: 'Every school friend who flew home, in one fair.',
        stops: [
          { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'Meet at the fair.' },
          { name: 'Kumartuli Park', area: 'Kumartuli', note: 'A walk, all of you.' },
          { name: 'Hatibagan', area: 'Hatibagan', note: 'Stalls, and a table for twelve.' },
        ],
      },
    ],
    pandals: [
      { name: 'Maddox Square', area: 'Ballygunge', note: 'The lawn is the point.' },
      { name: 'Ballygunge Cultural Association', area: 'Ballygunge', note: 'A walk from the lawn.' },
      { name: 'Singhi Park', area: 'Gariahat', note: 'To show the visitors.' },
      { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'The big protima.' },
      { name: 'College Square', area: 'College Street', note: 'Coffee House is across the road.' },
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'A fair big enough for any group.' },
      { name: 'Deshapriya Park', area: 'Kalighat', note: 'Big enough to lose each other in.' },
      { name: 'Sreebhumi Sporting Club', area: 'Lake Town', note: 'The crowd is the point.' },
    ],
    plates: [
      { name: 'Biryani for the table', area: 'Arsalan or Aminia', note: 'Push three tables together.', diet: 'nonveg' },
      { name: 'Cha in a bhaar, twelve of them', area: 'Outside any pandal', note: 'Someone else pays.', diet: 'veg' },
      { name: 'A phuchka round', area: 'Any stall', note: 'For the whole circle.', diet: 'veg' },
    ],
    alsoTry: [
      'A Bijoya Sammilani, a few weeks after Pujo.',
      'Christmas week on Park Street.',
      'Share a ride home after one.',
    ],
    playlist: { name: 'Maddox O’Clock', anchors: ['Coffee House, Manna Dey', 'Bela Bose, Anjan Dutt', 'Fossils', 'Chandrabindoo'] },
  },

  dhunuchi: {
    routes: [
      {
        id: 'arati-circuit', title: 'The Arati Circuit', when: 'Navami, 5:30 pm to 10 pm', zone: 'North',
        why: 'The circle, the light and the send-off.',
        stops: [
          { name: 'Kumartuli’s doorways', area: 'Kumartuli', note: 'Golden-hour photos. Ask first.' },
          { name: 'Sandhya arati at a para Pujo', area: 'North Kolkata', note: 'Around 7 pm. Ask the committee for the time.' },
          { name: 'The dhunuchi competition', area: 'Your para', note: 'The aunties on the front row judge.' },
          { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'The biggest backdrop in the city.' },
        ],
      },
      {
        id: 'five-looks', title: 'Five Looks, One Map', when: 'Saptami to Dashami', zone: 'Across the city',
        why: 'A look for every day, and the place it belongs.',
        stops: [
          { name: 'Saptami: the jamdani', area: 'Kumartuli lanes', note: 'Soft light, old walls.' },
          { name: 'Ashtami: Garad, for anjali', area: 'Your para', note: 'Not a choice. The law.' },
          { name: 'Navami: the bold one', area: 'Maddox Square', note: 'Sneakers allowed.' },
          { name: 'Dashami: red', area: 'The ghat', note: 'For sindoor khela and the bhasan.' },
        ],
      },
      {
        id: 'bhasan-front-row', title: 'Bhasan, Front Row', when: 'Dashami', zone: 'Your para and the ghat',
        why: 'The goddess deserves a proper send-off.',
        stops: [
          { name: 'Sindoor khela', area: 'Your para', note: 'Photos, then more photos.' },
          { name: 'The procession', area: 'Your para', note: 'Dance at the front. Stay with your group.' },
          { name: 'Bagbazar ghat or Babughat', area: 'The river', note: 'The crowd is heavy. Hold hands.' },
        ],
      },
    ],
    pandals: [
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'An arati worth dressing for.' },
      { name: 'Maddox Square', area: 'Ballygunge', note: 'To be seen.' },
      { name: 'Mohammad Ali Park', area: 'Central Avenue', note: 'The biggest backdrop.' },
      { name: 'Santosh Mitra Square', area: 'Bowbazar', note: 'This year’s replica, as a set.' },
      { name: 'Kumartuli Park', area: 'Kumartuli', note: 'Doorways for the shoot.' },
      { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'A heritage backdrop. Ask before you shoot.' },
      { name: 'Deshapriya Park', area: 'Kalighat', note: 'Big, bright, busy.' },
      { name: 'Ekdalia Evergreen', area: 'Gariahat', note: 'Classic, and photogenic.' },
    ],
    plates: [
      { name: 'Phuchka between looks', area: 'Any stall', note: 'Quick. Mind the saree.', diet: 'veg' },
      { name: 'Ice cream', area: 'The pandal stalls', note: 'After the arati.', diet: 'veg' },
      { name: 'Bijoya sweets', area: 'After the bhasan', note: 'Earned.', diet: 'veg' },
    ],
    alsoTry: [
      'A saree-draping session before Pujo.',
      'Saraswati Pujo’s yellow sarees, in February.',
      'The weavers of Shantipur and Phulia, on a day trip.',
    ],
    playlist: { name: 'Dhunuchi', anchors: ['Dola Re Dola', 'Ami Je Tomar', 'Ami Shotti Bolchi, Usha Uthup', 'Dhaak remixes'] },
  },

  shiuli: {
    routes: [
      {
        id: 'bhor-north', title: 'Bhor, North', when: 'Ashtami, 5:30 am to 9 am', zone: 'North',
        why: 'The oldest Pujo in the city, before anyone else is up.',
        stops: [
          { name: 'Kumartuli', area: 'Kumartuli', note: 'Sunrise, around 5:35.' },
          { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'The sabeki protima, before anyone.' },
          { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'Pujo here since 1757. Check visiting hours.' },
          { name: 'Daw Bari', area: 'Jorasanko', note: 'A family Pujo since 1840.' },
          { name: 'Chhatu Babu Latu Babu Bari', area: 'Beadon Street', note: 'A classic thakur dalan.' },
          { name: 'Kochuri and cha', area: 'A North Kolkata sweet shop', note: 'As the shutters go up.' },
        ],
      },
      {
        id: 'river-at-dawn', title: 'The River at Dawn', when: 'Navami, 5:15 am to 8 am', zone: 'The river',
        why: 'The city, before it belongs to anyone.',
        stops: [
          { name: 'Bagbazar ghat', area: 'Bagbazar', note: 'First light.' },
          { name: 'Babughat', area: 'Strand Road', note: 'Early walkers, early prayers.' },
          { name: 'Tiretta Bazaar', area: 'Poddar Court', note: 'Chinese breakfast, before it sells out.' },
        ],
      },
      {
        id: 'mahalaya-morning', title: 'Mahalaya Morning', when: 'Mahalaya, 4 am to 8 am', zone: 'Home and the ghats',
        why: 'The morning the countdown starts.',
        stops: [
          { name: 'The radio, at 4', area: 'Home', note: 'Mahishasuramardini. Eyes closed.' },
          { name: 'The ghats', area: 'The river', note: 'Tarpan at dawn. Watch respectfully.' },
          { name: 'Kumartuli', area: 'Kumartuli', note: 'The eyes are painted on today.' },
        ],
      },
    ],
    pandals: [
      { name: 'Bagbazar Sarbojanin', area: 'Bagbazar', note: 'Sabeki, at dawn.' },
      { name: 'Shobhabazar Rajbari', area: 'Shobhabazar', note: 'Pujo since 1757.' },
      { name: 'Daw Bari', area: 'Jorasanko', note: 'A family Pujo since 1840.' },
      { name: 'Chhatu Babu Latu Babu Bari', area: 'Beadon Street', note: 'A classic thakur dalan.' },
      { name: 'Kumartuli Sarbojanin', area: 'Kumartuli', note: 'Early, before the crowd.' },
      { name: 'Kashi Bose Lane', area: 'North Kolkata', note: 'A community Pujo since 1937.' },
      { name: 'Samaj Sebi Sangha', area: 'Lake View Road', note: 'Heritage, in the South.' },
      { name: 'Ballygunge Cultural Association', area: 'Ballygunge', note: 'Traditional, and calm in the morning.' },
    ],
    plates: [
      { name: 'Kochuri and jalebi', area: 'A North Kolkata sweet shop', note: 'At opening.', diet: 'veg' },
      { name: 'Chinese breakfast', area: 'Tiretta Bazaar', note: 'At first light.', diet: 'nonveg' },
      { name: 'Sandesh', area: 'The old sweet houses of North Kolkata', note: 'For the way home.', diet: 'veg' },
    ],
    alsoTry: [
      'This year’s Pujabarshiki.',
      'The Dover Lane Music Conference, in January.',
      'The Book Fair, in winter.',
    ],
    playlist: { name: 'Bhor', anchors: ['Bajlo Tomar Alor Benu', 'Agamani songs', 'Aji Sharata Tapane', 'A morning raga'] },
  },
}
