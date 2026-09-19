/*
 * Clerk, dressed in the brand. Applied once on <ClerkProvider>, so SignIn,
 * SignUp and UserProfile all inherit it.
 *
 * Clerk's styles are CSS-in-JS, so they cannot read our custom properties —
 * the values are the tokens from styles/brand-tokens.css, written out.
 * Danger is Taxi Yellow, not Crimson: error text is small, and Crimson Silk
 * does not carry text below 24px on dark (design.md §3.6).
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#d72638',
    colorPrimaryForeground: '#f2f1ed',
    colorDanger: '#f2b33d',
    colorWarning: '#f2b33d',
    colorSuccess: '#f2f1ed',
    colorNeutral: '#f2f1ed',
    colorForeground: '#f2f1ed',
    colorMuted: '#1c2225',
    colorMutedForeground: '#afa2a0',
    colorBackground: '#141819',
    colorInput: '#1c2225',
    colorInputForeground: '#f2f1ed',
    colorBorder: 'rgba(242, 241, 237, 0.14)',
    colorRing: '#d72638',
    colorShadow: 'rgba(5, 6, 7, 0.9)',
    colorModalBackdrop: 'rgba(10, 13, 14, 0.72)',
    fontFamily: "'Clear Sans Text', 'Noto Sans Bengali', system-ui, sans-serif",
    fontFamilyButtons: "'Clear Sans Text', 'Noto Sans Bengali', system-ui, sans-serif",
    fontSize: '15px',
    /* Clear Sans ships Regular only — every step of the scale is 400 */
    fontWeight: { normal: 400, medium: 400, semibold: 400, bold: 400 },
    borderRadius: '8px',
  },
  elements: {
    headerTitle: {
      fontFamily: "'Clear Sans Display', 'Noto Sans Bengali', system-ui, sans-serif",
      fontSize: '26px',
      letterSpacing: '-0.01em',
      color: '#fcfbf8',
    },
    card: {
      boxShadow: '0 28px 64px -24px rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(242, 241, 237, 0.08)',
    },
    cardBox: { borderRadius: '20px', width: '100%', maxWidth: '100%' },
    rootBox: { width: '100%', maxWidth: '100%' },
    /* the pages carry their own sign in / create account switch */
    footerAction: { display: 'none' },
  },
  options: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
}

/* Clerk's defaults end in exclamation marks. Observant, not promotional. §12 */
export const clerkLocalization = {
  signIn: {
    start: {
      title: 'Sign in to My Kolkata',
      subtitle: 'Good to have you back.',
      titleCombined: 'Sign in to My Kolkata',
      subtitleCombined: 'Good to have you back.',
    },
  },
  signUp: {
    start: {
      title: 'Create your account',
      subtitle: 'Your places and paras, kept in one spot.',
      titleCombined: 'Create your account',
      subtitleCombined: 'Your places and paras, kept in one spot.',
    },
  },
}

/*
 * Clerk v7 still runs 'virtual' routing — the flow advances without touching the
 * URL — but no longer lists it in the component prop types. These screens have
 * always used it, so the cast keeps their behaviour unchanged. The supported
 * replacement is routing: 'hash' (or 'path' with a catch-all route).
 */
export const virtualRouting = { routing: 'virtual' } as unknown as { routing: 'hash' }
