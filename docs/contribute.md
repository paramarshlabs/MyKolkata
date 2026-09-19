Build the /contribute feature as an ephemeral public story wall with external-media support.

CORE BEHAVIOR
- Signed-in users can submit:
  - title
  - story
  - optional link
- Persist only text + external URL + minimal metadata in Supabase/Postgres.
- Stories are public and visible to everyone on /contribute.
- Stories expire 24 hours after creation.
- Never upload or store user media on our servers.

EXTERNAL LINKS
The optional link may point to:
- X/Twitter
- Instagram
- Google Drive
- direct image URLs
- other supported public media URLs

Handle the URL intelligently.

IMPORTANT:
- Never download external images/media and save them locally.
- Never proxy/cache external media through our server.
- Store only the original external URL.
- Render/embed media directly from the original provider when their platform allows it.
- If embedding is not supported or the URL is inaccessible, gracefully fall back to a normal clickable "View link" link.
- Never expose arbitrary external HTML/JS inside our page.

MEDIA HANDLING
Create a small URL/media resolver that detects the provider/type:

1. Direct image URL
   - Render using an `<img>` with the external URL.
   - Use lazy loading.
   - Handle failed loads gracefully.

2. Google Drive
   - Detect public Drive file URLs.
   - Extract the file ID where possible.
   - Display the public image/file using Google's supported public/embed URL.
   - If the file isn't publicly accessible, show "View link" instead.
   - Do not download the file.

3. Instagram
   - Detect Instagram post/reel URLs.
   - Use the supported Instagram embed mechanism where possible.
   - Do not scrape Instagram or download the media.
   - If embedding fails/requires authentication, show the original link.

4. X/Twitter
   - Detect post URLs.
   - Use the official X embed mechanism where appropriate.
   - Do not scrape/download media.
   - If the embed cannot load, show the original post link.

5. Unsupported URLs
   - Treat as a normal external link.
   - Never attempt arbitrary scraping.

SECURITY
- Validate URLs server-side.
- Only allow http/https URLs.
- Never render user-provided HTML.
- Never use `dangerouslySetInnerHTML` for submitted content.
- Never allow arbitrary iframe URLs directly from user input.
- Provider-specific embeds must use hardcoded trusted provider domains/components.
- Add sensible title/story/link length limits.

DATABASE
Store only:
- title
- story
- externalUrl (nullable)
- createdAt
- expiresAt
- author/user id if already available from Supabase Auth

No image blobs.
No uploaded files.
No locally hosted copies.
No media caching.

EXPIRATION
- expiresAt = createdAt + 24 hours.
- Server/API query must only return `expiresAt > now`.
- Newest first.
- Expired stories should not appear even if the frontend cache contains them.

UI
Keep the existing /contribute design.
Below the submission form show the active public stories.

For a story with supported external media:
- show the story text
- show the external media/embed when safely supported
- show title and timestamp
- provide "Open original" link

For unsupported/failed media:
- show the story normally
- show a simple external link

After successful submission:
- immediately add the story to the feed
- reset the form
- no full page reload

AUTH
- Only authenticated Supabase users can submit.
- Anyone can view active stories.

Do not turn this into a social network.
No likes, comments, follows, profiles, uploads, or reactions.

Inspect the existing Supabase/database/auth implementation first and follow existing project conventions.

Run:
- typecheck
- lint
- build

Verify:
- submission from Browser A appears in Browser B
- external image is displayed without being stored locally
- public Drive image works when publicly accessible
- Instagram/X gracefully fall back when embedding isn't supported
- expired stories are excluded server-side
- unauthenticated users cannot submit

IMPORTANT: Implement only what is specified above. Do not introduce unnecessary abstractions, dependencies, background workers, storage buckets, image processing, scraping, or additional social features.