import { existsSync, readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const envPath = ['.env.local', '.env'].find((path) => existsSync(path))
if (envPath) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const eq = trimmed.indexOf('=')
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

const prisma = new PrismaClient()

/* The paper card, plus last-resort CITY / SPORTS fallbacks. The dynamic stories
   come from ingestion (lib/news/ingest.ts); these are inactive so they only
   show when nothing has been ingested. Mirrored in lib/news/home.ts. */
const news = [
  {
    title: 'Anandabazar Patrika today',
    description: 'এগিয়ে থাকে,এগিয়ে রাখে।',
    image: '/ana.jpg',
    link: 'https://epaper.anandabazar.com/',
    type: 'NEWSPAPER',
    category: 'newspaper',
    sourceName: 'Anandabazar Patrika',
    sourceDomain: 'anandabazar.com'
  },
  {
    title: "International Book Fair '25",
    description: 'The biggest literary event of the year! This year was great!',
    image: '/bkf.avif',
    link: 'https://kolkatabookfair.net/download-ikbf-app',
    type: 'CITY',
    category: 'culture',
    eventSlug: 'kolkata-book-fair',
    isActive: false
  },
  {
    title: 'Kolkata Derby: EB vs MB',
    description: "The age-old rivalry continues! Don't miss the epic clash this weekend.",
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    link: 'https://www.google.com/search?q=east+bengal+vs+mohun+bagan',
    type: 'SPORTS',
    category: 'football',
    isActive: false
  }
]

const marketplace = [
  {
    title: "Handloom Sarees - Bengal's pride.",
    location: 'Gariahat Market',
    price: '₹1,500 onwards',
    image: '/sare.jpg',
    link: 'https://www.orangewayfarer.com/best-saree-shops-in-kolkata/'
  },
  {
    title: 'Bengali Sweets - The best of the best.',
    location: 'New Market',
    price: '₹20 onwards',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    link: 'https://balarammullick.com/'
  },
  {
    title: 'Bongmade - Bengali Merch with a modern twist.',
    location: 'Online',
    price: '₹199 onwards',
    image: '/shirt.webp',
    link: 'https://bongmade.com/'
  }
]

const places = [
  { slug: 'flurys-park-street', name: 'Flurys', type: 'Cafe', location: 'Park Street', area: 'Park Street', address: '18A Park Street, Kolkata', latitude: 22.552732, longitude: 88.352590, tags: ['cafe', 'bakery', 'breakfast'], description: 'Iconic cafe known for its European-style cakes and pastries.', image: '/flury.avif', rating: 4.5, status: 'Open now', sourceConfidence: 1 },
  { name: 'Paris Cafe', type: 'Cafe', location: 'Park Street', description: 'Cozy cafe serving French pastries and coffee.', image: '/street.jpg', rating: 4.3, status: 'Open now' },
  { slug: 'mocambo-park-street', name: 'Mocambo', type: 'Food', location: 'Park Street', area: 'Park Street', address: '25B Park Street, Kolkata', latitude: 22.553247, longitude: 88.353177, tags: ['restaurant', 'continental'], description: 'Vintage restaurant with Continental cuisine.', image: '/moc.jpg', rating: 4.6, status: 'Open now', sourceConfidence: 1 },
  { slug: 'victoria-memorial', name: 'Victoria Memorial', type: 'Places', location: 'Central Kolkata', area: 'Maidan', address: 'Victoria Memorial Hall, Kolkata', latitude: 22.544809, longitude: 88.342557, tags: ['monument', 'museum', 'heritage'], description: 'Majestic marble building and museum.', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800', rating: 4.8, status: 'Open now', sourceConfidence: 1 },
  { slug: 'howrah-bridge', name: 'Howrah Bridge', type: 'Places', location: 'Howrah', area: 'Howrah', address: 'Howrah Bridge, Kolkata', latitude: 22.585148, longitude: 88.346806, tags: ['bridge', 'landmark', 'heritage'], description: 'Iconic cantilever bridge over Hooghly River.', image: '/hwh.jpg', rating: 4.7, status: 'Open now', sourceConfidence: 1 },
  { slug: 'indian-museum-kolkata', name: 'Indian Museum', type: 'Culture', location: 'Park Street', area: 'Chowringhee', address: '27 Jawaharlal Nehru Road, Kolkata', latitude: 22.557586, longitude: 88.351027, tags: ['museum', 'culture', 'heritage'], description: 'Oldest and largest museum in India.', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800', rating: 4.5, status: 'Closes at 5 PM', sourceConfidence: 1 },
  { name: 'Darjeeling', type: 'Hill Station', location: 'West Bengal', description: 'Queen of Hills with tea gardens and mountain views.', image: '/dar.webp', rating: 4.8, status: 'Open now' },
  { name: 'Sundarbans', type: 'Forest', location: 'West Bengal', description: "World's largest mangrove forest.", image: '/sundarban.jpg', rating: 4.7, status: 'Open now' },
  { name: 'Digha', type: 'Beach', location: 'West Bengal', description: 'Popular beach destination.', image: '/dig.jpg', rating: 4.4, status: 'Open now' }
]

const exploreCategories = [
  { slug: 'cafes', name: 'Cafés', icon: 'coffee', sortOrder: 0 },
  { slug: 'food', name: 'Food', icon: 'food', sortOrder: 1 },
  { slug: 'places', name: 'Places', icon: 'place', sortOrder: 2 },
  { slug: 'culture', name: 'Culture', icon: 'culture', sortOrder: 3 },
  { slug: 'shopping', name: 'Shopping', icon: 'shopping', sortOrder: 4 },
  { slug: 'experiences', name: 'Experiences', icon: 'experience', sortOrder: 5 },
  { slug: 'outdoors', name: 'Outdoors', icon: 'outdoors', sortOrder: 6 },
]

const placeCategoryByType = {
  Cafe: 'cafes',
  Food: 'food',
  Places: 'places',
  Culture: 'culture',
  Monument: 'places',
  Bridge: 'places',
  Museum: 'culture',
  'Hill Station': 'places',
  Forest: 'outdoors',
  Beach: 'outdoors',
}

const pandals = [
  { name: 'Bagbazar Sarbojanin', location: 'Bagbazar, Kolkata', description: 'One of the oldest and most popular Durga Puja celebrations in Kolkata.', image: 'https://images.unsplash.com/photo-1601181487375-f2194c87a04b?w=800', distance: '2.5 km', rating: 4.8 },
  { name: 'Mohammad Ali Park', location: 'Central Kolkata', description: 'Famous for its unique themes and elaborate decorations.', image: 'https://images.unsplash.com/photo-1601931935934-17c3717239ab?w=800', distance: '3.1 km', rating: 4.6 },
  { name: 'College Square', location: 'College Street', description: 'Known for its stunning water body reflections and lighting arrangements.', image: 'https://images.unsplash.com/photo-1592305029529-4a6a3d0cde1c?w=800', distance: '1.8 km', rating: 4.7 },
  { name: 'Victoria Memorial', location: 'Central Kolkata', description: 'Historic marble building and museum showcasing British-era architecture.', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800', distance: '4.2 km', rating: 4.9 }
]

const regions = [
  { name: 'North Kolkata', description: 'Traditional pujas with heritage touch', image: 'https://assets.telegraphindia.com/telegraph/2021/Nov/1636726963_img_8377-jpg.jpg' },
  { name: 'South Kolkata', description: 'Contemporary art meets tradition', image: '/southkol.png' },
  { name: 'Central Kolkata', description: 'Modern themes with grand displays', image: 'https://www.shutterstock.com/shutterstock/videos/3485372951/thumb/1.jpg?ip=x480' },
  { name: 'New Kolkata', description: 'Skyline pujas across Rajarhat and Salt Lake', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Kolkata-Rajarhat_view_from_high_rise.jpg/1280px-Kolkata-Rajarhat_view_from_high_rise.jpg' },
]

const communities = [
  { name: 'GDG Kolkata', description: 'Google Developer Group Kolkata - Tech community', link: 'https://gdg.community.dev/gdg-kolkata/', icon: 'FaMeetup' },
  { name: 'TFUG Kolkata', description: 'TensorFlow User Group Kolkata', link: 'https://www.tensorflow.org/community/groups', icon: 'FaMeetup' },
  { name: 'Calcutta Instagrammers', description: 'Photography and city stories', link: 'https://www.instagram.com/calcutta.instagrammers/', icon: 'FaInstagram' },
  { name: 'Streets of Calcutta', description: 'Daily life and culture', link: 'https://www.instagram.com/streetsofcalcutta/', icon: 'FaInstagram' }
]

const transport = [
  { category: 'auto', name: 'Gariahat Crossing', distance: '0.3 km', time: '2 mins' },
  { category: 'auto', name: 'Rashbehari Crossing', distance: '0.8 km', time: '5 mins' },
  { category: 'auto', name: 'Golpark', distance: '1.2 km', time: '7 mins' },
  { category: 'bus', name: 'Gariahat Bus Stop', distance: '0.5 km', time: '5 mins', routes: ['S24', 'VS5', '47B'] },
  { category: 'bus', name: 'Ballygunge Phari', distance: '1.2 km', time: '8 mins', routes: ['S24', 'VS5', '47B'] },
  { category: 'bus', name: 'Golpark Bus Stand', distance: '1.5 km', time: '10 mins', routes: ['S24', 'VS5', '47B'] },
  { category: 'taxi', name: 'Gariahat Taxi Stand', distance: '0.4 km', time: '3 mins' },
  { category: 'taxi', name: 'Ballygunge Station', distance: '1.0 km', time: '6 mins' },
  { category: 'taxi', name: 'Southern Avenue', distance: '1.3 km', time: '8 mins' },
  { category: 'metro', name: 'Kalighat Metro', distance: '0.8 km', time: '10 mins walk' },
  { category: 'metro', name: 'Jatin Das Park', distance: '1.2 km', time: '15 mins walk' },
  { category: 'metro', name: 'Maidan', distance: '1.5 km', time: '18 mins walk' },
  { category: 'metro', from: 'Kavi Subhash', to: 'Dakshineswar', time: '10:00 AM' },
  { category: 'metro', from: 'Dakshineswar', to: 'Kavi Subhash', time: '10:15 AM' },
  { category: 'metro', from: 'Kavi Subhash', to: 'Dakshineswar', time: '10:30 AM' },
  { category: 'metro', from: 'Dakshineswar', to: 'Kavi Subhash', time: '10:05 AM' },
  { category: 'metro', from: 'Kavi Subhash', to: 'Dakshineswar', time: '10:20 AM' },
  { category: 'metro', from: 'Dakshineswar', to: 'Kavi Subhash', time: '10:35 AM' },
  { category: 'train', name: 'Bandel Local', platform: '1', time: '10:30 AM' },
  { category: 'train', name: 'Burdwan Express', platform: '3', time: '11:00 AM' },
  { category: 'train', name: 'Katwa Local', platform: '2', time: '11:30 AM' },
  { category: 'train', name: 'Barrackpore Local', platform: '1', time: '10:45 AM' },
  { category: 'train', name: 'Naihati Local', platform: '2', time: '11:15 AM' },
  { category: 'train', name: 'Krishnanagar Express', platform: '4', time: '11:45 AM' },
  { category: 'train', name: 'Kharagpur Local', platform: '1', time: '10:15 AM' },
  { category: 'train', name: 'Midnapore Express', platform: '2', time: '10:45 AM' },
  { category: 'train', name: 'Haldia Local', platform: '3', time: '11:15 AM' },
  { category: 'train', name: 'Puri Express', platform: '1', time: '10:00 AM' },
  { category: 'train', name: 'Digha Local', platform: '2', time: '10:30 AM' },
  { category: 'train', name: 'Kharagpur Fast', platform: '1', time: '11:00 AM' }
]

const tinderProfiles = [
  { name: 'Victoria Memorial', age: '100+', bio: 'Majestic marble building dedicated to Queen Victoria. Looking for history enthusiasts!', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800', baseStars: 4.8, averageStars: 4.8 },
  { name: 'Netaji Subhash Chandra Bose', age: '150+', bio: 'Netaji Subhas Chandra Bose was a prominent Indian freedom fighter and leader who played a key role in India\'s struggle for independence.', image: '/nscb.webp', baseStars: 4.7, averageStars: 4.7 },
  { name: 'Jorasanko Thakur Bari, North Kolkata', age: '80+', bio: 'The ancestral home of Rabindranath Tagore, offering a glimpse into the literary history of Bengal.', image: '/jstb.jpg', baseStars: 4.6, averageStars: 4.6 },
  { name: 'Maidan', age: '250+', bio: 'The largest urban park in Kolkata, often called the Lungs of Kolkata.', image: '/maidan.jpg', baseStars: 4.5, averageStars: 4.5 },
  { name: 'Indian Museum', age: '210+', bio: 'Founded in 1814, the oldest museum in India and one of the oldest in the world.', image: '/indmus.jpg', baseStars: 4.5, averageStars: 4.5 },
  { name: 'Dakshineswar Kali Temple', age: '170+', bio: 'Famous temple dedicated to Goddess Kali on the eastern bank of the Hooghly.', image: '/dkt.jpg', baseStars: 4.8, averageStars: 4.8 }
]

async function seed() {
  await prisma.placeInteraction.deleteMany()
  await prisma.exploreSearch.deleteMany()
  await prisma.experience.deleteMany()
  await prisma.collectionItem.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.placePhoto.deleteMany()
  await prisma.placeSource.deleteMany()
  await prisma.placeCategory.deleteMany()
  await prisma.category.deleteMany()
  await prisma.news.deleteMany()
  await prisma.marketplaceItem.deleteMany()
  await prisma.place.deleteMany()
  await prisma.pandal.deleteMany()
  await prisma.region.deleteMany()
  await prisma.community.deleteMany()
  await prisma.transport.deleteMany()
  await prisma.tinderProfile.deleteMany()

  await prisma.news.createMany({ data: news })
  await prisma.marketplaceItem.createMany({ data: marketplace })
  await prisma.category.createMany({ data: exploreCategories })
  await prisma.place.createMany({ data: places })
  const [categoryRows, placeRows] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.place.findMany({ select: { id: true, type: true } }),
  ])
  const categoryIds = new Map(categoryRows.map((category) => [category.slug, category.id]))
  const placeCategories = placeRows
    .map((place) => {
      const categoryId = categoryIds.get(placeCategoryByType[place.type])
      return categoryId ? { placeId: place.id, categoryId, source: 'seed', confidence: 1 } : null
    })
    .filter(Boolean)
  if (placeCategories.length) await prisma.placeCategory.createMany({ data: placeCategories })
  await prisma.pandal.createMany({ data: pandals })
  await prisma.region.createMany({ data: regions })
  await prisma.community.createMany({ data: communities })
  await prisma.transport.createMany({ data: transport })
  await prisma.tinderProfile.createMany({ data: tinderProfiles })

  console.log('Supabase seed complete')
}

seed()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
