import { useEffect, useRef, useState } from 'react'

// সুরক্ষিত ইউটিউব প্লেয়ার — ভিডিও চলবে, কিন্তু:
// - ভিডিওর ওপরে স্বচ্ছ overlay থাকায় ইউটিউবের লোগো/শিরোনাম/শেষের সাজেশনে ক্লিক পৌঁছায় না
// - রাইট-ক্লিকে "Copy video URL" মেনু আসে না
// - ইউটিউবের নিজের কন্ট্রোল নেই — শুধু নিচের নিজের কন্ট্রোল বার
// - ভিডিওর লিংক কোথাও দেখানো হয় না

let apiPromise = null

function loadYouTubeAPI() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => { apiPromise = null; reject(new Error('YouTube API লোড হয়নি')) }
    const first = document.getElementsByTagName('script')[0]
    first.parentNode.insertBefore(tag, first)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev()
      resolve(window.YT)
    }
  })
  return apiPromise
}

function fmt(sec) {
  if (!sec || !isFinite(sec)) return '০:০০'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])
  return `${bn(m)}:${bn(r).padStart(2, '০')}`
}

export default function SecurePlayer({ videoId, title }) {
  const wrapRef = useRef(null)
  const holderRef = useRef(null)
  const playerRef = useRef(null)
  const clickTimer = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer = null
    setReady(false)
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    setError('')

    loadYouTubeAPI()
      .then(YT => {
        if (cancelled) return
        const player = new YT.Player(holderRef.current, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: e => {
              if (cancelled) return
              setReady(true)
              setDuration(e.target.getDuration() || 0)
              setVolume(e.target.getVolume())
              setMuted(e.target.isMuted())
            },
            onStateChange: e => {
              if (cancelled) return
              const s = e.data
              setPlaying(s === YT.PlayerState.PLAYING)
              if (s === YT.PlayerState.PLAYING) {
                if (!timer) {
                  timer = setInterval(() => {
                    const p = playerRef.current
                    if (p && p.getCurrentTime) setCurrent(p.getCurrentTime())
                  }, 500)
                }
              } else {
                if (timer) { clearInterval(timer); timer = null }
                const p = playerRef.current
                if (p && p.getCurrentTime) setCurrent(p.getCurrentTime())
              }
            },
            onError: () => {
              if (!cancelled) setError('ভিডিওটি চালানো যাচ্ছে না। পরে আবার চেষ্টা করুন।')
            },
          },
        })
        playerRef.current = player
      })
      .catch(() => {
        if (!cancelled) setError('ভিডিও প্লেয়ার লোড হয়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।')
      })

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      if (clickTimer.current) clearTimeout(clickTimer.current)
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch { /* ignore */ }
        playerRef.current = null
      }
    }
  }, [videoId])

  const togglePlay = () => {
    const p = playerRef.current
    if (!p || !ready) return
    const state = p.getPlayerState()
    if (state === window.YT.PlayerState.PLAYING) p.pauseVideo()
    else p.playVideo()
  }

  const handleOverlayClick = () => {
    // ডাবল-ক্লিক (ফুলস্ক্রিন) থেকে আলাদা করতে একটু দেরি করে play/pause
    if (clickTimer.current) return
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      togglePlay()
    }, 220)
  }

  const toggleFullscreen = () => {
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null }
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else if (el.requestFullscreen) el.requestFullscreen()
  }

  const handleSeek = e => {
    const v = parseFloat(e.target.value)
    setCurrent(v)
    const p = playerRef.current
    if (p && ready) p.seekTo(v, true)
  }

  const handleVolume = e => {
    const v = parseInt(e.target.value, 10)
    setVolume(v)
    const p = playerRef.current
    if (!p || !ready) return
    p.setVolume(v)
    if (v > 0 && p.isMuted()) { p.unMute(); setMuted(false) }
    if (v === 0 && !p.isMuted()) { p.mute(); setMuted(true) }
  }

  const toggleMute = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (p.isMuted()) { p.unMute(); setMuted(false) }
    else { p.mute(); setMuted(true) }
  }

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-xl font-bold">{error}</p>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="w-full bg-black">
      <div
        className="relative aspect-video w-full select-none"
        onContextMenu={e => e.preventDefault()}
      >
        <div ref={holderRef} className="absolute inset-0 h-full w-full" />
        {/* স্বচ্ছ overlay — iframe-এর ভেতরের কোনো লিংকে ক্লিক পৌঁছায় না */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={handleOverlayClick}
          onDoubleClick={toggleFullscreen}
          onContextMenu={e => e.preventDefault()}
          title={title}
        />
        {!playing && ready && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-2xl text-white">▶</span>
          </div>
        )}
        {!ready && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-white">
            ভিডিও লোড হচ্ছে…
          </div>
        )}
      </div>

      {/* নিজের কন্ট্রোল বার */}
      <div
        className="flex items-center gap-2 px-3 py-2 text-white sm:gap-3 sm:px-4"
        onContextMenu={e => e.preventDefault()}
      >
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg hover:bg-white/25 disabled:opacity-40"
          aria-label={playing ? 'থামান' : 'চালান'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <span className="shrink-0 text-xs font-semibold tabular-nums sm:text-sm">
          {fmt(current)} / {fmt(duration)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={handleSeek}
          disabled={!ready}
          className="min-w-0 flex-1 accent-blue-500"
          aria-label="ভিডিওর সময়"
        />
        <button
          type="button"
          onClick={toggleMute}
          disabled={!ready}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base hover:bg-white/25 disabled:opacity-40"
          aria-label={muted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
        >
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          onChange={handleVolume}
          disabled={!ready}
          className="hidden w-20 accent-blue-500 sm:block"
          aria-label="ভলিউম"
        />
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base hover:bg-white/25"
          aria-label="ফুলস্ক্রিন"
        >
          ⛶
        </button>
      </div>
    </div>
  )
}
