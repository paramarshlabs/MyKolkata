// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/brand/Card'
import { AlponaLoader } from '@/components/brand/Alpona'
import { UiIcon } from '@/components/brand/icons'

function Explore() {
  const [searchTerm, setSearchTerm] = useState('')
  const [pandals, setPandals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPandals() {
      try {
        setLoading(true)
        const res = await fetch('/api/pandals')
        if (!res.ok) throw new Error('Failed to fetch pandals')
        const data = await res.json()
        setPandals(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPandals()
  }, [])

  if (loading) return <div className="mk-page mk-page-top mk-wrap"><AlponaLoader label="Finding pandals" /></div>
  if (error) {
    return (
      <div className="mk-page mk-page-top mk-wrap">
        <div className="mk-panel mk-empty" role="status" style={{ maxWidth: 640 }}>
          <h2 className="mk-h3">The pandals didn&apos;t load.</h2>
          <p className="mk-body">Check your connection, then refresh the page.</p>
        </div>
      </div>
    )
  }

  const filteredPandals = pandals.filter(pandal =>
    pandal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pandal.location && pandal.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="mk-page mk-page-top mk-wrap">
      <label className="mk-line" style={{ maxWidth: 640 }}>
        <span className="sr-only">Search pandals</span>
        <UiIcon name="search" size={20} />
        <input
          type="search"
          placeholder="Search a pandal or a para"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </label>

      <div className="mk-grid" style={{ marginTop: 48 }}>
        {filteredPandals.map(pandal => (
          <Card
            key={pandal._id}
            image={pandal.image}
            imageAlt=""
            icon="balcony"
            title={pandal.name}
            sub={[pandal.location, pandal.distance].filter(Boolean).join(', ')}
            desc={pandal.rating ? `Rated ${pandal.rating}. ${pandal.description ?? ''}` : pandal.description}
          />
        ))}
      </div>
    </div>
  )
}

export default Explore
