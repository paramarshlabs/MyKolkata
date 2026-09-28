/* The story wall's limits, shared by the API (lib/stories/stories.ts) and the
   form (ContributeClient). Plain constants, so the browser bundle imports
   nothing from the server side. */

export const TITLE_MAX = 120
export const STORY_MAX = 2000
export const URL_MAX = 2048

/* A form field no person sees or fills in; bots that fill every field give
   themselves away. */
export const HONEYPOT_FIELD = 'website'
