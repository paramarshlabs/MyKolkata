'use client'

import React, { useState, useEffect, type FormEvent } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { Emblem } from '@/components/brand/emblems'
import { AlponaLoader } from '@/components/brand/Alpona'
import { UiIcon } from '@/components/brand/icons'
import styles from '@/styles/Contribute.module.css'
import { StoryMedia } from './StoryMedia'
import type { PublicStory } from '@/lib/stories/stories'

type Community = {
  _id: string
  name: string
  description?: string | null
  link?: string | null
  icon?: string | null
}

/* the platform, said in words — no logos, and no icon without a job */
const platformNames: Record<string, string> = {
  FaInstagram: 'Instagram',
  FaMeetup: 'Meetup',
  FaGithub: 'GitHub'
}

/* when a story was posted, on the Kolkata clock */
function postedAt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

function Contribute() {
  const [showForm, setShowForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', link: '' })
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stories, setStories] = useState<PublicStory[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [storiesFailed, setStoriesFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  /* ticks each minute so a story leaves the wall the moment it expires */
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    /* aborted on unmount — and on React's dev-only second mount, so one request lands */
    const controller = new AbortController()
    async function fetchCommunities() {
      try {
        setLoading(true)
        const res = await fetch('/api/communities', { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch communities')
        const data = await res.json()
        setCommunities(data)
      } catch (err) {
        if (!controller.signal.aborted) setError((err as Error).message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchCommunities()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let controller = new AbortController()
    async function fetchStories() {
      controller.abort()
      controller = new AbortController()
      try {
        const res = await fetch('/api/stories', { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch stories')
        const data = await res.json()
        setStories(data.stories)
        setStoriesFailed(false)
      } catch {
        if (!controller.signal.aborted) setStoriesFailed(true)
      } finally {
        if (!controller.signal.aborted) setStoriesLoading(false)
      }
    }
    fetchStories()
    /* coming back to the tab picks up what others posted meanwhile */
    const onVisible = () => { if (document.visibilityState === 'visible') fetchStories() }
    document.addEventListener('visibilitychange', onVisible)
    const tick = setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(tick)
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPost.title, story: newPost.content, link: newPost.link }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Your story didn’t post. Try again.')
      setStories((current) => [data.story, ...current.filter((story) => story.id !== data.story.id)])
      setShowForm(false)
      setNewPost({ title: '', content: '', link: '' })
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const activeStories = stories.filter((story) => new Date(story.expiresAt).getTime() > now)

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="Contribute"
          lede="The city is written by the people in it. Join a community, or tell a Kolkata story of your own."
        />

        <section className={styles.section} aria-labelledby="communities-title">
          <h2 id="communities-title" className="mk-h2">Communities</h2>
          {loading ? (
            <AlponaLoader label="Finding the communities" className={styles.gap} />
          ) : error ? (
            <div className={`mk-panel mk-empty ${styles.gap}`} role="status" style={{ maxWidth: 640 }}>
              <h3 className="mk-h3">Communities didn&apos;t load.</h3>
              <p className="mk-body">Check your connection, then refresh the page.</p>
            </div>
          ) : (
            <ul className={styles.communities}>
              {communities.map(community => (
                <li key={community._id}>
                  <a
                    href={community.link ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.community}
                  >
                    <span className={styles.communityName}>{community.name}</span>
                    <span className={styles.communityDesc}>{community.description}</span>
                    <span className={styles.communityPlatform}>
                      {(community.icon && platformNames[community.icon]) || 'Community'}, opens in a new tab
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="stories-title">
          <div className={styles.storiesHead}>
            <h2 id="stories-title" className="mk-h2">Share your story</h2>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="mk-btn mk-btn--secondary"
              aria-expanded={showForm}
              aria-controls="story-form"
            >
              <UiIcon name={showForm ? 'close' : 'plus'} />
              <span>{showForm ? 'Close' : 'Write a story'}</span>
            </button>
          </div>

          {showForm && (
            <form id="story-form" onSubmit={handleSubmit} className={`mk-panel ${styles.form}`}>
              <div>
                <label className="mk-label" htmlFor="story-title">Title</label>
                <input
                  id="story-title"
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="mk-field"
                  placeholder="The tram that still stops at Shyambazar"
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label className="mk-label" htmlFor="story-content">Your story</label>
                <textarea
                  id="story-content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="mk-field"
                  maxLength={2000}
                  required
                />
              </div>
              <div>
                <label className="mk-label" htmlFor="story-link">A link, if there is one</label>
                <input
                  id="story-link"
                  type="url"
                  value={newPost.link}
                  onChange={(e) => setNewPost({ ...newPost, link: e.target.value })}
                  className="mk-field"
                  placeholder="https://"
                  maxLength={2048}
                />
              </div>
              {submitError && <p className={`mk-caption ${styles.formError}`} role="alert">{submitError}</p>}
              <div>
                <button type="submit" className="mk-btn mk-btn--primary" disabled={submitting}>
                  {submitting ? 'Posting…' : 'Post your story'} <span className="mk-btn-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          )}

          {storiesLoading ? (
            <AlponaLoader label="Gathering today’s stories" className={styles.gap} />
          ) : activeStories.length ? (
            <ul className={styles.stories} aria-label="Stories from the last 24 hours">
              {activeStories.map((story) => (
                <li key={story.id}>
                  <article className={`mk-panel ${styles.story}`}>
                    <h3 className="mk-h3">{story.title}</h3>
                    <time className="mk-meta" dateTime={story.createdAt}>{postedAt(story.createdAt)}</time>
                    <p className={`mk-body ${styles.storyText}`}>{story.story}</p>
                    <StoryMedia url={story.externalUrl} />
                  </article>
                </li>
              ))}
            </ul>
          ) : storiesFailed ? (
            <div className={`mk-panel mk-empty ${styles.empty}`} role="status">
              <h3 className="mk-h3">Stories didn&apos;t load.</h3>
              <p className="mk-body">Check your connection, then refresh the page.</p>
            </div>
          ) : (
            <div className={`mk-panel mk-empty ${styles.empty}`}>
              <Emblem name="kalash" size={56} />
              <h3 className="mk-h3">No stories yet.</h3>
              <p className="mk-body">Start with your para — the tea stall, the pandal, the house with the green shutters.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Contribute
