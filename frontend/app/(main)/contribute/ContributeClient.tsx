// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { Emblem } from '@/components/brand/emblems'
import { AlponaLoader } from '@/components/brand/Alpona'
import { UiIcon } from '@/components/brand/icons'
import styles from '@/styles/Contribute.module.css'

/* the platform, said in words — no logos, and no icon without a job */
const platformNames = {
  FaInstagram: 'Instagram',
  FaMeetup: 'Meetup',
  FaGithub: 'GitHub'
}

function Contribute() {
  const [showForm, setShowForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', link: '' })
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        if (!controller.signal.aborted) setError(err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchCommunities()
    return () => controller.abort()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle post submission
    setShowForm(false)
    setNewPost({ title: '', content: '', link: '' })
  }

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
                    href={community.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.community}
                  >
                    <span className={styles.communityName}>{community.name}</span>
                    <span className={styles.communityDesc}>{community.description}</span>
                    <span className={styles.communityPlatform}>
                      {platformNames[community.icon] || 'Community'}, opens in a new tab
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
                />
              </div>
              <div>
                <button type="submit" className="mk-btn mk-btn--primary">
                  Post your story <span className="mk-btn-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          )}

          <div className={`mk-panel mk-empty ${styles.empty}`}>
            <Emblem name="kalash" size={56} />
            <h3 className="mk-h3">No stories yet.</h3>
            <p className="mk-body">Start with your para — the tea stall, the pandal, the house with the green shutters.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Contribute
