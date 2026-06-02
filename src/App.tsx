import { useState, useMemo } from 'react'
import { useDraws } from './hooks/useDraws'
import { analyzeDraws } from './utils/analysis'
import { Draw } from './types'
import {
  PlusCircle, Trash2, TrendingUp, Star, BarChart3,
  ChevronDown, ChevronUp, Loader2, Flame, Snowflake,
  Trophy, AlertTriangle, RefreshCw
} from 'lucide-react'

// ─── Ball Components ──────────────────────────────────────────────────────────
function Ball({ n, type = 'number', size = 'md' }: { n: number, type?: 'number' | 'star', size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold font-mono ${sizes[size]} ${
      type === 'star'
        ? 'bg-amber-400 text-amber-900 shadow-amber'
        : 'bg-indigo-600 text-white shadow-indigo'
    }`}>
      {n < 10 ? `0${n}` : n}
    </span>
  )
}

// ─── NumberPicker ─────────────────────────────────────────────────────────────
function NumberPicker({ max, count, selected, onChange, label }: {
  max: number, count: number, selected: number[], onChange: (v: number[]) => void, label: string
}) {
  const toggle = (n: number) => {
    if (selected.includes(n)) onChange(selected.filter(x => x !== n))
    else if (selected.length < count) onChange([...selected, n].sort((a, b) => a - b))
  }
  return (
    <div>
      <p className="text-xs text-indigo-300 mb-2 font-mono uppercase tracking-widest">
        {label} — Selecciona {count} {selected.length > 0 && <span className="text-amber-400">({selected.length}/{count})</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const sel = selected.includes(n)
          const disabled = !sel && selected.length >= count
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              disabled={disabled}
              className={`w-8 h-8 text-xs rounded-full font-bold font-mono transition-all duration-150 ${
                sel
                  ? max === 12
                    ? 'bg-amber-400 text-amber-900 scale-110'
                    : 'bg-indigo-500 text-white scale-110'
                  : disabled
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {n < 10 ? `0${n}` : n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── DrawCard ─────────────────────────────────────────────────────────────────
function DrawCard({ draw, onDelete }: { draw: Draw, onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 group hover:border-indigo-500/30 transition-all">
      <div className="text-xs text-gray-500 font-mono w-20 shrink-0">{draw.date}</div>
      <div className="flex gap-1.5 flex-wrap flex-1">
        {draw.numbers.map(n => <Ball key={n} n={n} size="sm" />)}
        <span className="text-gray-600 mx-1">·</span>
        {draw.stars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
      </div>
      {draw.jackpot && <div className="text-xs text-amber-400/70 font-mono hidden sm:block">{draw.jackpot}</div>}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { draws, loading, error, addDraw, deleteDraw } = useDraws()
  const [tab, setTab] = useState<'draws' | 'analysis' | 'predictions'>('draws')

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formNumbers, setFormNumbers] = useState<number[]>([])
  const [formStars, setFormStars] = useState<number[]>([])
  const [formJackpot, setFormJackpot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Predictions expand state
  const [expandedPred, setExpandedPred] = useState<number | null>(0)

  const analysis = useMemo(() => analyzeDraws(draws), [draws])

  const handleSubmit = async () => {
    if (!formDate) { setFormError('Selecciona una fecha'); return }
    if (formNumbers.length !== 5) { setFormError('Selecciona exactamente 5 números'); return }
    if (formStars.length !== 2) { setFormError('Selecciona exactamente 2 estrellas'); return }
    setFormError('')
    setSubmitting(true)
    try {
      await addDraw({ date: formDate, numbers: formNumbers, stars: formStars, jackpot: formJackpot || undefined })
      setFormDate(''); setFormNumbers([]); setFormStars([]); setFormJackpot('')
      setShowForm(false)
    } catch {
      setFormError('Error guardando. Revisa tu configuración de Firebase.')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { id: 'draws', label: 'Sorteos', icon: <Trophy size={16} /> },
    { id: 'analysis', label: 'Análisis', icon: <BarChart3 size={16} /> },
    { id: 'predictions', label: 'Predicciones', icon: <TrendingUp size={16} /> },
  ] as const

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>
              <span className="text-indigo-400">Lucky</span>
              <span className="text-amber-400">Lab</span>
              <span className="text-gray-500 text-sm font-mono ml-2">Analyzer</span>
            </h1>
            <p className="text-xs text-gray-600 font-mono">{draws.length} sorteos registrados</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition-colors"
          >
            <PlusCircle size={16} />
            Agregar
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Error Firebase */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
            <AlertTriangle size={16} />
            <div>
              <p className="font-bold">Error de conexión con Firebase</p>
              <p className="text-xs text-red-400 mt-0.5">Configura tu archivo <code className="bg-red-800/40 px-1 rounded">src/firebase.ts</code> con tus credenciales reales.</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="p-5 rounded-2xl bg-gray-900 border border-indigo-500/30 space-y-5">
            <h2 className="font-black text-lg text-indigo-300">Registrar Sorteo</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-mono uppercase tracking-widest block mb-1">Fecha</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-mono uppercase tracking-widest block mb-1">Bote (opcional)</label>
                <input
                  type="text"
                  placeholder="ej. 130M€"
                  value={formJackpot}
                  onChange={e => setFormJackpot(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <NumberPicker
              max={50} count={5} selected={formNumbers}
              onChange={setFormNumbers} label="Números (1-50)"
            />
            <NumberPicker
              max={12} count={2} selected={formStars}
              onChange={setFormStars} label="Estrellas (1-12)"
            />

            {/* Preview */}
            {(formNumbers.length > 0 || formStars.length > 0) && (
              <div className="flex items-center gap-2 py-2">
                {formNumbers.map(n => <Ball key={n} n={n} size="sm" />)}
                {formStars.length > 0 && <span className="text-gray-600">·</span>}
                {formStars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
              </div>
            )}

            {formError && <p className="text-red-400 text-xs font-mono">{formError}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-colors"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 size={24} className="animate-spin mr-3" />
            <span className="font-mono">Cargando sorteos...</span>
          </div>
        )}

        {/* TAB: Sorteos */}
        {!loading && tab === 'draws' && (
          <div className="space-y-3">
            {draws.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <Trophy size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">Sin sorteos registrados.</p>
                <p className="text-xs mt-1">Agrega el primer sorteo con el botón de arriba.</p>
              </div>
            ) : draws.map(d => (
              <DrawCard key={d.id} draw={d} onDelete={() => d.id && deleteDraw(d.id)} />
            ))}
          </div>
        )}

        {/* TAB: Análisis */}
        {!loading && tab === 'analysis' && (
          <div className="space-y-6">
            {draws.length < 3 ? (
              <div className="text-center py-16 text-gray-600">
                <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">Necesitas al menos 3 sorteos para el análisis.</p>
                <p className="text-xs mt-1">Actualmente tienes {draws.length}.</p>
              </div>
            ) : (
              <>
                {/* Hot/Cold numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-orange-400 mb-3">
                      <Flame size={16} /> Números Calientes
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.hotNumbers.map(n => <Ball key={n} n={n} size="sm" />)}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-3">
                      <Snowflake size={16} /> Números Fríos
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.coldNumbers.map(n => <Ball key={n} n={n} size="sm" />)}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-3">
                    <Star size={16} /> Estrellas
                  </h3>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-2">MÁS FRECUENTES</p>
                      <div className="flex gap-1.5">
                        {analysis.hotStars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-2">MENOS FRECUENTES</p>
                      <div className="flex gap-1.5">
                        {analysis.coldStars.map(n => <Ball key={n} n={n} type="star" size="sm" />)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Total sorteos', value: draws.length },
                    { label: 'Gap promedio', value: analysis.averageGap.toFixed(1) },
                    { label: 'Pares freq.', value: analysis.mostCommonPairs.length },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <p className="text-2xl font-black text-indigo-400">{s.value}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Common pairs */}
                {analysis.mostCommonPairs.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">Pares más frecuentes</h3>
                    <div className="flex flex-wrap gap-3">
                      {analysis.mostCommonPairs.map(([a, b], i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-lg">
                          <Ball n={a} size="sm" />
                          <span className="text-gray-500 text-xs">+</span>
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

        {/* TAB: Predicciones */}
        {!loading && tab === 'predictions' && (
          <div className="space-y-3">
            {draws.length < 3 ? (
              <div className="text-center py-16 text-gray-600">
                <TrendingUp size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">Necesitas al menos 3 sorteos para predecir.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                  <AlertTriangle size={12} />
                  Las predicciones son estadísticas. El Euromillones es aleatorio — juega con responsabilidad.
                </div>
                {analysis.predictions.map((pred, i) => (
                  <div key={i} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
                    <button
                      onClick={() => setExpandedPred(expandedPred === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{pred.strategy.split(' ')[0]}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold">{pred.strategy.slice(pred.strategy.indexOf(' ') + 1)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                style={{ width: `${pred.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-mono">{pred.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex gap-1">
                          {pred.numbers.map(n => <Ball key={n} n={n} size="sm" />)}
                        </div>
                        {expandedPred === i ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </button>

                    {expandedPred === i && (
                      <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-3">
                        <p className="text-xs text-gray-400">{pred.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {pred.numbers.map(n => <Ball key={n} n={n} size="md" />)}
                          <span className="text-gray-600 mx-1">·</span>
                          {pred.stars.map(n => <Ball key={n} n={n} type="star" size="md" />)}
                        </div>
                        <div className="p-3 bg-gray-800/60 rounded-xl">
                          <p className="text-xs text-gray-400 font-mono leading-relaxed">
                            <RefreshCw size={10} className="inline mr-1 opacity-50" />
                            {pred.reasoning}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
