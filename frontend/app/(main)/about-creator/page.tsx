import type { Metadata } from 'next'
import { SectionHead } from '@/components/brand/SectionHead'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'About the creator' }

const REPO = 'https://github.com/paramarshlabs/MyKolkata'

type Contributor = {
  login: string
  html_url: string
  avatar_url: string
  type: string
}

async function getContributors(): Promise<Contributor[]> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/paramarshlabs/MyKolkata/contributors?per_page=100',
      { headers: { Accept: 'application/vnd.github+json' }, next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const people = (await res.json()) as Contributor[]
    return people.filter((person) => person.type === 'User')
  } catch {
    return []
  }
}

export default async function AboutCreator() {
  await requireUser()
  const contributors = await getContributors()

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="About the creator"
          lede="My Kolkata is a community-built guide to the city — its places, its transport, its news and its markets, gathered in one place."
        />

        <div className="mk-measure" style={{ marginTop: 64, display: 'grid', gap: 48 }}>
          <section>
            <h2 className="mk-h3">Why it exists</h2>
            <p className="mk-body" style={{ marginTop: 12 }}>
              To make Kolkata easier to find your way around, and more fun to wander — and to bring the
              city&apos;s useful resources together, so no one has to keep twelve tabs open to plan an
              evening.
            </p>
          </section>
          <section>
            <h2 className="mk-h3">How it&apos;s built</h2>
            <p className="mk-body" style={{ marginTop: 12 }}>
              React, Next.js and Tailwind CSS, with a design system of its own: Clear Sans and Noto
              Sans Bengali, a cool rich black, one crimson mark, and the alpona line.
            </p>
          </section>
          <section>
            <h2 className="mk-h3">Built by who?</h2>
            {contributors.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'grid', gap: 12 }}>
                {contributors.map((person) => (
                  <li key={person.login}>
                    <a
                      href={person.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        color: 'var(--mk-pearl)',
                        textDecoration: 'none',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={person.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        style={{ borderRadius: '50%', background: 'var(--mk-slate)' }}
                      />
                      <span className="mk-body">{person.login}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mk-body" style={{ marginTop: 12 }}>
                See the people on{' '}
                <a href={`${REPO}/graphs/contributors`} target="_blank" rel="noreferrer">
                  GitHub
                </a>
                .
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
