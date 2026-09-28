import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import Link from 'next/link'
import { SectionHead } from '@/components/brand/SectionHead'
import { CONTACT_EMAIL, LEGAL_UPDATED, OPERATOR } from '@/lib/site/site'

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Use',
  description: 'The rules for using My Kolkata: your account, what you post, what we promise and what we don’t.',
  path: '/terms',
})

const updated = new Date(LEGAL_UPDATED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

export default function TermsPage() {
  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="Terms of Use"
          lede={<>Last updated {updated}. By using My Kolkata you agree to these terms. If you don&apos;t agree, please don&apos;t use it.</>}
        />

        <div className="mk-legal">
          <section aria-labelledby="about">
            <h2 id="about" className="mk-h3">About these terms</h2>
            <p>
              My Kolkata is a guide to the city, run by {OPERATOR} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). These terms
              cover the website and everything on it. Our <Link href="/privacy">Privacy Policy</Link> explains how we
              handle your data and is part of these terms.
            </p>
          </section>

          <section aria-labelledby="account">
            <h2 id="account" className="mk-h3">Your account</h2>
            <ul>
              <li>You need to be 18 or over to create an account. The Pujo Personality can be used without one.</li>
              <li>You sign in with Google, and you&apos;re responsible for what happens under your account. Tell us if you think someone else is using it.</li>
              <li>You can stop using My Kolkata at any time, and ask us to delete your account by writing to {mail}.</li>
            </ul>
          </section>

          <section aria-labelledby="posting">
            <h2 id="posting" className="mk-h3">What you post</h2>
            <p>
              Stories, feedback and anything else you send us stay yours. By posting, you give us a worldwide,
              non-exclusive, royalty-free licence to host, show and share it on My Kolkata for as long as it is up.
              Stories are public, and are removed 24 hours after you first post them. Editing a story does not
              restart that clock.
            </p>
            <p>You agree not to post anything that:</p>
            <ul>
              <li>is illegal, or encourages anything illegal;</li>
              <li>harasses, threatens, or spreads hate against anyone;</li>
              <li>shares someone else&apos;s personal information, or their photos, without their permission;</li>
              <li>you don&apos;t have the right to share, such as someone else&apos;s writing or photographs;</li>
              <li>is sexually explicit, or involves anyone under 18 in any harmful way;</li>
              <li>is spam, advertising, or links to malware or scams;</li>
              <li>pretends to be someone you are not.</li>
            </ul>
            <p>
              We can remove anything that breaks these rules, and suspend or close accounts that break them. To report
              something, write to {mail}.
            </p>
          </section>

          <section aria-labelledby="use">
            <h2 id="use" className="mk-h3">Using the service fairly</h2>
            <p>
              Please don&apos;t try to break, overload or get around the security of My Kolkata, scrape it in bulk,
              or use it to build a competing service. Don&apos;t use automated tools to post or to sign in.
            </p>
          </section>

          <section aria-labelledby="ours">
            <h2 id="ours" className="mk-h3">What&apos;s ours</h2>
            <p>
              The My Kolkata name, design, illustrations, photographs and code belong to us or to the people who licensed
              them to us. You can share links to any page, including your Pujo card. Please don&apos;t copy the site
              or its artwork for anything else without asking us first.
            </p>
          </section>

          <section aria-labelledby="accuracy">
            <h2 id="accuracy" className="mk-h3">Information on the site</h2>
            <p>
              We try to keep places, timings, news, transport and Pujo details accurate, but the city changes faster
              than any guide. Everything is for general information only. Check with the venue, the organiser or the
              transport operator before you set out, especially for anything that matters to your safety, health or
              money. The Pujo Personality is for fun; it isn&apos;t a psychological test.
            </p>
            <p>
              Some pages link to or embed other sites, such as Instagram, X, YouTube, Google Drive and news
              publishers. We don&apos;t control them and aren&apos;t responsible for what they show or do.
            </p>
          </section>

          <section aria-labelledby="liability">
            <h2 id="liability" className="mk-h3">Our responsibility to you</h2>
            <p>
              My Kolkata is free, and provided as it is and as available. We don&apos;t promise that it will always be
              up, error-free or suitable for a particular purpose. To the extent the law allows, we aren&apos;t liable
              for indirect or consequential losses, or for losses caused by content other people post or by other
              sites. Nothing in these terms limits
              any right you have that the law says can&apos;t be limited.
            </p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="mk-h3">Changes</h2>
            <p>
              We may change My Kolkata, or these terms, as it grows. When the terms change we&apos;ll update the date at
              the top, and tell you on the site if the change is significant. If you keep using My Kolkata after that,
              you accept the new terms.
            </p>
          </section>

          <section aria-labelledby="law">
            <h2 id="law" className="mk-h3">Law and disputes</h2>
            <p>
              These terms are governed by the laws of India. If a dispute comes up, write to us first and we&apos;ll try
              to sort it out. If we can&apos;t, the courts at Kolkata, West Bengal, have exclusive jurisdiction.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="mk-h3">Contact</h2>
            <p>Questions, reports or complaints: {mail}.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
