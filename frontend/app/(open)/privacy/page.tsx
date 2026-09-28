import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import Link from 'next/link'
import { SectionHead } from '@/components/brand/SectionHead'
import { CONTACT_EMAIL, LEGAL_UPDATED, OPERATOR, SITE_URL } from '@/lib/site/site'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'What My Kolkata collects, why, who it is shared with, how long it is kept, and how to see, change or delete it.',
  path: '/privacy',
})

const updated = new Date(LEGAL_UPDATED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

/* Written to match what the code does. When a feature starts collecting
   something new, this page changes with it, and LEGAL_UPDATED moves. */
export default function PrivacyPage() {
  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="Privacy Policy"
          lede={<>Last updated {updated}. In short: we collect as little as we can, we never sell it, and you can ask us to delete it.</>}
        />

        <div className="mk-legal">
          <section aria-labelledby="who">
            <h2 id="who" className="mk-h3">Who we are</h2>
            <p>
              My Kolkata ({SITE_URL.replace(/^https?:\/\//, '')}) is run by {OPERATOR} (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
              We decide how your personal data is used, which makes us the data fiduciary under India&apos;s Digital
              Personal Data Protection Act, 2023, and the controller under laws like the EU and UK GDPR. For anything
              on this page, write to {mail}.
            </p>
          </section>

          <section aria-labelledby="collect">
            <h2 id="collect" className="mk-h3">What we collect, and why</h2>

            <h3>Your account</h3>
            <p>
              You sign in with Google. Google tells us your name, email address, profile photo and a Google account
              ID. We use them to create your account, keep you signed in, and show your name and photo back to you.
              Our sign-in provider, Supabase, keeps security logs of sign-ins, which include your IP address.
            </p>

            <h3>Stories you post</h3>
            <p>
              A story on the Contribute page is its title, its text, an optional link, and the time you posted and
              last edited it. It is stored with your account ID so that only you can edit or delete it. Other people
              see the story, but never your name or email. A story leaves the wall 24 hours after you first post it,
              and we delete it from our database within a day after that. You can delete it yourself before then.
            </p>

            <h3>Experiences feedback</h3>
            <p>
              When you swipe on an Experience, we store the direction, your star rating and any note you write, against
              that Experience. This feedback is not stored with your account, so we can&apos;t trace it back to you.
              Please don&apos;t put personal details in the note.
            </p>

            <h3>The Pujo Personality</h3>
            <p>
              Your quiz answers and result are worked out and kept in your browser, not on our servers. If you
              choose to save your Pujo to your account, we store your answers with your account. A share link carries
              your result (never your name) inside the link itself, so anyone you send it to can open it. If you tell
              the quiz you are under 18, your result is kept only until you close the tab, and the quiz sends no
              analytics events.
            </p>

            <h3>Your location</h3>
            <p>
              Near You and Explore can use your device&apos;s location, only if you allow it in your browser. We use it
              to find places near you, which means sending it to our server and to our maps provider for that search.
              We don&apos;t store it.
            </p>

            <h3>Usage analytics, only with your consent</h3>
            <p>
              If you allow analytics cookies, we use Google Analytics and Vercel Web Analytics to count page views and
              see which features people use. The Pujo Personality also sends events such as &ldquo;quiz started&rdquo; and
              &ldquo;result revealed&rdquo;. These events contain no names, no free text and no location, and share links are
              recorded by route, never by card. If you don&apos;t allow analytics, none of this loads.
            </p>

            <h3>Server logs</h3>
            <p>
              Like every website, our hosting provider records technical details of each request, such as your IP
              address, browser and the page asked for. We use these only to keep the service running and secure.
            </p>
          </section>

          <section id="cookies" aria-labelledby="cookies-title">
            <h2 id="cookies-title" className="mk-h3">Cookies and storage on your device</h2>
            <div className="mk-legal-scroll">
              <table className="mk-legal-table">
                <thead>
                  <tr><th scope="col">What</th><th scope="col">Kind</th><th scope="col">Why</th></tr>
                </thead>
                <tbody>
                  <tr><td>Supabase sign-in cookies (sb-…)</td><td>Strictly necessary</td><td>Keep you signed in. The site can&apos;t work without them, so they don&apos;t need consent.</td></tr>
                  <tr><td>mk.consent.v1 (browser storage)</td><td>Strictly necessary</td><td>Remembers your cookie choice.</td></tr>
                  <tr><td>mk.pujo.* (browser storage)</td><td>Functional</td><td>Keeps your Pujo quiz and result on your device. Never sent to us unless you save it to your account.</td></tr>
                  <tr><td>Google Analytics cookies (_ga, _ga_…)</td><td>Analytics, with consent</td><td>Count visits and repeat visits. Set only if you allow analytics.</td></tr>
                  <tr><td>Vercel Web Analytics</td><td>Analytics, with consent</td><td>Counts page views without cookies. Loaded only if you allow analytics.</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Some pages can show content from other services: a story can embed a post from Instagram or X or an image
              from Google Drive, and the Pujo page can play Mahalaya from YouTube (in its privacy-enhanced mode) when you
              press play. Those services may set their own cookies under their own policies when their content loads.
            </p>
            <p>
              You can change your choice any time with Cookie settings at the bottom of every page. Turning analytics
              off deletes the Google Analytics cookies on this site and reloads the page.
            </p>
          </section>

          <section aria-labelledby="share">
            <h2 id="share" className="mk-h3">Who we share it with</h2>
            <p>We don&apos;t sell your personal data, and we don&apos;t use it for advertising. We use these providers to run the service, and they process data for us under their own terms:</p>
            <ul>
              <li>Supabase: sign-in and our database, hosted in Singapore.</li>
              <li>Vercel: hosting, and Web Analytics if you allow it.</li>
              <li>Google: sign-in, and Google Analytics if you allow it.</li>
              <li>Ola Maps: maps and place search, including your location when you search near you.</li>
            </ul>
            <p>
              Some of these providers process data outside India. We may also share data if the law requires it, or to
              protect the service and its users from fraud or abuse.
            </p>
          </section>

          <section aria-labelledby="keep">
            <h2 id="keep" className="mk-h3">How long we keep it</h2>
            <ul>
              <li>Your account: until you ask us to delete it.</li>
              <li>Stories: 24 hours on the wall, then deleted within a day.</li>
              <li>A Pujo saved to your account: until you delete it from your result page, or delete your account.</li>
              <li>Analytics: under the retention settings of Google Analytics and Vercel, and never longer than 14 months.</li>
            </ul>
          </section>

          <section aria-labelledby="rights">
            <h2 id="rights" className="mk-h3">Your rights</h2>
            <p>
              You can ask us for a summary of the personal data we hold about you, and ask us to correct, update or
              delete it. You can withdraw consent, such as for analytics, at any time, and it is as easy as giving it.
              You can nominate someone to act for you if you die or can&apos;t act yourself. If you are in the EU or UK
              you can also object to or restrict processing, ask for a portable copy, and complain to your data
              protection authority.
            </p>
            <p>
              To do any of this, including deleting your account, email {mail} from the address you sign in with.
              We&apos;ll reply within 30 days. If you&apos;re not happy with our answer, you can complain to the Data
              Protection Board of India.
            </p>
          </section>

          <section aria-labelledby="children">
            <h2 id="children" className="mk-h3">Children</h2>
            <p>
              Accounts are for people 18 and over. We don&apos;t knowingly create accounts for anyone younger; if you
              think a child has signed up, tell us and we&apos;ll delete the account. The Pujo Personality can be used
              without an account, and treats anyone who says they are under 18 as described above.
            </p>
          </section>

          <section aria-labelledby="security">
            <h2 id="security" className="mk-h3">Security</h2>
            <p>
              Data travels over HTTPS, our database is only reachable by our servers, and only a story&apos;s author can
              change it. No system is perfectly secure; if a breach affects your data, we&apos;ll tell you and the
              authorities as the law requires.
            </p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="mk-h3">Changes to this policy</h2>
            <p>
              When we change this policy we&apos;ll update the date at the top, and tell you on the site if the change
              is significant. See also our <Link href="/terms">Terms of Use</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
