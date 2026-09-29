'use client'

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

/*
 * The card's physics. A drag follows the finger (and tilts with it); let go
 * past the line, or flick it, and the card flies off at the speed it was
 * thrown; let go short of it and a spring pulls it home with a little
 * overshoot. Painted straight onto the element in a frame loop, so a drag
 * never re-renders React. Under reduced motion the card still follows the
 * finger, but doesn't tilt, spring or fly: it simply goes.
 *
 * The card reads --drag (−1 to 1) for its "for me" and "not for me" stamps.
 */

type Options = {
  /* the moment the card is let go for good, before it has flown: the swipe can be sent now */
  onLeave?: (direction: 1 | -1) => void
  /* after the card has left the screen */
  onCommit: (direction: 1 | -1) => void
  /* a tap, with where it landed across the card (0 to 1) and on the screen: the photos use it */
  onTap?: (xRatio: number, clientX: number) => void
  disabled?: boolean
}

const SPRING = { stiffness: 320, damping: 21 }
const FLICK_SPEED = 650 /* px per second */
const TAP_SLOP = 6

export function useSwipe<T extends HTMLElement>({ onLeave, onCommit, onTap, disabled = false }: Options) {
  const ref = useRef<T | null>(null)
  const s = useRef({
    x: 0, y: 0, vx: 0, vy: 0,
    dragging: false, pointer: -1, startX: 0, startY: 0, startT: 0, moved: 0,
    samples: [] as { t: number; x: number }[],
    raf: 0, leaving: false,
  })
  const reduced = useRef(false)
  const leave = useRef(onLeave)
  const commit = useRef(onCommit)
  const tap = useRef(onTap)
  useEffect(() => {
    leave.current = onLeave
    commit.current = onCommit
    tap.current = onTap
  })

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = query.matches
    const change = () => { reduced.current = query.matches }
    query.addEventListener('change', change)
    const state = s.current
    return () => {
      query.removeEventListener('change', change)
      cancelAnimationFrame(state.raf)
    }
  }, [])

  const threshold = () => Math.min(140, (ref.current?.offsetWidth ?? 360) * 0.3)

  const paint = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { x, y } = s.current
    /* the same lean for the same share of the card, so a wide desktop card doesn't swing */
    const tilt = reduced.current ? 0 : (x / Math.max(1, el.offsetWidth)) * 20
    el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`
    el.style.setProperty('--drag', String(Math.max(-1, Math.min(1, x / threshold()))))
  }, [])

  const stop = () => cancelAnimationFrame(s.current.raf)

  /* a damped spring towards home, integrated per frame */
  const springHome = useCallback(() => {
    stop()
    const state = s.current
    if (reduced.current) {
      Object.assign(state, { x: 0, y: 0, vx: 0, vy: 0 })
      paint()
      return
    }
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      for (const axis of ['x', 'y'] as const) {
        const v = axis === 'x' ? 'vx' : 'vy'
        const a = -SPRING.stiffness * state[axis] - SPRING.damping * state[v]
        state[v] += a * dt
        state[axis] += state[v] * dt
      }
      paint()
      const settled = Math.abs(state.x) < 0.4 && Math.abs(state.y) < 0.4 && Math.abs(state.vx) < 8 && Math.abs(state.vy) < 8
      if (settled) {
        Object.assign(state, { x: 0, y: 0, vx: 0, vy: 0 })
        paint()
      } else {
        state.raf = requestAnimationFrame(frame)
      }
    }
    state.raf = requestAnimationFrame(frame)
  }, [paint])

  /* off the screen at the speed it was thrown, a little faster if it was only nudged */
  const throwOut = useCallback((direction: 1 | -1, speed = 0) => {
    const state = s.current
    if (state.leaving) return
    state.leaving = true
    stop()
    leave.current?.(direction)
    const finish = () => commit.current(direction)
    if (reduced.current || !ref.current) {
      finish()
      return
    }
    const distance = window.innerWidth / 2 + (ref.current.offsetWidth ?? 360) * 1.2
    let v = direction * Math.max(Math.abs(speed), 1900)
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      v *= 1.04
      state.x += v * dt
      state.y += state.vy * dt * 0.5
      paint()
      if (Math.abs(state.x) >= distance) finish()
      else state.raf = requestAnimationFrame(frame)
    }
    state.raf = requestAnimationFrame(frame)
  }, [paint])

  const onPointerDown = useCallback((e: ReactPointerEvent<T>) => {
    const state = s.current
    if (disabled || state.leaving || (e.pointerType === 'mouse' && e.button !== 0)) return
    stop()
    e.currentTarget.setPointerCapture(e.pointerId)
    Object.assign(state, {
      dragging: true, pointer: e.pointerId, startX: e.clientX - state.x, startY: e.clientY - state.y,
      startT: performance.now(), moved: 0, samples: [],
    })
  }, [disabled])

  const onPointerMove = useCallback((e: ReactPointerEvent<T>) => {
    const state = s.current
    if (!state.dragging || e.pointerId !== state.pointer) return
    state.x = e.clientX - state.startX
    state.y = (e.clientY - state.startY) * 0.3
    state.moved = Math.max(state.moved, Math.hypot(state.x, state.y))
    const t = performance.now()
    state.samples.push({ t, x: state.x })
    while (state.samples.length > 2 && t - state.samples[0].t > 100) state.samples.shift()
    paint()
  }, [paint])

  const release = useCallback((e: ReactPointerEvent<T>, cancelled: boolean) => {
    const state = s.current
    if (!state.dragging || e.pointerId !== state.pointer) return
    state.dragging = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)

    if (!cancelled && state.moved < TAP_SLOP && performance.now() - state.startT < 350) {
      const box = e.currentTarget.getBoundingClientRect()
      Object.assign(state, { x: 0, y: 0 })
      paint()
      tap.current?.((e.clientX - box.left) / Math.max(1, box.width), e.clientX)
      return
    }
    const [first, last] = [state.samples[0], state.samples[state.samples.length - 1]]
    const speed = first && last && last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0
    state.vx = speed
    state.vy = 0
    const far = Math.abs(state.x) > threshold()
    const flicked = Math.abs(speed) > FLICK_SPEED && Math.abs(state.x) > 30 && Math.sign(speed) === Math.sign(state.x)
    if (!cancelled && (far || flicked)) throwOut(state.x > 0 ? 1 : -1, speed)
    else springHome()
  }, [paint, springHome, throwOut])

  return {
    ref,
    throwOut,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: ReactPointerEvent<T>) => release(e, false),
      onPointerCancel: (e: ReactPointerEvent<T>) => release(e, true),
    },
  }
}
