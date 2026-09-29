'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  ARCHETYPE_HINTS, GENDERS, LIMITS, NIGHTS, NIGHT_DAYS, PROMPTS, SHOW_ME, SOCIALS, VIBES, ZONES,
  type Gender, type Night, type PromptId, type ShowMe, type SocialKind, type VibeId, type ZoneId,
} from '@/lib/ashtami-date/config'
import type { OwnPhoto, OwnProfile } from '@/lib/ashtami-date/profile'
import { formatPujoDay } from '@/lib/pujo'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import styles from '@/styles/AshtamiDate.module.css'
import { api, preparePhoto } from './api'

type Props = {
  profile: OwnProfile | null
  /* editing one step from "you": save goes straight back to the deck */
  only?: number
  onProfile: (profile: OwnProfile) => void
  onFinish: () => void
  onUnderAge: () => void
  onCancel?: () => void
}

const TITLES: Record<number, [string, string]> = {
  1: ['first, the boring bit.', 'when were you born?'],
  2: ['what do we call you?', 'first name only. then who you are, and who you want to see.'],
  3: ['one to three photos.', 'your face, clearly, in the first one. the others can be the pandal.'],
  4: ['your ashtami.', 'the night, the area, the vibe.'],
  5: ['no bio. just a line.', 'one line, written for a plan. then the rules.'],
}

export function Onboarding({ profile, only, onProfile, onFinish, onUnderAge, onCancel }: Props) {
  const [step, setStep] = useState(() => only ?? Math.min(profile?.step ?? 1, 5))
  const heading = useRef<HTMLHeadingElement>(null)
  const [title, sub] = TITLES[step]

  /* each new step takes focus to its heading, so a screen reader hears where it is */
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [step])

  function saved(next: OwnProfile) {
    onProfile(next)
    if (only) return onFinish()
    if (step < 5) setStep(step + 1)
    else onFinish()
  }

  const back = only ? onCancel : step > 1 ? () => setStep(step - 1) : undefined

  return (
    <section className={styles.onboard} aria-labelledby="onboard-title">
      <div className={styles.progress} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= step ? styles.progressOn : undefined} />)}
      </div>
      <p className={styles.stepCount}>{only ? 'editing your card' : `step ${step} of 5`}</p>
      <h1 id="onboard-title" ref={heading} tabIndex={-1} className={styles.onboardTitle}>{title}</h1>
      <p className={styles.onboardSub}>{sub}</p>

      {step === 1 && <BirthStep profile={profile} onSaved={saved} onUnderAge={onUnderAge} back={back} />}
      {step === 2 && <NameStep profile={profile} onSaved={saved} back={back} editing={Boolean(only)} />}
      {step === 3 && profile && <PhotoStep profile={profile} onProfile={onProfile} onSaved={saved} back={back} editing={Boolean(only)} />}
      {step === 4 && <AshtamiStep profile={profile} onSaved={saved} back={back} editing={Boolean(only)} />}
      {step === 5 && <LineStep profile={profile} onSaved={saved} back={back} editing={Boolean(only)} />}
    </section>
  )
}

/* ------------------------------------------------------------- shared -- */

type StepProps = { profile: OwnProfile | null; onSaved: (p: OwnProfile) => void; back?: () => void; editing?: boolean }

function Actions({ busy, label, back, disabled = false }: { busy: boolean; label: string; back?: () => void; disabled?: boolean }) {
  return (
    <div className={styles.stepActions}>
      <button type="submit" className="mk-btn mk-btn--primary" disabled={busy || disabled}>
        {busy ? 'saving' : label} <span className="mk-btn-arrow" aria-hidden="true">→</span>
      </button>
      {back && <button type="button" className={`mk-btn mk-btn--text ${styles.quiet}`} onClick={back}>back</button>}
    </div>
  )
}

function Problem({ text }: { text: string | null }) {
  return <p className={styles.error} role="alert">{text}</p>
}

function useSave(onSaved: (p: OwnProfile) => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save(step: number, fields: Record<string, unknown>, onFail?: (status: number) => boolean) {
    setBusy(true)
    setError(null)
    const res = await api.saveStep(step, fields)
    setBusy(false)
    if (res.ok) return onSaved(res.data.profile)
    if (onFail?.(res.status)) return
    setError(res.message)
  }
  return { busy, error, setError, save }
}

function Choice<T extends string>({ name, legend, options, value, onChange, tilt = false }: {
  name: string
  legend: ReactNode
  options: readonly { id: T; label: ReactNode }[]
  value: T | null
  onChange: (value: T) => void
  tilt?: boolean
}) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLegend}>{legend}</legend>
      <div className={`${styles.chipRow} ${tilt ? styles.chipTilt : ''}`}>
        {options.map((o) => (
          <label key={o.id} className={styles.pick}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/* ------------------------------------------------------------ step 1 -- */

const pad = (v: string) => v.padStart(2, '0')

function BirthStep({ profile, onSaved, onUnderAge, back }: StepProps & { onUnderAge: () => void }) {
  const ids = { day: useId(), month: useId(), year: useId(), hint: useId() }
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const { busy, error, setError, save } = useSave(onSaved)

  if (profile) {
    const [y, m, d] = profile.birthDate.split('-')
    const said = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    return (
      <form className={styles.stepForm} onSubmit={(e) => { e.preventDefault(); onSaved(profile) }}>
        <p className={styles.stepText}>you told us {said}. it&apos;s set now; nobody else ever sees it, only your age.</p>
        <Actions busy={false} label="next" back={back} />
      </form>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
      return setError('day, month and year, in numbers.')
    }
    /* nothing is kept on this phone; under 18, nothing is kept on ours either */
    void save(1, { birthDate: `${year}-${pad(month)}-${pad(day)}` }, (status) => {
      if (status === 403) onUnderAge()
      return status === 403
    })
  }

  const digits = (set: (v: string) => void, max: number) => (e: ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/\D/g, '').slice(0, max))

  return (
    <form className={styles.stepForm} onSubmit={submit} noValidate>
      <div className={styles.dob} role="group" aria-describedby={ids.hint}>
        <label htmlFor={ids.day}><span>day</span>
          <input id={ids.day} className="mk-field" inputMode="numeric" autoComplete="bday-day" placeholder="19" value={day} onChange={digits(setDay, 2)} />
        </label>
        <label htmlFor={ids.month}><span>month</span>
          <input id={ids.month} className="mk-field" inputMode="numeric" autoComplete="bday-month" placeholder="10" value={month} onChange={digits(setMonth, 2)} />
        </label>
        <label htmlFor={ids.year} className={styles.dobYear}><span>year</span>
          <input id={ids.year} className="mk-field" inputMode="numeric" autoComplete="bday-year" placeholder="2001" value={year} onChange={digits(setYear, 4)} />
        </label>
      </div>
      <p id={ids.hint} className={styles.stepText}>18 and over only. we keep the date and show nobody anything but your age.</p>
      <Problem text={error} />
      <Actions busy={busy} label="next" back={back} />
    </form>
  )
}

/* ------------------------------------------------------------ step 2 -- */

function NameStep({ profile, onSaved, back, editing }: StepProps) {
  const nameId = useId()
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null)
  const [showMe, setShowMe] = useState<ShowMe | null>(profile?.showMe ?? null)
  const { busy, error, setError, save } = useSave(onSaved)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) return setError('your first name, please.')
    if (!gender) return setError('pick the one that fits you.')
    if (!showMe) return setError('pick who you want to see.')
    void save(2, { firstName, gender, showMe })
  }

  return (
    <form className={styles.stepForm} onSubmit={submit} noValidate>
      <label className={styles.fieldLabel} htmlFor={nameId}>first name</label>
      <input id={nameId} className={`mk-field ${styles.bigField}`} autoComplete="given-name" maxLength={20} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <Choice name="gender" legend="i am" options={GENDERS} value={gender} onChange={setGender} />
      <Choice name="showMe" legend="show me" options={SHOW_ME} value={showMe} onChange={setShowMe} />
      <Problem text={error} />
      <Actions busy={busy} label={editing ? 'save' : 'next'} back={back} />
    </form>
  )
}

/* ------------------------------------------------------------ step 3 -- */

function PhotoStep({ profile, onProfile, onSaved, back, editing }: StepProps & { profile: OwnProfile; onProfile: (p: OwnProfile) => void }) {
  const [busySlot, setBusySlot] = useState<number | null>(null)
  const { busy, error, setError, save } = useSave(onSaved)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const photos = [...profile.photos].sort((a, b) => a.position - b.position)
  const [status, setStatus] = useState('')

  async function add(slot: number, file: File | undefined) {
    if (!file) return
    setError(null)
    setBusySlot(slot)
    setStatus('getting that photo ready')
    try {
      const prepared = await preparePhoto(file)
      setStatus('uploading')
      const res = await api.addPhoto(prepared)
      if (!res.ok) throw new Error(res.message)
      const next: OwnPhoto[] = [...profile.photos, res.data.photo]
      onProfile({ ...profile, photos: next })
      setStatus('photo added')
    } catch (err) {
      setError((err as Error).message)
      setStatus('')
    } finally {
      setBusySlot(null)
      const input = inputs.current[slot]
      if (input) input.value = ''
    }
  }

  async function remove(photo: OwnPhoto) {
    setError(null)
    const res = await api.removePhoto(photo.id)
    if (!res.ok) return setError(res.message)
    onProfile({ ...profile, photos: profile.photos.filter((p) => p.id !== photo.id) })
    setStatus('photo removed')
  }

  return (
    <form className={styles.stepForm} onSubmit={(e) => { e.preventDefault(); void save(3, {}) }} noValidate>
      <ul className={styles.slots}>
        {Array.from({ length: LIMITS.photosMax }, (_, slot) => {
          const photo = photos[slot]
          return (
            <li key={photo?.id ?? `empty-${slot}`} className={`${styles.slot} ${slot === 0 ? styles.slotCover : ''}`}>
              {photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a signed, private link, see DeckCard */}
                  {photo.url ? <img src={photo.url} alt={`your photo ${slot + 1}`} /> : <span className={styles.slotEmpty}>saved</span>}
                  <button type="button" className={styles.slotRemove} onClick={() => void remove(photo)} aria-label={`remove photo ${slot + 1}`}>remove</button>
                </>
              ) : (
                <label className={styles.slotAdd}>
                  <input
                    ref={(el) => { inputs.current[slot] = el }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busySlot !== null}
                    onChange={(e) => void add(slot, e.target.files?.[0])}
                  />
                  <span aria-hidden="true" className={styles.slotPlus}>+</span>
                  <span>{busySlot === slot ? 'adding' : slot === 0 && !photos.length ? 'add your face' : 'add a photo'}</span>
                </label>
              )}
            </li>
          )
        })}
      </ul>
      <p className={styles.stepText}>we strip the location and camera data before anything is stored. photos stay private: only people in your deck and your matches see them, through links that stop working after half an hour.</p>
      <p className="sr-only" aria-live="polite">{status}</p>
      <Problem text={error} />
      <Actions busy={busy} label={editing ? 'done' : 'next'} back={back} disabled={photos.length < LIMITS.photosMin || busySlot !== null} />
    </form>
  )
}

/* ------------------------------------------------------------ step 4 -- */

type Found = { id: ArchetypeId; name: string }

function AshtamiStep({ profile, onSaved, back, editing }: StepProps) {
  const [night, setNight] = useState<Night | null>(profile?.night ?? null)
  const [zone, setZone] = useState<ZoneId | null>(profile?.zone ?? null)
  const [vibes, setVibes] = useState<VibeId[]>(profile?.vibes ?? [])
  const [archetype, setArchetype] = useState<ArchetypeId | null>(profile?.archetype ?? null)
  const [found, setFound] = useState<Found | null>(null)
  const { busy, error, setError, save } = useSave(onSaved)

  /* a Pujo Personality result on this phone, if there is one: offered, never assumed */
  useEffect(() => {
    let cancelled = false
    void Promise.all([import('@/lib/pujo-personality/session'), import('@/lib/pujo-personality/content')]).then(([session, content]) => {
      const saved = session.loadSaved()
      if (cancelled || !saved || session.isMinor(saved.prefs)) return
      const id = session.scoreAnswers(saved.answers).primary
      setFound({ id, name: content.CONTENT[id].name })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  function applyArchetype(id: ArchetypeId) {
    setArchetype(id)
    const hint = ARCHETYPE_HINTS[id]
    if (!night) setNight(hint.night)
    if (!vibes.length) setVibes(hint.vibes)
  }

  function toggle(vibe: VibeId) {
    setVibes((v) => (v.includes(vibe) ? v.filter((x) => x !== vibe) : v.length >= LIMITS.vibesMax ? v : [...v, vibe]))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!night) return setError('pick your night.')
    if (!zone) return setError('pick where you’ll be.')
    if (vibes.length < LIMITS.vibesMin) return setError(`pick at least ${LIMITS.vibesMin} vibes.`)
    void save(4, { night, zone, vibes, archetype })
  }

  const nights = NIGHTS.map((n) => ({
    id: n,
    label: (
      <span className={styles.ticket}>
        <span lang="bn" className={styles.ticketBn}>{NIGHT_DAYS[n].bn}</span>
        <span className={styles.ticketEn}>{n}</span>
        <span className={styles.ticketDate}>{formatPujoDay(NIGHT_DAYS[n]).toLowerCase()}</span>
      </span>
    ),
  }))

  return (
    <form className={styles.stepForm} onSubmit={submit} noValidate>
      {found && (
        <div className={styles.found}>
          <p className={styles.stepText}>your pujo personality says {found.name.toLowerCase()}.</p>
          <label className={styles.checkLine}>
            <input type="checkbox" checked={archetype === found.id} onChange={(e) => (e.target.checked ? applyArchetype(found.id) : setArchetype(null))} />
            <span>show it on my card, and fill in the rest from it</span>
          </label>
        </div>
      )}
      <Choice name="night" legend="which night?" options={nights} value={night} onChange={setNight} tilt />
      <Choice name="zone" legend="where will you be?" options={ZONES} value={zone} onChange={setZone} />
      <fieldset className={styles.group}>
        <legend className={styles.groupLegend}>pick {LIMITS.vibesMin} to {LIMITS.vibesMax} vibes <span className={styles.counter}>{vibes.length} picked</span></legend>
        <div className={styles.chipRow}>
          {VIBES.map((v) => (
            <label key={v.id} className={styles.pick}>
              <input type="checkbox" checked={vibes.includes(v.id)} onChange={() => toggle(v.id)} disabled={!vibes.includes(v.id) && vibes.length >= LIMITS.vibesMax} />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Problem text={error} />
      <Actions busy={busy} label={editing ? 'save' : 'next'} back={back} />
    </form>
  )
}

/* ------------------------------------------------------------ step 5 -- */

function LineStep({ profile, onSaved, back, editing }: StepProps) {
  const ids = { answer: useId(), handle: useId(), kind: useId() }
  const [promptId, setPromptId] = useState<PromptId | null>(profile?.promptId ?? null)
  const [answer, setAnswer] = useState(profile?.promptAnswer ?? '')
  const [kind, setKind] = useState<SocialKind>(profile?.socialKind ?? 'instagram')
  const [handle, setHandle] = useState(profile?.socialHandle ?? '')
  const [consent, setConsent] = useState(false)
  const { busy, error, setError, save } = useSave(onSaved)
  const prompt = PROMPTS.find((p) => p.id === promptId)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!promptId) return setError('pick a line to finish.')
    if (answer.trim().length < 2) return setError('finish the line. a few words is plenty.')
    if (!consent) return setError('tick the box to say you’re in.')
    void save(5, { promptId, promptAnswer: answer, socialKind: handle.trim() ? kind : null, socialHandle: handle.trim() || null, consent })
  }

  return (
    <form className={styles.stepForm} onSubmit={submit} noValidate>
      <Choice name="prompt" legend="pick one" options={PROMPTS.map((p) => ({ id: p.id, label: p.text }))} value={promptId} onChange={setPromptId} />
      {prompt && (
        <>
          <label className={styles.fieldLabel} htmlFor={ids.answer}>{prompt.text}</label>
          <textarea
            id={ids.answer}
            className={`mk-field ${styles.answer}`}
            rows={2}
            maxLength={LIMITS.promptMax}
            placeholder="the bagbazar bhog. i will stand there for an hour."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <p className={styles.counterLine}>{LIMITS.promptMax - [...answer].length} left</p>
        </>
      )}

      <fieldset className={styles.group}>
        <legend className={styles.groupLegend}>your handle, if you want</legend>
        <div className={styles.handleRow}>
          <label className="sr-only" htmlFor={ids.kind}>which app</label>
          <select id={ids.kind} className={`mk-field ${styles.handleKind}`} value={kind} onChange={(e) => setKind(e.target.value as SocialKind)}>
            {SOCIALS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <label className="sr-only" htmlFor={ids.handle}>username</label>
          <input id={ids.handle} className="mk-field" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="@username" value={handle} onChange={(e) => setHandle(e.target.value)} />
        </div>
        <p className={styles.stepText}>only a match sees it, and only after the first message. leave it empty and you can talk here instead.</p>
      </fieldset>

      <div className={styles.rules}>
        <p className={styles.rulesTitle}>the rules, quickly</p>
        <ul>
          <li>the first time, meet at a busy pandal, before 9 pm.</li>
          <li>group plans are welcome. bring your friends.</li>
          <li>a no is a no. so is no reply.</li>
          <li>report or block anyone, any time. a person reads every report.</li>
          <li>we check dates of birth, not ids. trust your gut, and tell a friend where you&apos;ll be.</li>
        </ul>
      </div>
      <label className={styles.checkLine}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>i&apos;m 18 or over, i&apos;ve read the rules, and i&apos;m in.</span>
      </label>
      <Problem text={error} />
      <Actions busy={busy} label={editing ? 'save' : 'put me in the deck'} back={back} />
    </form>
  )
}
