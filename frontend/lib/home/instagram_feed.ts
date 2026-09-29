/* ==========================================================================
   Kolkata on Instagram, picked by hand. /home shows the first three as
   Instagram's own embeds (lib/stories/media.ts), cropped to their pictures:
   nothing here is fetched, copied or scraped, and nothing is added
   automatically.

   To add a post or reel, paste its link at the top of the list. Give it a
   line saying what it is if you like; it shows under the picture, and
   without one the card just says "Reel on Instagram":

     'https://www.instagram.com/reel/AbC123xYz/',
     { url: 'https://www.instagram.com/p/AbC123xYz/', title: 'Rain on the tram lines at Esplanade' },

   A link to a profile, a story or a highlight isn't a post; the page skips
   it and tests/home.test.mjs fails on it.
   ========================================================================== */

export type CuratedGram = string | { url: string; title: string }

export const INSTAGRAM_FEED: CuratedGram[] = [
    { url: "https://www.instagram.com/p/DbOMx8kzWcB", title: "That’s how কলকাতা sounds to me 🤌❤️ . . . Follow @ig.sandyy19 for more such contents ❤️ . . . #kolkata #fyp #explore #relatable #instagram  . . . [ Kolkata , Howrah Bridge , Victoria Memorial , Calcutta , Bengali song , Dev Song , Nostalgic, Aesthetic , Sunset , Rain , North Kolkata , Couple , Love , Explore , Fyp ]" },
    { url: "https://www.instagram.com/p/DcNnQ82B7hb/?hl=en", title: "The feeling of Maa coming home..❤️‍🩹🙏🏻" },
    { url: "https://www.instagram.com/p/DZ-gZ33PHMy", title: "Kolkata at night hits different 🔥😍 . Follow @your_shortswala for more ❤️‍🔥 . #kolkata #cityofjoy #kolkatanightlife #kolkatadiaries #viralreels   [ Late night drive, Kolkata, Kolkata at night, bike ride ar Kolkata, Ride on the bike, Kolkata night drone footage, Viral, Viral Reels ]   What do you prefer??" },
    { url: "https://www.instagram.com/p/DbXVDIRTrdp", title: "May every birth find me where the dhaak echoes, the dhunuchi sways, and Maa Durga arrives home. Because some cultures are celebrated, but Durga Puja is  #DurgaPuja #Bengali #Dhaak #Dhunuchi #PujoEmotion MaaDurga BengaliSoul Sharodiya TraditionAndEmotion PujoFeels KolkataVibes BengaliHeritage" },

]
