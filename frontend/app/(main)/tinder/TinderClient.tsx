// @ts-nocheck
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Sprig } from '@/components/brand/kolka'
import { AlponaLoader } from '@/components/brand/Alpona'
import styles from '@/styles/Experiences.module.css'

const DESCRIPTION_LIMIT = 180;
const RATINGS = [1, 2, 3, 4, 5]

function Tinder() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [pendingSwipe, setPendingSwipe] = useState(null)
  const [cardVisible, setCardVisible] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [userStars, setUserStars] = useState(3);
  const cardRef = useRef(null)

  useEffect(() => {
    /* aborted on unmount — and on React's dev-only second mount, so one request lands */
    const controller = new AbortController()
    async function fetchProfiles() {
      try {
        setLoading(true)
        const res = await fetch('/api/tinder-profiles', { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch profiles')
        const data = await res.json()
        setProfiles(data)
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchProfiles()
    return () => controller.abort()
  }, [])

  // Animate card entrance
  useEffect(() => {
    setCardVisible(true)
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = 'translateY(24px)'
      cardRef.current.style.opacity = '0'
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)'
          cardRef.current.style.transform = 'translateY(0)'
          cardRef.current.style.opacity = '1'
        }
      }, 30)
    }
    setShowFeedbackInput(false)
    setFeedbackText('')
  }, [currentIndex])

  // Mouse events
  const handleMouseDown = (e) => {
    setDrag({ ...drag, isDragging: true, startX: e.clientX, startY: e.clientY })
    document.body.style.userSelect = 'none'
  }
  const handleMouseMove = (e) => {
    if (!drag.isDragging) return
    const dx = e.clientX - drag.startX
    setDrag((d) => ({ ...d, x: dx }))
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`
    }
  }
  const handleMouseUp = () => {
    if (!drag.isDragging) return
    document.body.style.userSelect = ''
    const threshold = window.innerWidth * 0.25
    if (Math.abs(drag.x) > threshold) {
      const direction = drag.x > 0 ? 1 : -1
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 320ms cubic-bezier(0.65, 0, 0.35, 1)'
        cardRef.current.style.transform = `translateX(${direction * 500}px) rotate(${direction * 12}deg)`
      }
      setTimeout(() => {
        setCardVisible(false)
        setTimeout(() => {
          setPendingSwipe({ direction })
          setShowFeedback(true)
          setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
          if (cardRef.current) cardRef.current.style.transform = 'none'
        }, 300)
      }, 300)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)'
        cardRef.current.style.transform = 'none'
      }
      setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
    }
  }
  // Touch events
  const handleTouchStart = (e) => {
    setDrag({ ...drag, isDragging: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY })
  }
  const handleTouchMove = (e) => {
    if (!drag.isDragging) return
    const dx = e.touches[0].clientX - drag.startX
    setDrag((d) => ({ ...d, x: dx }))
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`
    }
  }
  const handleTouchEnd = () => {
    const threshold = window.innerWidth * 0.25
    if (Math.abs(drag.x) > threshold) {
      const direction = drag.x > 0 ? 1 : -1
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 320ms cubic-bezier(0.65, 0, 0.35, 1)'
        cardRef.current.style.transform = `translateX(${direction * 500}px) rotate(${direction * 12}deg)`
      }
      setTimeout(() => {
        setCardVisible(false)
        setTimeout(() => {
          setPendingSwipe({ direction })
          setShowFeedback(true)
          setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
          if (cardRef.current) cardRef.current.style.transform = 'none'
        }, 100)
      }, 300)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)'
        cardRef.current.style.transform = 'none'
      }
      setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
    }
  }

  // Handler to move to next card after feedback
  const handleFeedbackDone = async () => {
    setShowFeedback(false)
    setShowFeedbackInput(false)
    setPendingSwipe(null)
    setCardVisible(true)
    if (profiles[currentIndex]) {
      // Send feedback to backend
      try {
        await fetch(`/api/tinder-profiles/${profiles[currentIndex]._id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swipeDirection: pendingSwipe?.direction === 1 ? 'right' : 'left',
            feedbackText: feedbackText,
            userStars: userStars
          })
        })
      } catch (e) {
        // Optionally handle error
      }
    }
    setFeedbackText('')
    setUserStars(3)
    setCurrentIndex((prev) => (prev + 1) % profiles.length)
    // Always reset card transform after feedback
    if (cardRef.current) {
      cardRef.current.style.transform = 'none'
    }
  }

  if (loading) {
    return <main className="mk-page mk-page-top mk-wrap"><AlponaLoader label="Finding experiences" /></main>
  }
  if (error) {
    return (
      <main className="mk-page mk-page-top mk-wrap">
        <div className="mk-panel mk-empty" role="status" style={{ maxWidth: 640 }}>
          <h1 className="mk-h3">Experiences didn&apos;t load.</h1>
          <p className="mk-body">Check your connection, then refresh the page.</p>
        </div>
      </main>
    )
  }
  if (!profiles.length) {
    return (
      <main className="mk-page mk-page-top mk-wrap">
        <div className="mk-panel mk-empty" style={{ maxWidth: 640 }}>
          <h1 className="mk-h3">No experiences yet.</h1>
          <p className="mk-body">New places are added every week. Start with a pandal near you in the meantime.</p>
        </div>
      </main>
    )
  }
  if (currentIndex >= profiles.length) {
    return (
      <main className="mk-page mk-page-top mk-wrap">
        <div className="mk-panel mk-empty" style={{ maxWidth: 640 }}>
          <h1 className="mk-h3">That&apos;s every experience for now.</h1>
          <button onClick={() => setCurrentIndex(0)} className="mk-btn mk-btn--secondary">Start again</button>
        </div>
      </main>
    )
  }

  const profile = profiles[currentIndex]
  const isDescriptionLong = profile.bio.length > DESCRIPTION_LIMIT;
  const shortDescription = isDescriptionLong ? profile.bio.slice(0, DESCRIPTION_LIMIT).trimEnd() + '…' : profile.bio;

  // Swipe hints — words, never colour alone
  const glowStrength = Math.min(Math.abs(drag.x) / (window.innerWidth * 0.25), 1)
  const showLeftGlow = drag.x < -30 && drag.isDragging
  const showRightGlow = drag.x > 30 && drag.isDragging

  return (
    <main className={styles.stage}>
      <header className={styles.intro}>
        <div className="mk-band-head">
          <Sprig size={38} />
          <h1 className="mk-h2">Experiences</h1>
        </div>
        <p className="mk-caption">Drag right if it&apos;s for you, left if it isn&apos;t. Then tell us how it was.</p>
      </header>

      {showLeftGlow && !showFeedback && (
        <div className={`${styles.hint} ${styles.hintLeft}`} style={{ opacity: glowStrength }} aria-hidden="true">
          <span>Not for me</span>
        </div>
      )}
      {showRightGlow && !showFeedback && (
        <div className={`${styles.hint} ${styles.hintRight}`} style={{ opacity: glowStrength }} aria-hidden="true">
          <span>For me</span>
        </div>
      )}

      {!showFeedback && cardVisible && (
        <div
          ref={cardRef}
          className={styles.card}
          style={{ touchAction: 'pan-y' }}
          onMouseDown={handleMouseDown}
          onMouseMove={drag.isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.cardMedia}>
            <img src={profile.image} alt={profile.name} draggable={false} />
            <div className={styles.cardScrim} aria-hidden="true" />
          </div>
          <div className={styles.cardBody}>
            <h2 className={styles.cardTitle}>{profile.name}</h2>
            <p className={styles.cardAge}>{profile.age} years in the city</p>
            <p className={styles.cardBio}>
              {shortDescription}
              {isDescriptionLong && (
                <>
                  {' '}
                  <button type="button" className="mk-btn mk-btn--text" onMouseDown={(e) => e.stopPropagation()} onClick={() => setShowFullDescription(true)}>
                    Read the rest
                  </button>
                </>
              )}
            </p>
            <div className={styles.ratings}>
              {typeof profile.baseStars === 'number' && (
                <span>Elsewhere <span className={styles.ratingValue}>{profile.baseStars.toFixed(1)}</span> of 5</span>
              )}
              {typeof profile.averageStars === 'number' && (
                <span>On My Kolkata <span className={styles.ratingValue}>{profile.averageStars.toFixed(1)}</span> of 5</span>
              )}
            </div>
          </div>
        </div>
      )}

      {showFullDescription && (
        <div className="mk-backdrop" onClick={() => setShowFullDescription(false)}>
          <div className="mk-modal" role="dialog" aria-modal="true" aria-labelledby="exp-full-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="exp-full-title" className="mk-h3">{profile.name}</h2>
            <p className="mk-meta" style={{ marginTop: 4 }}>{profile.age} years in the city</p>
            <p className="mk-body" style={{ marginTop: 20, whiteSpace: 'pre-line' }}>{profile.bio}</p>
            <div className={styles.modalActions}>
              <button className="mk-btn mk-btn--secondary" onClick={() => setShowFullDescription(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="mk-backdrop">
          <div className="mk-modal" role="dialog" aria-modal="true" aria-labelledby="exp-feedback-title">
            <h2 id="exp-feedback-title" className="mk-h3">How was it?</h2>
            <p className="mk-caption" style={{ marginTop: 6 }}>{profile.name}. A number and a line is plenty.</p>

            <div className={`mk-seg ${styles.rating}`} role="group" aria-label="Your rating, out of 5">
              {RATINGS.map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-pressed={star === userStars}
                  aria-label={`${star} out of 5`}
                  onClick={() => setUserStars(star)}
                  data-testid={`star-${star}`}
                >
                  {star}
                </button>
              ))}
            </div>

            <label className="mk-label" htmlFor="exp-feedback">What stayed with you</label>
            <textarea
              id="exp-feedback"
              className="mk-field"
              rows={3}
              placeholder="The light at five, the queue for the phuchka…"
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className="mk-btn mk-btn--primary" onClick={handleFeedbackDone}>
                Send feedback <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </button>
              <button
                className="mk-btn mk-btn--secondary"
                onClick={() => { setShowFeedback(false); setShowFeedbackInput(false); setFeedbackText(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Tinder
