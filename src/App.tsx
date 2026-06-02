import { useState, useMemo } from 'react'
import { useDraws } from './hooks/useDraws'
import { analyzeDraws } from './utils/analysis'
import { Draw } from './types'
import {
  PlusCircle, Trash2, TrendingUp, Star, BarChart3,
  ChevronDown, ChevronUp, Loader2, Flame, Snowflake,
  Trophy, AlertTriangle, X
} from 'lucide-react'

// ─── Ball ────────────────────────────────────────────────────────────────────
function Ball({ n, type = 'number', size = 'md', pulse = false }: {
  n: number, type?: 'number' | 'star', size?: 'sm' | 'md' | 'lg', pulse?: boolean
}) {
  const sz = { sm: { w: 34, fs: 11 }, md: { w: 42, fs: 14 }, lg: { w: 52, fs: 17 } }[size]
  const isStar = type === 'star'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: sz.w, height: sz.w, borderRadius: '50%',
      fontSize: sz.fs, fontFamily: "'Space Mono', monospace", fontWeight: 700,
      background: isStar
        ? 'linear-gradient(135deg, #F5C842, #E8A820)'
        : 'linear-gradient(135deg, #4F6EF7, #3451D1)',
      color: isStar ? '#3A2800' : '#fff',
      boxShadow: isStar
        ? '0 2px 12px rgba(245,200,66,0.45), inset 0 1px 0 rgba(255,255,255,0.3)'
        : '0 2px 12px rgba(79,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
      flexShrink: 0,
      animation: pulse ? 'pulse-ring 2s infinite' : undefined,
      userSelect: 'none',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
        <span style={{ fontSize: 11, color: isStar ? 'var(--gold)' : 'var(--blue)', fontFamily: "'Space Mono', monospace" }}>{selected.length}/{count}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const sel = selected.includes(n)
          const disabled = !sel && selected.length >= count
          return (
            <button key={n} onClick={() => toggle(n)} disabled={disabled} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              transform: sel ? 'scale(1.12)' : 'scale(1)',
              background: sel
                ? isStar
                  ? 'linear-gradient(135deg, #F5C842, #E8A820)'
                  : 'linear-gradient(135deg, #4F6EF7, #3451D1)'
                : disabled
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.07)',
              color: sel
                ? isStar ? '#3A2800' : '#fff'
                : disabled ? 'var(--text-3)' : 'var(--text-2)',
              boxShadow: sel
                ? isStar
                  ? '0 2px 10px rgba(245,200,66,0.4)'
                  : '0 2px 10px rgba(79,110,247,0.4)'
                : 'none',
            }}>
              {n < 10 ? `0${n}` : n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── DrawCard ─────────────────────────────────────────────────────────────────
function DrawCard({ draw, onDelete, index }: { draw: Draw, onDelete: () => void, index: number }) {
  return (
    <div className="fade-up" style={{
      animationDelay: `${index * 0.04}s`,
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', borderRadius: 14,
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      transition: 'border-color 0.2s, background 0.2s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'
      ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface3)'
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
      ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'
    }}>
      {/* Date */}
      <div style={{ minWidth: 80 }}>
        <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em' }}>
          {draw.date}
        </p>
        {draw.jackpot && (
          <p style={{ fontSize: 10, color: 'var(--gold)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
            {draw.jackpot}
          </p>
        )}
      </div>

      {/* Balls */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
        {draw.numbers.map(n => <Ball key={n} n={n} size="sm" />)}
        <span style={{ color: 'var(--text-3)', margin: '0 4px' }}>·</span>
        {draw.stars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
      </div>

      {/* Delete */}
      <button onClick={onDelete} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-3)', padding: 4, borderRadius: 6,
        transition: 'color 0.15s', opacity: 0.6,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string, value: string | number, accent?: string }) {
  return (
    <div style={{
      padding: '20px 18px', borderRadius: 16,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      textAlign: 'center'
    }}>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent || 'var(--blue)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

// ─── PredictionCard ───────────────────────────────────────────────────────────
function PredictionCard({ pred, index, expanded, onToggle }: {
  pred: any, index: number, expanded: boolean, onToggle: () => void
}) {
  const emoji = pred.strategy.split(' ')[0]
  const name = pred.strategy.slice(pred.strategy.indexOf(' ') + 1)
  const confColor = pred.confidence >= 58 ? 'var(--green)' : pred.confidence >= 50 ? 'var(--gold)' : 'var(--text-3)'

  return (
    <div className="fade-up" style={{
      animationDelay: `${index * 0.05}s`,
      borderRadius: 16,
      background: expanded ? 'var(--surface3)' : 'var(--surface2)',
      border: `1px solid ${expanded ? 'rgba(79,110,247,0.3)' : 'var(--border)'}`,
      overflow: 'hidden', transition: 'all 0.25s ease',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '14px 18px',
        background: 'none', border: 'none', cursor: 'pointer', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <div style={{ height: 4, width: 80, background: 'var(--surface4)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pred.confidence}%`,
                  background: confColor, borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 11, color: confColor, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{pred.confidence}%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {pred.numbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}
          </div>
          <span style={{ color: 'var(--text-3)' }}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '16px 18px 18px',
          borderTop: '1px solid var(--border)',
          animation: 'fadeUp 0.25s ease both',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>{pred.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {pred.numbers.map((n: number) => <Ball key={n} n={n} size="md" pulse />)}
            <span style={{ color: 'var(--text-3)', margin: '0 6px', fontSize: 20 }}>·</span>
            {pred.stars.map((n: number) => <Ball key={n} n={n} type="star" size="md" />)}
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, fontFamily: "'Space Mono', monospace" }}>
              {pred.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { draws, loading, error, addDraw, deleteDraw } = useDraws()
  const [tab, setTab] = useState<'draws' | 'analysis' | 'predictions'>('draws')
  const [formNumbers, setFormNumbers] = useState<number[]>([])
  const [formStars, setFormStars] = useState<number[]>([])
  const [formJackpot, setFormJackpot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedPred, setExpandedPred] = useState<number | null>(0)

  const analysis = useMemo(() => analyzeDraws(draws), [draws])

  const handleSubmit = async () => {
    if (formNumbers.length !== 5) { setFormError('Selecciona exactamente 5 números'); return }
    if (formStars.length !== 2) { setFormError('Selecciona exactamente 2 estrellas'); return }
    setFormError('')
    setSubmitting(true)
    try {
      await addDraw({ numbers: formNumbers, stars: formStars, jackpot: formJackpot || undefined })
      setFormNumbers([]); setFormStars([]); setFormJackpot('')
      setShowForm(false)
    } catch {
      setFormError('Error guardando. Revisa tu configuración de Firebase.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'draws', label: 'Sorteos', icon: <Trophy size={15} /> },
    { id: 'analysis', label: 'Análisis', icon: <BarChart3 size={15} /> },
    { id: 'predictions', label: 'Predicciones', icon: <TrendingUp size={15} /> },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0B0D1F 0%, var(--surface) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0,
        position: 'sticky', top: 0, zIndex: 20,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Logo */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, #4F6EF7, #F5C842)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 4px 16px rgba(79,110,247,0.3)',
              }}>🎯</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <span style={{ color: 'var(--blue)' }}>Lucky</span>
                  <span style={{ color: 'var(--gold)' }}>Lab</span>
                </h1>
                <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {draws.length} sorteo{draws.length !== 1 ? 's' : ''} · euromillones
                </p>
              </div>
            </div>

            <button onClick={() => setShowForm(!showForm)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10,
              background: showForm ? 'var(--surface4)' : 'linear-gradient(135deg, #4F6EF7, #3451D1)',
              border: showForm ? '1px solid var(--border)' : 'none',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: showForm ? 'none' : '0 4px 16px rgba(79,110,247,0.35)',
              transition: 'all 0.2s ease',
            }}>
              {showForm ? <X size={14} /> : <PlusCircle size={14} />}
              {showForm ? 'Cerrar' : 'Agregar sorteo'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: '8px 8px 0 0',
                background: tab === t.id ? 'var(--surface2)' : 'none',
                border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
                borderBottom: tab === t.id ? '1px solid var(--surface2)' : '1px solid transparent',
                color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s ease',
                marginBottom: -1,
              }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Firebase error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(240,92,92,0.1)', border: '1px solid rgba(240,92,92,0.25)',
            color: 'var(--red)', fontSize: 13,
          }}>
            <AlertTriangle size={16} />
            <div>
              <p style={{ fontWeight: 600 }}>Error de conexión Firebase</p>
              <p style={{ fontSize: 11, color: 'rgba(240,92,92,0.7)', marginTop: 2 }}>Verifica las credenciales en src/firebase.ts</p>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {showForm && (
          <div className="fade-up" style={{
            padding: '22px', borderRadius: 18,
            background: 'var(--surface2)',
            border: '1px solid rgba(79,110,247,0.25)',
            boxShadow: '0 0 40px rgba(79,110,247,0.08)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>
              Registrar sorteo
            </h2>

            {/* Jackpot */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Bote (opcional)
              </label>
              <input type="text" placeholder="ej. 130M€" value={formJackpot} onChange={e => setFormJackpot(e.target.value)} style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--surface3)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-1)', fontSize: 13,
                outline: 'none', fontFamily: "'Space Mono', monospace",
              }} />
            </div>

            {/* Number pickers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ padding: '16px', background: 'var(--surface3)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <NumberPicker max={50} count={5} selected={formNumbers} onChange={setFormNumbers} label="Números principales (1-50)" />
              </div>
              <div style={{ padding: '16px', background: 'var(--surface3)', borderRadius: 12, border: '1px solid rgba(245,200,66,0.15)' }}>
                <NumberPicker max={12} count={2} selected={formStars} onChange={setFormStars} label="⭐ Estrellas (1-12)" />
              </div>
            </div>

            {/* Preview */}
            {(formNumbers.length > 0 || formStars.length > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '16px 0 4px', padding: '12px 14px', background: 'var(--surface3)', borderRadius: 10 }}>
                {formNumbers.map(n => <Ball key={n} n={n} size="md" />)}
                {formStars.length > 0 && <span style={{ color: 'var(--text-3)', margin: '0 4px' }}>·</span>}
                {formStars.map(n => <Ball key={n} n={n} type="star" size="md" />)}
              </div>
            )}

            {formError && <p style={{ fontSize: 12, color: 'var(--red)', fontFamily: "'Space Mono', monospace", margin: '10px 0 0' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={handleSubmit} disabled={submitting} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #4F6EF7, #3451D1)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(79,110,247,0.3)',
                transition: 'all 0.2s',
              }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={15} />}
                Guardar sorteo
              </button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '11px 18px', borderRadius: 10,
                background: 'var(--surface4)', border: '1px solid var(--border)',
                color: 'var(--text-2)', fontSize: 14, cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>Cargando sorteos...</span>
          </div>
        )}

        {/* ── TAB: Sorteos ── */}
        {!loading && tab === 'draws' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draws.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎰</div>
                <p style={{ fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Sin sorteos registrados</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Agrega el primer resultado con el botón de arriba</p>
              </div>
            ) : draws.map((d, i) => (
              <DrawCard key={d.id} draw={d} index={i} onDelete={() => d.id && deleteDraw(d.id)} />
            ))}
          </div>
        )}

        {/* ── TAB: Análisis ── */}
        {!loading && tab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {draws.length < 3 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <p style={{ fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Necesitas al menos 3 sorteos</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Actualmente tienes {draws.length}</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <StatCard label="Total sorteos" value={draws.length} accent="var(--blue)" />
                  <StatCard label="Gap promedio" value={analysis.averageGap.toFixed(1)} accent="var(--gold)" />
                  <StatCard label="Pares top" value={analysis.mostCommonPairs.length} accent="var(--green)" />
                </div>

                {/* Hot / Cold */}
                <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Hot */}
                  <div style={{ padding: '18px', borderRadius: 16, background: 'var(--surface2)', border: '1px solid rgba(240,120,60,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(240,120,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={14} color="#F0783C" />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F0783C' }}>Números calientes</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysis.hotNumbers.map(n => <Ball key={n} n={n} size="sm" />)}
                    </div>
                  </div>
                  {/* Cold */}
                  <div style={{ padding: '18px', borderRadius: 16, background: 'var(--surface2)', border: '1px solid rgba(79,160,240,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(79,160,240,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Snowflake size={14} color="#4FA0F0" />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#4FA0F0' }}>Números fríos</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {analysis.coldNumbers.map(n => <Ball key={n} n={n} size="sm" />)}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="fade-up-3" style={{ padding: '18px', borderRadius: 16, background: 'var(--surface2)', border: '1px solid rgba(245,200,66,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,200,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={14} color="var(--gold)" />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>Estrellas</p>
                  </div>
                  <div style={{ display: 'flex', gap: 32 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'Space Mono', monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Más frecuentes</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {analysis.hotStars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'Space Mono', monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Menos frecuentes</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {analysis.coldStars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common pairs */}
                {analysis.mostCommonPairs.length > 0 && (
                  <div style={{ padding: '18px', borderRadius: 16, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>Pares más frecuentes</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {analysis.mostCommonPairs.map(([a, b], i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 10px', borderRadius: 10,
                          background: 'var(--surface3)', border: '1px solid var(--border)'
                        }}>
                          <Ball n={a} size="sm" />
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>+</span>
                          <Ball n={b} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: Predicciones ── */}
        {!loading && tab === 'predictions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {draws.length < 3 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
                <p style={{ fontSize: 14, fontFamily: "'Space Mono', monospace" }}>Necesitas al menos 3 sorteos</p>
              </div>
            ) : (
              <>
                {/* Disclaimer */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.15)',
                  marginBottom: 4,
                }}>
                  <AlertTriangle size={13} color="var(--gold)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'Space Mono', monospace", lineHeight: 1.6 }}>
                    Análisis estadístico — el euromillones es aleatorio. Juega con responsabilidad.
                  </p>
                </div>

                {analysis.predictions.map((pred, i) => (
                  <PredictionCard
                    key={i} pred={pred} index={i}
                    expanded={expandedPred === i}
                    onToggle={() => setExpandedPred(expandedPred === i ? null : i)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input::placeholder { color: var(--text-3); }
      `}</style>
    </div>
  )
}
