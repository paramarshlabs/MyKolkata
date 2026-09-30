/* ==========================================================================
   Fixes to the scraped Pujo data, kept in code because the kolkata_puja_*
   tables belong to the scraper: a re-scrape would undo an edit made there.
   Each entry was checked against the rows on 30 Sep 2026; tests keep every
   slug named here pointing at a real rule, and scripts can re-check them
   against the live table.
   ========================================================================== */

/*
 * One pujo, several rows. The key is the row that stays (visible, and the best
 * name or position); the rest merge into it and their slugs redirect to it.
 * A merge carries the Red Road carnival rank and awards across, which matters
 * twice: Chetla Agrani's #1 and Bagbazar's #4 sit on hidden rows.
 */
export const DUPLICATES: Record<string, readonly string[]> = {
  /* named in docs/PUJO_PLAN.md */
  'bagbazar-sarbojanin-durga-puja-mandap': ['bagbazar-sarbojanin-durgotsav-exhibition', 'bagbazar-pally-puja-o-prodorshoni'],
  'ahiritola-jubakbrinda-sarbojanin-sarodotsab': ['ahiritola-jubak-brinda-sarbojanin-sarodotsab'],
  'deshapriyanagar-sadharon-durgotsab': ['deshapriyanagar-sadharan-durgotsab-sinthi-more'],
  sammilani: ['tridhara'],
  'chetla-agroni-club': ['chetla-agrani-durga-puja-pandal'],
  /* the same pujo spelled twice, on the same pin or within a few metres */
  'kumartuli-park-sarbojanin-durgotsab': ['kumartuly-park-sarbojanin'],
  'kumortuli-sarbojonin-durgotsab': ['kumatully-sarvojanin-durgotsav'],
  'sreebhumi-sporting-club': ['shreebhumi-sporting-club-durga-puja'],
  'mohammad-ali-park': ['mohammed-ali-park-muhammad-ali-park'],
  'janbazar-rajbari': ['rani-rashmoni-bhawan', 'rani-rashmoni-kachari-bari', 'rani-rashmoni-palace', 'rani-rashmoni-thakur-bari'],
  'chaltabagan-sarbojanin-durgotsab-committee': ['manicktala-chaltabagan-loha-patty'],
  'hindusthan-park-sarbojanin-durgotsab-committee': ['hindusthan-park-durgotsab-committeepurbachal'],
  '66-pally-durgapuja-pandal': ['66palli'],
  '68-pally-durga-puja': ['68-palli-durga-puja-pandal'],
  'bhowanipore-75-palli': ['bhowanipur-75-palli'],
  'bhowanipore-sarbojanin-durgotsab': ['bhowanipur-sarbojanin-durgotsav'],
  'bhowanipore-swadhin-sangha': ['bhowanipur-swadhin-sangha-durga-puja'],
  'ghose-bari-46-pathuriaghata-st': ['ghose-bari-pathuriaghata-46-pathuriaghata-st'],
  'pathuriaghata-rajbari-khelat-ghose-residence': [
    'pathuriaghata-rajbari-khelat-ghoses-residence', 'pathuriaghata-rajbari-khelat-ghoshs-residence', 'khelat-bhavan-pathuriaghata-rajbari',
  ],
  'pathuriaghata-pancher-pally-sarbojonin-durgotsab-committee': ['pathuriaghata-pancher-palli-sarbojanin-durgatsab'],
  'gouriberia-sarbojanin-durgotsab-o-pradarshani': ['gouriberia-sarbojanin-durgotsab-o-pradorshani', 'gauri-bari-sarbojanin-durga-puja-pandal'],
  'golf-green-phase-ii-durga-puja-pandal': ['golf-green-sarodotsava-committee-phase-ii'],
  'jorabagan-chhatra-sanghaati': ['jorabagan-chhatra-sanghati'],
  'jorasanko-7-er-palli-sarbojanin-durgapuja': ['jorasankao-7-er-palli-sarbojanin-durgapuja'],
  'jorasanko-shib-krishna-daw-bari': ['jorasanko-shib-krishna-daws-bari'],
  'nimtala-sarbojanin-durga-puja': ['nimtola-sarbojanin-durgotsab'],
  'hatkhola-gosaipara-sarbojonin-durgotsab': ['hatkhola-gossain-para-sarbojanin'],
  'haritaki-bagan-sarbojonin-durgotsab': ['hartaki-bagan-sarbojanin-durgotsab'],
  'simla-sporting-club': ['shimla-sporting-club-durga-puja'],
  'shobhabazar-burtolla-sarbojanin-durgotsav-samity': ['sobhabazar-burtolla-sarbojanin-durgotsab'],
  'sovabazar-rajbari-boro-rajbari': ['shobhabazar-rajbari-thakur-dalan'],
  'sree-sangha-puja-committee': ['sri-sangha-durga-puja-area'],
  'state-bank-park-sarbojanin-durgotsab': ['sb-park-sarbojanin'],
  'sonar-durga-bari-behala': ['sonar-durga-bari-mukherjee-bari-behala'],
  'kidderpore-25-palli-durga-puja': ['25-pally-club', 'khidirpur-25-palli-durga-puja'],
  'santoshpur-trikon-park-durgotsab': ['sontoshpur-tricon-park'],
  'santoshpur-avenue-south-durga-puja-pandal': ['sontoshpur-avenue-south-club'],
  'santoshpur-sagnik-durgotsav': ['santoshpur-sagnik'],
  'barisha-players-corner': ['behala-players-corner-durga-puja'],
  'behala-29-palli': ['29-pally-durga-puja-pandal'],
  'baghajatin-b-cblock-durgotsav-committee': ['baghajatin-b-c-durga-puja-art'],
  'baishnabghata-yatra-shuru-sangha': ['jatra-suru-sangha'],
  'brindaban-matrimandir': ['brindabon-matri-mandir'],
  'majumder-para-durga-puja-pandal-andul': ['durga-puja-pandal-andul-howrah'],
  'makhla-durga-puja-pandal-uttarpara': ['durga-puja-pandal-uttarpara-makhla'],
  'kankurgachi-mitali-sangha-durga-puja-pandal': ['mitali-kankurghachi', 'mitali-sangha-durga-puja-pandal-kankurgachi'],
  'kankurgachi-chalantika-durgotsav-ground': ['kakurgachi-chalantika-club'],
  'ultadanga-pallyshree': ['pallysree-durga-puja-ground'],
  'ultadanga-jagaranisangha': ['jagorani-sangha-durga-puja-pandal'],
  'haridevpur-41-pally-club': ['41-pally-durga-puja-haridevpur'],
  'purbachal-shakti-sangha': ['shakti-sangha-clubs-durga-puja-ground'],
  'ajoynagar-sarbojanin-durgotsab-society': ['sarbojanin-durgoutsav-committee'],
  'beliaghata-33-pally': ['beliaghata-33-no-palli-bashi-brinda'],
  'darjipara-mitra-house': ['darjipara-mitra-bari'],
}

/* rows that are not a Durga Puja at all */
export const EXCLUDED = new Set([
  'kali-puja-pandal-green-park-dum-dum',
  'sealdah-bazar-jagaddhatri-puja',
  'kolkata-durga-puja-parikrama-boat-tour',
])

/*
 * Pins that are wrong, and the right place where it is known. United Club is
 * on Ultadanga Main Road; the scraper plotted it near Masterda Surya Sen, and
 * three Ola results agree on 103 Ultadanga Main Road.
 */
export const PIN_FIXES: Record<string, { lat: number; lng: number; pincode?: string }> = {
  'united-club': { lat: 22.5911, lng: 88.3909, pincode: '700054' },
}

/*
 * Pins that are wrong where the right place isn't known: five Sammilanis from
 * four corners of the city all sit on one point near Garia, Dum Dum Tarun Dal
 * (Baguiati) sits 14 km south, and Sree Durga Club (Tangra) sits in Gariahat.
 * They keep their page and their area (from the pincode), and can't go into a
 * route until someone reports the right place.
 */
export const UNPINNED = new Set([
  'chotushkone-park-saradia-sammilani',
  'goabagan-sarodatsav-sammilani',
  'saraswat-sammilani',
  'sarbodaya-sammilani',
  'dum-dum-tarun-dal',
  'sree-durga-club',
])

/* names people know better than the registered ones */
export const NAME_OVERRIDES: Record<string, { name?: string; fullName?: string }> = {
  'chetla-agroni-club': { name: 'Chetla Agrani Club' },
  'bagbazar-sarbojanin-durga-puja-mandap': { fullName: 'Bagbazar Sarbojanin Durgotsav & Exhibition' },
  'ghose-bari-46-pathuriaghata-st': { name: 'Pathuriaghata Ghose Bari' },
  'durga-puja-pandal-howrah-1-hat-ln': { name: 'Hat Lane, Shibpur' },
}

/*
 * Famous is is_featured or a carnival rank. This promotes (true) or demotes
 * (false) a pujo by hand; PujoPandalDetail.famous does the same from the
 * database once that table exists. Still open (docs/PUJO_PLAN.md): Maddox
 * Square, Mohammad Ali Park, Santosh Mitra Square, Singhi Park and Salt Lake
 * FD Block aren't marked featured in the data.
 */
export const FAMOUS_OVERRIDES: Record<string, boolean> = {}

/* every slug the rules above name, for the tests and the drift check */
export function curatedSlugs(): string[] {
  return [
    ...Object.keys(DUPLICATES),
    ...Object.values(DUPLICATES).flat(),
    ...EXCLUDED,
    ...Object.keys(PIN_FIXES),
    ...UNPINNED,
    ...Object.keys(NAME_OVERRIDES),
    ...Object.keys(FAMOUS_OVERRIDES),
  ]
}
