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

            <h3>Find your Ashtami date</h3>
            <p>
              Find your Ashtami date is only for people 18 and over, and only if you choose to join. What it keeps is
              set out <a href="#ashtami-date">in its own section below</a>.
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
              see which features people use, and Vercel Speed Insights to measure how quickly pages load. The Pujo Personality also sends events such as &ldquo;quiz started&rdquo; and
              &ldquo;result revealed&rdquo;. These events contain no names, no free text and no location, and share links are
              recorded by route, never by card. If you don&apos;t allow analytics, none of this loads.
            </p>

            <h3>Server logs</h3>
            <p>
              Like every website, our hosting provider records technical details of each request, such as your IP
              address, browser and the page asked for. We use these only to keep the service running and secure.
            </p>
          </section>

          <section id="ashtami-date" aria-labelledby="ashtami-date-title">
            <h2 id="ashtami-date-title" className="mk-h3">Find your Ashtami date</h2>
            <p>
              A way to find someone to go pandal-hopping with at Pujo. You join by filling in a short card, and you can
              delete it whenever you like. This is everything it keeps.
            </p>
            <ul>
              <li>
                Your date of birth, to check you are 18 or over. We store the date, never show it to anyone, and show
                others only your age. If you are under 18, nothing you type is saved.
              </li>
              <li>
                Your card: your first name, whether you are a woman, a man or non-binary, who you want to see, the night
                you want to go out, a rough area such as North Kolkata (never an address, and never your location), your
                vibes, one prompt answer and, if you choose, your Pujo Personality.
              </li>
              <li>
                One to three photos. Your phone redraws each one before it is sent, and our server strips anything left
                in the file, such as where and on what camera it was taken. Photos are stored privately, never at a
                public address: people see them through signed links that stop working after 30 minutes, and only if
                your card is in their deck or you have matched.
              </li>
              <li>
                Your Instagram or Snapchat username, if you add one. Only people you match with see it, and only once
                one of you has sent a message.
              </li>
              <li>
                Your swipes: who you said &ldquo;for me&rdquo; or &ldquo;not for me&rdquo; to, and your one shiuli a day.
                The person you send a shiuli to sees that you sent it. Nobody sees your other swipes; two people only
                find out about each other when both said &ldquo;for me&rdquo;.
              </li>
              <li>
                Matches and chats. Chat is text only. A match that nobody writes in is deleted after 24 hours, or 48 if
                one of you extends it. Every message is deleted 24 hours after it is sent: it leaves the chat on the
                hour, and our database within a day after that at most.
              </li>
              <li>
                Blocks and reports. A block hides the two of you from each other everywhere in the feature, and ends any
                chat. A report is kept for a person to review, for up to 180 days. If you report someone from a chat, the
                messages they sent you there are copied onto the report, because the chat itself is deleted.
              </li>
            </ul>
            <p>
              None of it is used for advertising, shared with anyone else, or used anywhere else on My Kolkata. We check
              dates of birth; we don&apos;t verify identities, so meet in public, at a busy pandal, and tell a friend
              where you&apos;ll be.
            </p>
            <h3>Deleting it</h3>
            <p>
              Open Find your Ashtami date, tap &ldquo;you&rdquo;, then &ldquo;delete my dating profile&rdquo;. Your card,
              photos, swipes, matches and chats are deleted straight away. Blocks and reports stay, so a person who was
              blocked can&apos;t find anyone again by starting over; write to {mail} if you want yours removed. A week
              after Dashami, everything else from this year&apos;s Find your Ashtami date is deleted automatically.
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
                  <tr><td>Vercel Speed Insights</td><td>Analytics, with consent</td><td>Measures how fast pages load for real visitors, without cookies. Loaded only if you allow analytics.</td></tr>
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
              <li>Supabase: sign-in, our database, and private storage for Find your Ashtami date photos, hosted in Singapore.</li>
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
              <li>
                Find your Ashtami date: chat messages for 24 hours; a match nobody writes in, 24 hours (48 if extended);
                your card, photos, swipes and matches until you delete them, and never beyond a week after Dashami;
                reports for up to 180 days; blocks until you ask us to remove them.
              </li>
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
              without an account, and treats anyone who says they are under 18 as described above. Find your Ashtami
              date turns away anyone under 18 at the first step, and saves nothing they typed.
            </p>
          </section>

          <section aria-labelledby="security">
            <h2 id="security" className="mk-h3">Security</h2>
            <p>
              Data travels over HTTPS, our database is only reachable by our servers, and only a story&apos;s author can
              change it. Find your Ashtami date photos sit in private storage that only our servers can open, and each
              person can only ever read their own matches and chats. No system is perfectly secure; if a breach affects your data, we&apos;ll tell you and the
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
