import { useState, useMemo } from 'react'
import { useDraws } from './hooks/useDraws'
import { analyzeDraws, analyzePositions, getTopPicks } from './utils/analysis'
import {
  PlusCircle, Trash2, TrendingUp, Star, BarChart3,
  ChevronDown, ChevronUp, Loader2, Flame, Snowflake,
  Trophy, AlertTriangle, X, TicketIcon
} from 'lucide-react'
import StatsTab from './components/StatsTab'
import BetsTab from './components/BetsTab'

// ─── Ball ─────────────────────────────────────────────────────────────────────
function Ball({ n, type = 'number', size = 'md' }: {
  n: number, type?: 'number' | 'star', size?: 'sm' | 'md' | 'lg'
}) {
  const dim = { sm: 32, md: 42, lg: 52 }[size]
  const fs  = { sm: 11, md: 14, lg: 17 }[size]
  const isStar = type === 'star'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim, height: dim, borderRadius: '50%', flexShrink: 0,
      fontSize: fs, fontFamily: "'Space Mono',monospace", fontWeight: 700,
      userSelect: 'none',
      background: isStar ? 'var(--gold)' : 'var(--blue)',
      color: isStar ? '#1a0e00' : '#fff',
      boxShadow: isStar
        ? '0 2px 8px rgba(240,180,41,0.35)'
        : '0 2px 8px rgba(91,127,255,0.35)',
    }}>
      {n < 10 ? `0${n}` : n}
    </span>
  )
}

// ─── NumberPicker ─────────────────────────────────────────────────────────────
function NumberPicker({ max, count, selected, onChange, label }: {
  max: number, count: number, selected: number[], onChange: (v: number[]) => void, label: string
}) {
  const isStar = max === 12
  const toggle = (n: number) => {
    if (selected.includes(n)) onChange(selected.filter(x => x !== n))
    else if (selected.length < count) onChange([...selected, n].sort((a, b) => a - b))
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: "'Space Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: isStar ? 'var(--gold)' : 'var(--blue)', fontWeight: 700 }}>{selected.length}/{count}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const sel = selected.includes(n)
          const disabled = !sel && selected.length >= count
          return (
            <button key={n} onClick={() => toggle(n)} disabled={disabled} style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s',
              transform: sel ? 'scale(1.15)' : 'scale(1)',
              background: sel
                ? isStar ? 'var(--gold)' : 'var(--blue)'
                : disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
              color: sel
                ? isStar ? '#1a0e00' : '#fff'
                : disabled ? 'var(--t3)' : 'var(--t2)',
              boxShadow: sel ? (isStar ? '0 2px 8px rgba(240,180,41,0.4)' : '0 2px 8px rgba(91,127,255,0.4)') : 'none',
            }}>{n < 10 ? `0${n}` : n}</button>
          )
        })}
      </div>
    </div>
  )
}

// ─── DrawCard ─────────────────────────────────────────────────────────────────
function DrawCard({ draw, onDelete, onToggleExclude, index }: { draw: any, onDelete: () => void, onToggleExclude: () => void, index: number }) {
  const excluded = !!draw.excluded
  return (
    <div className="fu" style={{
      animationDelay: `${index * 0.03}s`,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: excluded ? 'rgba(255,255,255,0.02)' : 'var(--bg3)',
      border: `1px solid ${excluded ? 'var(--t3)' : 'var(--border)'}`,
      opacity: excluded ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ minWidth: 76 }}>
        <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>{draw.date}</p>
        {draw.jackpot && <p style={{ fontSize: 10, color: 'var(--gold)', fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{draw.jackpot}</p>}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
        {draw.numbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}
        <span style={{ color: 'var(--t3)', margin: '0 3px', fontSize: 16 }}>·</span>
        {draw.stars.map((n: number) => <Ball key={n} n={n} type="star" size="sm" />)}
      </div>
      {/* Toggle exclude */}
      <button onClick={onToggleExclude} title={excluded ? 'Incluir en análisis' : 'Excluir del análisis'} style={{
        background: excluded ? 'rgba(91,127,255,0.15)' : 'none',
        border: excluded ? '1px solid rgba(91,127,255,0.3)' : 'none',
        cursor: 'pointer', color: excluded ? 'var(--blue)' : 'var(--t3)',
        padding: '3px 6px', borderRadius: 6, fontSize: 10,
        fontFamily: "'Space Mono',monospace", fontWeight: 700,
        transition: 'all 0.15s', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {excluded ? 'OFF' : 'ON'}
      </button>
      {/* Delete */}
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, borderRadius: 6, transition: 'color 0.15s', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--t3)'}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── PredCard ─────────────────────────────────────────────────────────────────
function PredCard({ pred, index, expanded, onToggle }: { pred: any, index: number, expanded: boolean, onToggle: () => void }) {
  const emoji = pred.strategy.split(' ')[0]
  const name  = pred.strategy.slice(pred.strategy.indexOf(' ') + 1)
  const conf  = pred.confidence
  const confColor = conf >= 58 ? 'var(--green)' : conf >= 50 ? 'var(--gold)' : 'var(--t3)'
  return (
    <div className="fu" style={{ animationDelay: `${index * 0.04}s`, borderRadius: 14, overflow: 'hidden', border: `1px solid ${expanded ? 'rgba(91,127,255,0.25)' : 'var(--border)'}`, background: expanded ? 'var(--bg4)' : 'var(--bg3)', transition: 'all 0.2s' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <div style={{ height: 3, width: 72, background: 'var(--bg5)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${conf}%`, background: confColor, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: 10, color: confColor, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{conf}%</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>{pred.numbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}</div>
          <span style={{ color: 'var(--t3)' }}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>{pred.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {pred.numbers.map((n: number) => <Ball key={n} n={n} size="md" />)}
            <span style={{ color: 'var(--t3)', margin: '0 5px', fontSize: 18 }}>·</span>
            {pred.stars.map((n: number) => <Ball key={n} n={n} type="star" size="md" />)}
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--t2)', fontFamily: "'Space Mono',monospace", lineHeight: 1.7 }}>{pred.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#12152A"/>
      <rect width="36" height="36" rx="10" fill="url(#lg)" opacity="0.6"/>
      <circle cx="18" cy="18" r="11" stroke="#5B7FFF" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="18" cy="18" r="7" fill="#5B7FFF"/>
      <text x="18" y="22" textAnchor="middle" fill="#F0B429" fontSize="9" fontWeight="900" fontFamily="monospace">★</text>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B7FFF" stopOpacity="0.3"/>
          <stop offset="1" stopColor="#F0B429" stopOpacity="0.1"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { draws, loading, error, addDraw, deleteDraw, toggleExclude } = useDraws()
  const [tab, setTab] = useState<'draws' | 'analysis' | 'stats' | 'predictions' | 'bets'>('draws')
  const [formNumbers, setFormNumbers] = useState<number[]>([])
  const [formStars, setFormStars]     = useState<number[]>([])
  const [formJackpot, setFormJackpot] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [formError, setFormError]     = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [expandedPred, setExpandedPred] = useState<number | null>(0)
  const [filterYear, setFilterYear] = useState<string>('all')

  const activeDraws = useMemo(() => draws.filter(d => !d.excluded), [draws])
  const analysis  = useMemo(() => analyzeDraws(activeDraws), [activeDraws])
  const years = useMemo(() => {
    const ys = [...new Set(draws.map(d => d.date?.slice(0,4)).filter(Boolean))].sort().reverse()
    return ys
  }, [draws])
  const filteredDraws = useMemo(() =>
    filterYear === 'all' ? draws : draws.filter(d => d.date?.startsWith(filterYear))
  , [draws, filterYear])
  const positions = useMemo(() => analyzePositions(activeDraws), [activeDraws])
  const topPicks  = useMemo(() => getTopPicks(activeDraws), [activeDraws])

  const handleSubmit = async () => {
    if (formNumbers.length !== 5) { setFormError('Selecciona exactamente 5 números'); return }
    if (formStars.length !== 2)   { setFormError('Selecciona exactamente 2 estrellas'); return }
    setFormError(''); setSubmitting(true)
    try {
      await addDraw({ numbers: formNumbers, stars: formStars, jackpot: formJackpot || '' })
      setFormNumbers([]); setFormStars([]); setFormJackpot(''); setShowForm(false)
    } catch { setFormError('Error guardando en Firebase.') }
    finally  { setSubmitting(false) }
  }

  const tabs = [
    { id: 'draws',       label: 'Sorteos',     icon: <Trophy size={14} /> },
    { id: 'analysis',    label: 'Análisis',    icon: <BarChart3 size={14} /> },
    { id: 'stats',       label: 'Stats',       icon: <Star size={14} /> },
    { id: 'predictions', label: 'Predicciones',icon: <TrendingUp size={14} /> },
    { id: 'bets',        label: 'Mis Boletos', icon: <TicketIcon size={14} /> },
  ] as const

  const S: Record<string, React.CSSProperties> = {
    card:    { padding: '16px', borderRadius: 14, background: 'var(--bg3)', border: '1px solid var(--border)' },
    label:   { fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
    section: { fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 12px' }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo />
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <span style={{ color: 'var(--blue)' }}>Lucky</span><span style={{ color: 'var(--gold)' }}>Lab</span>
                </h1>
                <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginTop: 1 }}>
                  {activeDraws.length}/{draws.length} en análisis
                </p>
              </div>
            </div>
            {/* CTA */}
            <button onClick={() => setShowForm(!showForm)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: showForm ? 'var(--bg5)' : 'var(--blue)',
              color: '#fff', transition: 'all 0.2s',
              WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
              boxShadow: showForm ? 'none' : '0 3px 14px rgba(91,127,255,0.4)',
            }}>
              {showForm ? <><X size={13} />Cerrar</> : <><PlusCircle size={13} />Agregar</>}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px',
                background: 'none', border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
                color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.2)', color: 'var(--red)', fontSize: 13 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600 }}>Error de conexión Firebase</p>
              <p style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Verifica las credenciales en src/firebase.ts</p>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {showForm && (
          <div className="fu" style={{ ...S.card, border: '1px solid rgba(91,127,255,0.2)', boxShadow: '0 0 32px rgba(91,127,255,0.06)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Registrar sorteo</h2>

            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Bote (opcional)</label>
              <input type="text" placeholder="ej. 130M€" value={formJackpot} onChange={e => setFormJackpot(e.target.value)} style={{
                width: '100%', padding: '9px 12px', background: 'var(--bg4)',
                border: '1px solid var(--border)', borderRadius: 9,
                color: 'var(--t1)', fontSize: 13, outline: 'none', fontFamily: "'Space Mono',monospace",
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 14, background: 'var(--bg4)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <NumberPicker max={50} count={5} selected={formNumbers} onChange={setFormNumbers} label="Números (1-50)" />
              </div>
              <div style={{ padding: 14, background: 'var(--bg4)', borderRadius: 10, border: '1px solid rgba(240,180,41,0.12)' }}>
                <NumberPicker max={12} count={2} selected={formStars} onChange={setFormStars} label="Estrellas (1-12)" />
              </div>
            </div>

            {(formNumbers.length > 0 || formStars.length > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '14px 0 2px', padding: '10px 12px', background: 'var(--bg4)', borderRadius: 9 }}>
                {formNumbers.map(n => <Ball key={n} n={n} size="md" />)}
                {formStars.length > 0 && <span style={{ color: 'var(--t3)', margin: '0 4px' }}>·</span>}
                {formStars.map(n => <Ball key={n} n={n} type="star" size="md" />)}
              </div>
            )}

            {formError && <p style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'Space Mono',monospace", marginTop: 10 }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSubmit} disabled={submitting} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9,
                border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                boxShadow: '0 3px 14px rgba(91,127,255,0.35)',
              }}>
                {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={14} />}
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', borderRadius: 9, background: 'var(--bg5)', border: '1px solid var(--border)', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--t3)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12 }}>Conectando...</span>
          </div>
        )}

        {/* ── Sorteos ── */}
        {!loading && tab === 'draws' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draws.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🎰</div>
                <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Sin sorteos registrados</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Agrega el primer resultado arriba</p>
              </div>
            ) : <>
              {/* Year filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Año:</span>
                {['all', ...years].map(y => (
                  <button key={y} onClick={() => setFilterYear(y)} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 600,
                    background: filterYear === y ? 'var(--blue)' : 'var(--bg4)',
                    color: filterYear === y ? '#fff' : 'var(--t3)',
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                  }}>{y === 'all' ? 'Todos' : y}</button>
                ))}
                <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginLeft: 'auto' }}>
                  {filteredDraws.length} sorteos
                </span>
              </div>
              {filteredDraws.map((d: any, i: number) => (
                <DrawCard key={d.id} draw={d} index={i}
                  onDelete={() => d.id && deleteDraw(d.id)}
                  onToggleExclude={() => d.id && toggleExclude(d.id, !!d.excluded)}
                />
              ))}
            </>}
          </div>
        )}

        {/* ── Análisis ── */}
        {!loading && tab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {draws.length < 3 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
                <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Mínimo 3 sorteos para analizar</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Tienes {draws.length} actualmente</p>
              </div>
            ) : <>
              {/* Stats */}
              <div className="fu" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: 'Sorteos', value: draws.length, color: 'var(--blue)' },
                  { label: 'Gap prom.', value: analysis.averageGap.toFixed(1), color: 'var(--gold)' },
                  { label: 'Pares top', value: analysis.mostCommonPairs.length, color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ ...S.card, textAlign: 'center' }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginTop: 4, textTransform: 'uppercase' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Hot / Cold */}
              <div className="fu2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ ...S.card, border: '1px solid rgba(255,140,60,0.15)' }}>
                  <p style={{ ...S.section as any }}><Flame size={13} color="#FF8C3C" /> Calientes</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {analysis.hotNumbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}
                  </div>
                </div>
                <div style={{ ...S.card, border: '1px solid rgba(79,160,240,0.15)' }}>
                  <p style={{ ...S.section as any }}><Snowflake size={13} color="#4FA0F0" /> Fríos</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {analysis.coldNumbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}
                  </div>
                </div>
              </div>

              {/* Stars */}
              <div className="fu3" style={{ ...S.card, border: '1px solid rgba(240,180,41,0.15)' }}>
                <p style={{ ...S.section as any }}><Star size={13} color="var(--gold)" /> Estrellas</p>
                <div style={{ display: 'flex', gap: 28 }}>
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frecuentes</p>
                    <div style={{ display: 'flex', gap: 5 }}>{analysis.hotStars.map((n: number) => <Ball key={n} n={n} type="star" size="sm" />)}</div>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Raras</p>
                    <div style={{ display: 'flex', gap: 5 }}>{analysis.coldStars.map((n: number) => <Ball key={n} n={n} type="star" size="sm" />)}</div>
                  </div>
                </div>
              </div>

              {/* Pairs */}
              {analysis.mostCommonPairs.length > 0 && (
                <div style={S.card}>
                  <p style={{ ...S.section as any }}>Pares frecuentes</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {analysis.mostCommonPairs.map(([a, b]: [number, number], i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                        <Ball n={a} size="sm" /><span style={{ color: 'var(--t3)', fontSize: 11 }}>+</span><Ball n={b} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Frecuencia por posición */}
              <div style={S.card}>
                <p style={{ ...S.section as any }}>Frecuencia por posición</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {positions.numbers.map(pos => (
                    <div key={pos.position}>
                      <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                        Posición {pos.position}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        {pos.top.map(({ n, pct }: { n: number, pct: number }) => (
                          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: 'var(--blue)', fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{pct}%</span>
                            <Ball n={n} size="sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Estrellas por posición</p>
                    <div style={{ display: 'flex', gap: 24 }}>
                      {positions.stars.map(pos => (
                        <div key={pos.position}>
                          <p style={{ fontSize: 9, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 7 }}>Posición {pos.position}</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            {pos.top.map(({ n, pct }: { n: number, pct: number }) => (
                              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{pct}%</span>
                                <Ball n={n} type="star" size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>}
          </div>
        )}

        {/* ── Stats ── */}
        {!loading && tab === 'stats' && <StatsTab draws={activeDraws} />}

        {/* ── Mis Boletos ── */}
        {!loading && tab === 'bets' && <BetsTab />}

        {/* ── Predicciones ── */}
        {!loading && tab === 'predictions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draws.length < 3 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🔮</div>
                <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Mínimo 3 sorteos para predecir</p>
              </div>
            ) : <>
              {/* Top Picks */}
              {topPicks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: 'var(--t2)', fontFamily: "'Space Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>⭐ Top 3 combinaciones sugeridas</p>
                  {topPicks.map((pick, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: i === 0 ? 'rgba(91,127,255,0.08)' : 'var(--bg3)', border: i === 0 ? '1px solid rgba(91,127,255,0.3)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{pick.label}</p>
                        <span style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: i === 0 ? 'var(--blue)' : 'var(--t3)', fontWeight: 700 }}>score {pick.score}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {pick.numbers.map((n: number) => <Ball key={n} n={n} size="md" />)}
                        <span style={{ color: 'var(--t3)', margin: '0 4px', fontSize: 16 }}>·</span>
                        {pick.stars.map((n: number) => <Ball key={n} n={n} type="star" size="md" />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.12)' }}>
                <AlertTriangle size={12} color="var(--gold)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 10, color: 'var(--gold)', fontFamily: "'Space Mono',monospace", lineHeight: 1.6 }}>
                  Análisis estadístico — la lotería es aleatoria. Juega con responsabilidad.
                </p>
              </div>
              {analysis.predictions.map((pred: any, i: number) => (
                <PredCard key={i} pred={pred} index={i} expanded={expandedPred === i} onToggle={() => setExpandedPred(expandedPred === i ? null : i)} />
              ))}
            </>}
          </div>
        )}
      </main>
    </div>
  )
}
