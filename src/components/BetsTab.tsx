import { useState } from 'react'
import { useBets, Bet } from '../hooks/useBets'
import Ball from './Ball'
import { PlusCircle, Trash2, CheckCircle, Loader2, X } from 'lucide-react'

// ─── NumberPicker ─────────────────────────────────────────────────────────────
function NumberPicker({ max, count, selected, onChange }: {
  max: number, count: number, selected: number[], onChange: (v: number[]) => void
}) {
  const isStar = max === 12
  const toggle = (n: number) => {
    if (selected.includes(n)) onChange(selected.filter(x => x !== n))
    else if (selected.length < count) onChange([...selected, n].sort((a, b) => a - b))
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => {
        const sel = selected.includes(n)
        const disabled = !sel && selected.length >= count
        return (
          <button key={n} onClick={() => toggle(n)} disabled={disabled} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transform: sel ? 'scale(1.12)' : 'scale(1)', transition: 'all 0.12s',
            background: sel ? (isStar ? 'var(--gold)' : 'var(--blue)') : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)',
            color: sel ? (isStar ? '#1a0e00' : '#fff') : disabled ? 'var(--t3)' : 'var(--t2)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>{n < 10 ? `0${n}` : n}</button>
        )
      })}
    </div>
  )
}

// ─── EvalForm — estado propio por boleto ──────────────────────────────────────
function EvalForm({ bet, onDone }: { bet: Bet & { id: string }, onDone: () => void }) {
  const { evaluateBet } = useBets()
  const [nums, setNums] = useState<number[]>([])
  const [stars, setStars] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const ready = nums.length === 5 && stars.length === 2

  const handleEval = async () => {
    if (!ready) return
    setLoading(true)
    await evaluateBet(bet.id, nums, stars, bet)
    onDone()
    setLoading(false)
  }

  return (
    <div style={{
      marginTop: 6, padding: '14px 16px', borderRadius: 12,
      background: 'var(--bg4)', border: '1px solid rgba(78,203,160,0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>¿Cuáles fueron los números ganadores?</p>
        <button onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 12, background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
            Números ganadores ({nums.length}/5)
          </p>
          <NumberPicker max={50} count={5} selected={nums} onChange={setNums} />
        </div>
        <div style={{ padding: 12, background: 'var(--bg3)', borderRadius: 9, border: '1px solid rgba(240,180,41,0.15)' }}>
          <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
            Estrellas ganadoras ({stars.length}/2)
          </p>
          <NumberPicker max={12} count={2} selected={stars} onChange={setStars} />
        </div>
        {/* Preview */}
        {(nums.length > 0 || stars.length > 0) && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {nums.map(n => <Ball key={n} n={n} size="sm" />)}
            {stars.length > 0 && <span style={{ color: 'var(--t3)', margin: '0 3px' }}>·</span>}
            {stars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
          </div>
        )}
        <button onClick={handleEval} disabled={loading || !ready} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
          borderRadius: 9, border: 'none',
          background: ready ? 'var(--green)' : 'var(--bg5)',
          color: ready ? '#fff' : 'var(--t3)',
          fontSize: 13, fontWeight: 600, cursor: ready ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.6 : 1, width: 'fit-content', touchAction: 'manipulation',
        }}>
          {loading
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <CheckCircle size={13} />}
          Calcular resultado
        </button>
      </div>
    </div>
  )
}

// ─── BetCard ──────────────────────────────────────────────────────────────────
function BetCard({ bet, onDelete }: { bet: any, onDelete: () => void }) {
  const [showEval, setShowEval] = useState(false)
  const hasResult = !!bet.result
  const isWin = hasResult && !bet.result.prize.includes('❌')

  return (
    <div>
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'var(--bg3)',
        border: `1px solid ${hasResult ? (isWin ? 'rgba(78,203,160,0.3)' : 'rgba(255,92,92,0.2)') : 'var(--border)'}`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>
            {new Date(bet.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!hasResult && (
              <button onClick={() => setShowEval(!showEval)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
                border: '1px solid rgba(78,203,160,0.3)', background: showEval ? 'rgba(78,203,160,0.15)' : 'rgba(78,203,160,0.07)',
                color: 'var(--green)', fontSize: 11, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation',
              }}>
                <CheckCircle size={11} /> {showEval ? 'Cerrar' : 'Evaluar'}
              </button>
            )}
            <button onClick={onDelete} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t3)', padding: 4, touchAction: 'manipulation',
            }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Números del boleto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {bet.numbers.map((n: number) => <Ball key={n} n={n} size="sm" />)}
          <span style={{ color: 'var(--t3)', margin: '0 3px' }}>·</span>
          {bet.stars.map((n: number) => <Ball key={n} n={n} type="star" size="sm" />)}
        </div>

        {/* Resultado */}
        {hasResult && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 9,
            background: isWin ? 'rgba(78,203,160,0.08)' : 'rgba(255,92,92,0.06)',
            border: `1px solid ${isWin ? 'rgba(78,203,160,0.2)' : 'rgba(255,92,92,0.15)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: isWin ? 'var(--green)' : 'var(--red)' }}>
                {bet.result.prize}
              </span>
              <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: "'Space Mono',monospace" }}>
                {bet.result.numbersHit}/5 nums · {bet.result.starsHit}/2 ⭐
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de evaluación */}
      {showEval && !hasResult && (
        <EvalForm bet={bet} onDone={() => setShowEval(false)} />
      )}
    </div>
  )
}

// ─── NewBetForm ───────────────────────────────────────────────────────────────
function NewBetForm({ onClose }: { onClose: () => void }) {
  const { addBet } = useBets()
  const [nums, setNums] = useState<number[]>([])
  const [stars, setStars] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const ready = nums.length === 5 && stars.length === 2

  const handleSave = async () => {
    if (!ready) return
    setSaving(true)
    await addBet({ numbers: nums, stars })
    onClose()
    setSaving(false)
  }

  return (
    <div style={{ padding: '16px', borderRadius: 14, background: 'var(--bg3)', border: '1px solid rgba(91,127,255,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700 }}>Nuevo boleto</p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4 }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 12, background: 'var(--bg4)', borderRadius: 9, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
            Números (1-50) — {nums.length}/5
          </p>
          <NumberPicker max={50} count={5} selected={nums} onChange={setNums} />
        </div>
        <div style={{ padding: 12, background: 'var(--bg4)', borderRadius: 9, border: '1px solid rgba(240,180,41,0.12)' }}>
          <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
            Estrellas (1-12) — {stars.length}/2
          </p>
          <NumberPicker max={12} count={2} selected={stars} onChange={setStars} />
        </div>
        {ready && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', background: 'var(--bg4)', borderRadius: 9 }}>
            {nums.map(n => <Ball key={n} n={n} size="sm" />)}
            <span style={{ color: 'var(--t3)', margin: '0 3px' }}>·</span>
            {stars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving || !ready} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9,
            border: 'none', background: ready ? 'var(--blue)' : 'var(--bg5)',
            color: ready ? '#fff' : 'var(--t3)', fontSize: 13, fontWeight: 600,
            cursor: ready ? 'pointer' : 'not-allowed', opacity: saving ? 0.6 : 1,
            touchAction: 'manipulation',
          }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={13} />}
            Guardar boleto
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BetsTab ──────────────────────────────────────────────────────────────────
export default function BetsTab() {
  const { bets, loading, deleteBet } = useBets()
  const [showForm, setShowForm] = useState(false)

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, color: 'var(--t2)', flex: 1, marginRight: 12 }}>
          Guarda tus boletos y evalúalos después del sorteo.
        </p>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
          border: 'none', background: showForm ? 'var(--bg5)' : 'var(--blue)',
          color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
        }}>
          {showForm ? <X size={13} /> : <PlusCircle size={13} />}
          {showForm ? 'Cerrar' : 'Nuevo boleto'}
        </button>
      </div>

      {showForm && <NewBetForm onClose={() => setShowForm(false)} />}

      {bets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎫</div>
          <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Sin boletos guardados</p>
          <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Agrega tu próxima combinación antes del sorteo</p>
        </div>
      ) : bets.map((bet: any) => (
        <BetCard key={bet.id} bet={bet} onDelete={() => bet.id && deleteBet(bet.id)} />
      ))}
    </div>
  )
}
