import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useSpotifyStore, type SpotifySection } from '../state/useSpotifyStore'
import type { SpotifyTrackInfo, SpotifyPlaylistInfo, SpotifyAlbumInfo, SpotifyAccountStatus } from '../lib/spotify'
import { useT } from '../i18n/useT'

const SECTION_TABS: { key: SpotifySection; labelKey: string }[] = [
  { key: 'liked', labelKey: 'spotify.section.liked' },
  { key: 'playlists', labelKey: 'spotify.section.playlists' },
  { key: 'albums', labelKey: 'spotify.section.albums' },
  { key: 'artists', labelKey: 'spotify.section.artists' },
  { key: 'recent', labelKey: 'spotify.section.recent' },
  { key: 'top', labelKey: 'spotify.section.top' },
  { key: 'search', labelKey: 'spotify.section.search' },
]

export interface SpotifyPanelProps {
  /**
   * Optional callback invoked before a Spotify track is played.
   * Receives a function that will actually start playback when called.
   * Used by the parent (App) to show the Librespot warning dialog.
   */
  onPlayTrack?: (play: () => void) => void
}

export function SpotifyPanel({ onPlayTrack }: SpotifyPanelProps) {
  const account = useSpotifyStore((s) => s.account)
  const isConfigured = useSpotifyStore((s) => s.isConfigured)
  const configLoading = useSpotifyStore((s) => s.configLoading)
  const loginLoading = useSpotifyStore((s) => s.loginLoading)
  const loginError = useSpotifyStore((s) => s.loginError)
  const activeSection = useSpotifyStore((s) => s.activeSection)
  const setActiveSection = useSpotifyStore((s) => s.setActiveSection)
  const beginLogin = useSpotifyStore((s) => s.beginLogin)
  const completeLogin = useSpotifyStore((s) => s.completeLogin)
  const doLogout = useSpotifyStore((s) => s.doLogout)
  const clearError = useSpotifyStore((s) => s.clearError)
  const checkAuth = useSpotifyStore((s) => s.checkAuth)
  const loadConfig = useSpotifyStore((s) => s.loadConfig)
  const playTrackStore = useSpotifyStore((s) => s.playTrack)

  const { t } = useT()
  const [oauthStep, setOauthStep] = useState<'idle' | 'waiting' | 'entering'>('idle')
  const [codeInput, setCodeInput] = useState('')
  const verifierRef = useRef<string | null>(null)
  const redirectUriRef = useRef<string | null>(null)

  // Wrap the playTrack action so the warning dialog is shown if needed.
  const wrappedPlayTrack = useCallback(
    (track: SpotifyTrackInfo) => {
      const doPlay = () => playTrackStore(track)
      if (onPlayTrack) {
        onPlayTrack(doPlay)
      } else {
        doPlay()
      }
    },
    [onPlayTrack, playTrackStore],
  )

  useEffect(() => {
    loadConfig().then(() => checkAuth())
  }, [loadConfig, checkAuth])

  // Listen for Tauri events from the async OAuth callback.
  useEffect(() => {
    let cancelled = false
    const unlistens: Array<() => void> = []

    listen<SpotifyAccountStatus>('spotify-auth-complete', (event) => {
      if (cancelled) return
      useSpotifyStore.setState({
        account: event.payload,
        loginLoading: false,
        loginError: null,
      })
      setOauthStep('idle')
      // Auto-load liked songs and refresh devices after login.
      useSpotifyStore.getState().loadLikedSongs()
      useSpotifyStore.getState().refreshDevices()
    }).then((fn) => {
      if (!cancelled) unlistens.push(fn)
    })

    listen<string>('spotify-auth-error', (event) => {
      if (cancelled) return
      useSpotifyStore.setState({
        loginError: event.payload,
        loginLoading: false,
      })
      setOauthStep('idle')
    }).then((fn) => {
      if (!cancelled) unlistens.push(fn)
    })

    return () => {
      cancelled = true
      unlistens.forEach((fn) => fn())
    }
  }, [])

  const handleLogin = useCallback(async () => {
    clearError()
    setOauthStep('waiting')
    const result = await beginLogin()
    if (result) {
      verifierRef.current = result.verifier
      redirectUriRef.current = result.redirectUri
    } else {
      setOauthStep('idle')
    }
  }, [beginLogin, clearError])

  const handleCodeSubmit = useCallback(async () => {
    if (!codeInput.trim() || !verifierRef.current || !redirectUriRef.current) return
    await completeLogin(redirectUriRef.current, codeInput.trim(), verifierRef.current)
    setOauthStep('idle')
    setCodeInput('')
    verifierRef.current = null
    redirectUriRef.current = null
  }, [codeInput, completeLogin])

  const handleLogout = useCallback(async () => {
    await doLogout()
    setOauthStep('idle')
    verifierRef.current = null
    redirectUriRef.current = null
  }, [doLogout])

  // If not configured, show setup prompt.
  if (!isConfigured && !configLoading) {
    return (
      <aside className="spotify-panel pixel-panel">
        <div className="spotify-panel__header">
          <span className="spotify-panel__title">SPOTIFY</span>
        </div>
        <div className="spotify-panel__login">
          <div className="spotify-panel__login-icon" aria-hidden="true">⚙</div>
          <div className="spotify-panel__login-text">{t('spotify.notConfigured')}</div>
          <button
            className="pixel-button"
            onClick={() => {
              const btn = document.querySelector<HTMLButtonElement>('.settings-button')
              btn?.click()
            }}
          >
            {t('spotify.notConfigured.action')}
          </button>
        </div>
      </aside>
    )
  }

  // Loading config...
  if (configLoading) {
    return (
      <aside className="spotify-panel pixel-panel">
        <div className="spotify-panel__header">
          <span className="spotify-panel__title">SPOTIFY</span>
        </div>
        <div className="spotify-panel__loading">Loading...</div>
      </aside>
    )
  }

  // If not connected, show login screen.
  if (!account?.connected) {
    return (
      <aside className="spotify-panel pixel-panel">
        <div className="spotify-panel__header">
          <span className="spotify-panel__title">SPOTIFY</span>
        </div>
        <div className="spotify-panel__login">
          <div className="spotify-panel__login-icon" aria-hidden="true">♪</div>
          <div className="spotify-panel__login-text">{t('spotify.login.prompt')}</div>

          {oauthStep === 'idle' && (
            <button
              className="pixel-button spotify-panel__login-btn"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? t('spotify.login.loading') : t('spotify.login.connect')}
            </button>
          )}

          {oauthStep === 'waiting' && (
            <div className="spotify-panel__oauth-waiting">
              <div className="spotify-panel__oauth-spinner" />
              <p>{t('spotify.login.browserOpened')}</p>
              <button
                className="pixel-button spotify-panel__oauth-manual"
                onClick={() => setOauthStep('entering')}
              >
                {t('spotify.login.enterCode')}
              </button>
            </div>
          )}

          {oauthStep === 'entering' && (
            <div className="spotify-panel__oauth-code">
              <p className="spotify-panel__oauth-hint">{t('spotify.login.pasteCode')}</p>
              <input
                className="spotify-panel__code-input"
                type="text"
                placeholder="Paste code here..."
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                autoFocus
              />
              <div className="spotify-panel__code-buttons">
                <button
                  className="pixel-button"
                  onClick={handleCodeSubmit}
                  disabled={!codeInput.trim() || loginLoading}
                >
                  {t('spotify.login.submit')}
                </button>
                <button
                  className="pixel-button"
                  onClick={() => { setOauthStep('idle'); setCodeInput('') }}
                >
                  {t('spotify.login.back')}
                </button>
              </div>
            </div>
          )}

          {loginError && <div className="spotify-panel__error">{loginError}</div>}
        </div>
      </aside>
    )
  }

  // Connected — show the browsing UI.
  return (
    <aside className="spotify-panel pixel-panel">
      <div className="spotify-panel__header">
        <span className="spotify-panel__title">SPOTIFY</span>
        <button
          className="spotify-panel__logout"
          onClick={handleLogout}
          title={t('spotify.logout')}
          aria-label={t('spotify.logout')}
        >
          ✕
        </button>
      </div>

      {account.display_name && (
        <div className="spotify-panel__account">
          {account.image_url && (
            <img className="spotify-panel__avatar" src={account.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
          )}
          <div className="spotify-panel__account-info">
            <div className="spotify-panel__account-name">{account.display_name}</div>
            <div className="spotify-panel__account-plan">
              {account.product === 'premium' ? 'Premium' : account.product ?? ''}
            </div>
          </div>
        </div>
      )}

      <nav className="spotify-panel__tabs">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`spotify-panel__tab ${activeSection === tab.key ? 'is-active' : ''}`}
            onClick={() => setActiveSection(tab.key)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div className="spotify-panel__content">
        {activeSection === 'liked' && (
          <TrackListSection title={t('spotify.section.liked')} loadMoreKey="liked" onPlayTrack={wrappedPlayTrack} />
        )}
        {activeSection === 'playlists' && <PlaylistSection onPlayTrack={wrappedPlayTrack} />}
        {activeSection === 'albums' && <AlbumSection onPlayTrack={wrappedPlayTrack} />}
        {activeSection === 'artists' && <ArtistSection />}
        {activeSection === 'recent' && (
          <TrackListSection title={t('spotify.section.recent')} loadMoreKey="recent" onPlayTrack={wrappedPlayTrack} />
        )}
        {activeSection === 'top' && (
          <TrackListSection title={t('spotify.section.top')} loadMoreKey="top" onPlayTrack={wrappedPlayTrack} />
        )}
        {activeSection === 'search' && <SearchSection onPlayTrack={wrappedPlayTrack} />}
      </div>

      <div className="spotify-panel__footer">
        <span className="spotify-panel__footer-text">
          {account.product === 'premium' ? '🔊 Premium' : '🎵 Spotify'}
        </span>
      </div>
    </aside>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function TrackListSection({
  title,
  loadMoreKey,
  onPlayTrack,
}: {
  title: string
  loadMoreKey: 'liked' | 'recent' | 'top'
  onPlayTrack?: (track: SpotifyTrackInfo) => void
}) {
  const tracks = useSpotifyStore((s) => {
    if (loadMoreKey === 'liked') return s.likedSongs
    if (loadMoreKey === 'recent') return s.recentlyPlayed
    return s.topTracks
  })
  const loading = useSpotifyStore((s) => {
    if (loadMoreKey === 'liked') return s.loadingLiked
    if (loadMoreKey === 'recent') return s.loadingRecent
    return s.loadingTop
  })
  const hasMore = useSpotifyStore((s) => {
    if (loadMoreKey === 'liked') return s.likedHasMore
    if (loadMoreKey === 'recent') return false
    return true
  })
  const loadFn = useSpotifyStore((s) => {
    if (loadMoreKey === 'liked') return s.loadLikedSongs
    if (loadMoreKey === 'recent') return s.loadRecentlyPlayed
    return s.loadTopTracks
  })
  const error = useSpotifyStore((s) => s.error)
  const playTrackFromStore = useSpotifyStore((s) => s.playTrack)
  const playTrackFn = onPlayTrack ?? playTrackFromStore
  const playbackError = useSpotifyStore((s) => s.playbackError)

  return (
    <div className="spotify-panel__section">
      <div className="spotify-panel__section-header">
        <span>{title}</span>
        <span className="spotify-panel__count">{tracks.length}</span>
      </div>
      {playbackError && <div className="spotify-panel__error">{playbackError}</div>}
      {loading && tracks.length === 0 ? (
        <div className="spotify-panel__loading">Loading...</div>
      ) : error ? (
        <div className="spotify-panel__error">{error}</div>
      ) : tracks.length === 0 ? (
        <div className="spotify-panel__empty">No tracks</div>
      ) : (
        <ul className="spotify-panel__track-list">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} onPlay={playTrackFn} />
          ))}
          {hasMore && loadMoreKey !== 'recent' && (
            <li>
              <button
                className="spotify-panel__load-more"
                onClick={() => loadFn(true)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more...'}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function TrackRow({ track, onPlay }: { track: SpotifyTrackInfo; onPlay?: (track: SpotifyTrackInfo) => void }) {
  return (
    <li
      className="spotify-panel__track-row"
      onDoubleClick={() => onPlay?.(track)}
      title={onPlay ? `Play: ${track.title} — ${track.artist}` : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && onPlay) onPlay(track) }}
    >
      {track.image_url ? (
        <img className="spotify-panel__track-art" src={track.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
      ) : (
        <span className="spotify-panel__track-art--placeholder">♪</span>
      )}
      <div className="spotify-panel__track-info">
        <div className="spotify-panel__track-title">{track.title}</div>
        <div className="spotify-panel__track-artist">
          {track.artist}{track.album ? ` · ${track.album}` : ''}
        </div>
      </div>
      <span className="spotify-panel__track-time">{fmtMs(track.duration_ms)}</span>
    </li>
  )
}

function PlaylistSection({ onPlayTrack }: { onPlayTrack?: (track: SpotifyTrackInfo) => void }) {
  const playlists = useSpotifyStore((s) => s.playlists)
  const loading = useSpotifyStore((s) => s.loadingPlaylists)
  const hasMore = useSpotifyStore((s) => s.playlistHasMore)
  const loadMore = useSpotifyStore((s) => s.loadPlaylists)
  const error = useSpotifyStore((s) => s.error)
  const loadPlaylistTracks = useSpotifyStore((s) => s.loadPlaylistTracks)
  const [expanded, setExpanded] = useState<SpotifyPlaylistInfo | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrackInfo[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  const handleExpand = async (p: SpotifyPlaylistInfo) => {
    setExpanded(p)
    setLoadingTracks(true)
    const result = await loadPlaylistTracks(p.id)
    setTracks(result)
    setLoadingTracks(false)
  }

  const playTrackFromStore = useSpotifyStore((s) => s.playTrack)
  const playTrack = onPlayTrack ?? playTrackFromStore
  const playbackError = useSpotifyStore((s) => s.playbackError)

  if (expanded) {
    return (
      <div className="spotify-panel__section">
        <div className="spotify-panel__section-header">
          <button className="spotify-panel__back-btn" onClick={() => setExpanded(null)}>◀ BACK</button>
          <span>{expanded.name}</span>
        </div>
        {playbackError && <div className="spotify-panel__error">{playbackError}</div>}
        {loadingTracks ? (
          <div className="spotify-panel__loading">Loading...</div>
        ) : (
          <ul className="spotify-panel__track-list">
            {tracks.map((t) => <TrackRow key={t.id} track={t} onPlay={playTrack} />)}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="spotify-panel__section">
      <div className="spotify-panel__section-header">
        <span>Playlists</span>
        <span className="spotify-panel__count">{playlists.length}</span>
      </div>
      {loading && playlists.length === 0 ? (
        <div className="spotify-panel__loading">Loading...</div>
      ) : error ? (
        <div className="spotify-panel__error">{error}</div>
      ) : (
        <ul className="spotify-panel__list">
          {playlists.map((p) => (
            <li key={p.id}>
              <button className="spotify-panel__item-btn" onClick={() => handleExpand(p)}>
                {p.image_url ? (
                  <img className="spotify-panel__item-art" src={p.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <span className="spotify-panel__item-art--placeholder">♫</span>
                )}
                <div className="spotify-panel__item-info">
                  <div className="spotify-panel__item-name">{p.name}</div>
                  <div className="spotify-panel__item-sub">
                    {p.owner ? `${p.owner} · ` : ''}{p.track_count} tracks
                  </div>
                </div>
              </button>
            </li>
          ))}
          {hasMore && (
            <li>
              <button className="spotify-panel__load-more" onClick={() => loadMore(true)} disabled={loading}>
                Load more...
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function AlbumSection({ onPlayTrack }: { onPlayTrack?: (track: SpotifyTrackInfo) => void }) {
  const albums = useSpotifyStore((s) => s.albums)
  const loading = useSpotifyStore((s) => s.loadingAlbums)
  const hasMore = useSpotifyStore((s) => s.albumHasMore)
  const loadMore = useSpotifyStore((s) => s.loadAlbums)
  const error = useSpotifyStore((s) => s.error)
  const loadAlbumTracks = useSpotifyStore((s) => s.loadAlbumTracks)
  const [expanded, setExpanded] = useState<SpotifyAlbumInfo | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrackInfo[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  const handleExpand = async (a: SpotifyAlbumInfo) => {
    setExpanded(a)
    setLoadingTracks(true)
    const result = await loadAlbumTracks(a.id)
    setTracks(result)
    setLoadingTracks(false)
  }

  const playTrackFromStore = useSpotifyStore((s) => s.playTrack)
  const playTrack = onPlayTrack ?? playTrackFromStore
  const playbackError = useSpotifyStore((s) => s.playbackError)

  if (expanded) {
    return (
      <div className="spotify-panel__section">
        <div className="spotify-panel__section-header">
          <button className="spotify-panel__back-btn" onClick={() => setExpanded(null)}>◀ BACK</button>
          <span>{expanded.name}</span>
        </div>
        {playbackError && <div className="spotify-panel__error">{playbackError}</div>}
        {loadingTracks ? (
          <div className="spotify-panel__loading">Loading...</div>
        ) : (
          <ul className="spotify-panel__track-list">
            {tracks.map((t) => (
              <TrackRow key={t.id} track={{ ...t, image_url: t.image_url ?? expanded.image_url }} onPlay={playTrack} />
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="spotify-panel__section">
      <div className="spotify-panel__section-header">
        <span>Albums</span>
        <span className="spotify-panel__count">{albums.length}</span>
      </div>
      {loading && albums.length === 0 ? (
        <div className="spotify-panel__loading">Loading...</div>
      ) : error ? (
        <div className="spotify-panel__error">{error}</div>
      ) : (
        <ul className="spotify-panel__list">
          {albums.map((a) => (
            <li key={a.id}>
              <button className="spotify-panel__item-btn" onClick={() => handleExpand(a)}>
                {a.image_url ? (
                  <img className="spotify-panel__item-art" src={a.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <span className="spotify-panel__item-art--placeholder">💿</span>
                )}
                <div className="spotify-panel__item-info">
                  <div className="spotify-panel__item-name">{a.name}</div>
                  <div className="spotify-panel__item-sub">
                    {a.artist}{a.release_date ? ` · ${a.release_date.slice(0, 4)}` : ''}
                  </div>
                </div>
              </button>
            </li>
          ))}
          {hasMore && (
            <li>
              <button className="spotify-panel__load-more" onClick={() => loadMore(true)} disabled={loading}>
                Load more...
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ArtistSection() {
  const artists = useSpotifyStore((s) => s.artists)
  const loading = useSpotifyStore((s) => s.loadingArtists)
  const hasMore = useSpotifyStore((s) => s.artistHasMore)
  const loadMore = useSpotifyStore((s) => s.loadArtists)
  const error = useSpotifyStore((s) => s.error)

  return (
    <div className="spotify-panel__section">
      <div className="spotify-panel__section-header">
        <span>Artists</span>
        <span className="spotify-panel__count">{artists.length}</span>
      </div>
      {loading && artists.length === 0 ? (
        <div className="spotify-panel__loading">Loading...</div>
      ) : error ? (
        <div className="spotify-panel__error">{error}</div>
      ) : (
        <ul className="spotify-panel__list">
          {artists.map((a) => (
            <li key={a.id}>
              <div className="spotify-panel__item-btn">
                {a.image_url ? (
                  <img className="spotify-panel__item-art spotify-panel__item-art--circle" src={a.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <span className="spotify-panel__item-art--placeholder spotify-panel__item-art--circle">🎤</span>
                )}
                <div className="spotify-panel__item-info">
                  <div className="spotify-panel__item-name">{a.name}</div>
                  <div className="spotify-panel__item-sub">Artist</div>
                </div>
              </div>
            </li>
          ))}
          {hasMore && (
            <li>
              <button className="spotify-panel__load-more" onClick={() => loadMore(true)} disabled={loading}>
                Load more...
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function SearchSection({ onPlayTrack }: { onPlayTrack?: (track: SpotifyTrackInfo) => void }) {
  const searchResults = useSpotifyStore((s) => s.searchResults)
  const loadingSearch = useSpotifyStore((s) => s.loadingSearch)
  const doSearch = useSpotifyStore((s) => s.doSearch)
  const storeError = useSpotifyStore((s) => s.error)
  const playTrackFromStore = useSpotifyStore((s) => s.playTrack)
  const playTrack = onPlayTrack ?? playTrackFromStore
  const playbackError = useSpotifyStore((s) => s.playbackError)
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (value: string) => {
    setQuery(value)
    console.log('[SEARCH] Query typed:', JSON.stringify(value))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      console.log('[SEARCH] Debounce fired — calling doSearch with:', JSON.stringify(value))
      doSearch(value)
    }, 400)
  }

  // Log when search results are committed to the DOM.
  useLayoutEffect(() => {
    if (searchResults) {
      const total =
        searchResults.tracks.length +
        searchResults.albums.length +
        searchResults.artists.length +
        searchResults.playlists.length;
      console.log('[SEARCH] React rendered', total, 'rows total (',
        searchResults.tracks.length, 'tracks,',
        searchResults.albums.length, 'albums,',
        searchResults.artists.length, 'artists,',
        searchResults.playlists.length, 'playlists )');
    }
  }, [searchResults]);

  return (
    <div className="spotify-panel__section">
      <div className="spotify-panel__search-wrap">
        <input
          className="spotify-panel__search-input"
          type="text"
          placeholder="Search Spotify..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
        />
        {loadingSearch && <span className="spotify-panel__search-spinner">⏳</span>}
      </div>

      {storeError && <div className="spotify-panel__error">[SEARCH] {storeError}</div>}
      {playbackError && <div className="spotify-panel__error">{playbackError}</div>}

      {searchResults && (
        <div className="spotify-panel__search-results">
          {searchResults.tracks.length > 0 && (
            <>
              <div className="spotify-panel__result-header">Tracks</div>
              <ul className="spotify-panel__track-list">
                {searchResults.tracks.map((t) => <TrackRow key={t.id} track={t} onPlay={playTrack} />)}
              </ul>
            </>
          )}
          {searchResults.albums.length > 0 && (
            <>
              <div className="spotify-panel__result-header">Albums</div>
              <ul className="spotify-panel__list">
                {searchResults.albums.map((a) => (
                  <li key={a.id}>
                    <div className="spotify-panel__item-btn">
                      {a.image_url ? (
                        <img className="spotify-panel__item-art" src={a.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <span className="spotify-panel__item-art--placeholder">💿</span>
                      )}
                      <div className="spotify-panel__item-info">
                        <div className="spotify-panel__item-name">{a.name}</div>
                        <div className="spotify-panel__item-sub">{a.artist}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {searchResults.artists.length > 0 && (
            <>
              <div className="spotify-panel__result-header">Artists</div>
              <ul className="spotify-panel__list">
                {searchResults.artists.map((a) => (
                  <li key={a.id}>
                    <div className="spotify-panel__item-btn">
                      <span className="spotify-panel__item-art--placeholder spotify-panel__item-art--circle">🎤</span>
                      <div className="spotify-panel__item-info">
                        <div className="spotify-panel__item-name">{a.name}</div>
                        <div className="spotify-panel__item-sub">Artist</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {searchResults.playlists.length > 0 && (
            <>
              <div className="spotify-panel__result-header">Playlists</div>
              <ul className="spotify-panel__list">
                {searchResults.playlists.map((p) => (
                  <li key={p.id}>
                    <div className="spotify-panel__item-btn">
                      {p.image_url ? (
                        <img className="spotify-panel__item-art" src={p.image_url} alt="" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <span className="spotify-panel__item-art--placeholder">♫</span>
                      )}
                      <div className="spotify-panel__item-info">
                        <div className="spotify-panel__item-name">{p.name}</div>
                        <div className="spotify-panel__item-sub">
                          {p.owner ?? 'Spotify'} · {p.track_count} tracks
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  if (!ms || !Number.isFinite(ms)) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
