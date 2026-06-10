import { useState, useMemo, useEffect } from 'react'
import { useDraws } from './hooks/useDraws'
import { useStrategyScores } from './hooks/useStrategyScores'
import { getAllStrategies, scorePrediction } from './utils/analysis'
import Ball from './components/Ball'
import {
  PlusCircle, Trash2, TrendingUp, Trophy, Loader2, X, Award, ChevronDown, ChevronUp
} from 'lucide-react'

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#12152A"/>
      <circle cx="18" cy="18" r="11" stroke="#5B7FFF" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="18" cy="18" r="7" fill="#5B7FFF"/>
      <text x="18" y="22" textAnchor="middle" fill="#F0B429" fontSize="9" fontWeight="900" fontFamily="monospace">★</text>
    </svg>
  )
}

// ─── NumberPicker ─────────────────────────────────────────────────────────────
function NumberPicker({ max, count, selected, onChange }: {
  max: number, count: number, selected: number[], onChange: (v: number[]) => void
}) {
  const isStar = max === 12
  const toggle = (n: number) => {
    if (selected.includes(n)) onChange(selected.filter(x => x !== n))
    else if (selected.length < count) onChange([...selected, n].sort((a,b)=>a-b))
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {Array.from({ length: max }, (_, i) => i+1).map(n => {
        const sel = selected.includes(n)
        const disabled = !sel && selected.length >= count
        return (
          <button key={n} onClick={() => toggle(n)} disabled={disabled} style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transform: sel ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.1s',
            background: sel ? (isStar?'var(--gold)':'var(--blue)') : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
            color: sel ? (isStar?'#1a0e00':'#fff') : disabled ? 'var(--t3)' : 'var(--t2)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none',
          }}>{n<10?`0${n}`:n}</button>
        )
      })}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { draws, loading, addDraw, deleteDraw } = useDraws()
  const { saveScores, ranking } = useStrategyScores()
  const [tab, setTab] = useState<'predict' | 'ranking' | 'history'>('predict')
  const [showForm, setShowForm] = useState(false)
  const [formNums, setFormNums] = useState<number[]>([])
  const [formStars, setFormStars] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number|null>(0)

  // Análisis diferido
  const [strategies, setStrategies] = useState<ReturnType<typeof getAllStrategies>>([])
  const [lastDrawScores, setLastDrawScores] = useState<Record<string,number>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (draws.length === 0) { setReady(true); return }
    setReady(false)
    const t = setTimeout(() => {
      const allStrats = getAllStrategies(draws)
      setStrategies(allStrats)
      // Evalúa cada estrategia contra el último sorteo registrado
      if (draws.length >= 2) {
        const sortedDraws = [...draws].sort((a,b)=>(b.date??'').localeCompare(a.date??''))
        const lastActual = { numbers: sortedDraws[0].numbers, stars: sortedDraws[0].stars }
        // Calcula con datos sin el último sorteo
        const prevStrats = getAllStrategies(sortedDraws.slice(1))
        const scores: Record<string,number> = {}
        for (const s of prevStrats) {
          const sc = scorePrediction(s, lastActual)
          scores[s.strategy] = sc.total
        }
        setLastDrawScores(scores)
      }
      setReady(true)
    }, 60)
    return () => clearTimeout(t)
  }, [draws])

  // Solo sorteos 2026 en pantalla
  const draws2026 = useMemo(() => draws.filter(d => d.date?.startsWith('2026')), [draws])

  // Reordena: ranking histórico > score último sorteo > orden default
  const orderedStrategies = useMemo(() => {
    if (ranking.length > 0) {
      const rankMap = new Map(ranking.map((r, i) => [r.strategy, i]))
      return [...strategies].sort((a, b) => {
        const ra = rankMap.has(a.strategy) ? rankMap.get(a.strategy)! : 999
        const rb = rankMap.has(b.strategy) ? rankMap.get(b.strategy)! : 999
        return ra - rb
      })
    }
    // Siempre ordena por confianza primero, lastDrawScore como desempate
    return [...strategies].sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence
      const sa = lastDrawScores[a.strategy] ?? 0
      const sb = lastDrawScores[b.strategy] ?? 0
      return sb - sa
    })
  }, [strategies, ranking, lastDrawScores])

  const ready5 = formNums.length === 5 && formStars.length === 2

  const handleSaveResult = async () => {
    if (!ready5) return
    setSaving(true)
    // Evalúa todas las estrategias ANTES de agregar el sorteo
    const preStrategies = getAllStrategies(draws)
    const actual = { numbers: formNums, stars: formStars }
    if (preStrategies.length > 0) {
      const scores = preStrategies.map(s => ({
        strategy: s.strategy,
        ...scorePrediction(s, actual)
      }))
      await saveScores({ date: new Date().toISOString().split('T')[0], actual, scores })
    }
    // Ahora agrega el sorteo
    await addDraw({ numbers: formNums, stars: formStars, jackpot: '' })
    setFormNums([]); setFormStars([]); setShowForm(false); setSaving(false)
  }

  const tabs = [
    { id: 'predict', label: 'Predicción', icon: <TrendingUp size={14}/> },
    { id: 'ranking', label: 'Ranking', icon: <Award size={14}/> },
    { id: 'history', label: 'Sorteos', icon: <Trophy size={14}/> },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(7,8,15,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo/>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                  <span style={{ color: 'var(--blue)' }}>Lucky</span><span style={{ color: 'var(--gold)' }}>Lab</span>
                </h1>
                <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginTop: 1 }}>
                  {draws.length} sorteos · análisis activo
                </p>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: showForm ? 'var(--bg5)' : 'var(--blue)', color: '#fff',
              boxShadow: showForm ? 'none' : '0 3px 14px rgba(91,127,255,0.4)',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {showForm ? <><X size={13}/>Cerrar</> : <><PlusCircle size={13}/>Resultado</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', flexShrink: 0,
                background: 'none', border: 'none',
                borderBottom: tab===t.id ? '2px solid var(--blue)' : '2px solid transparent',
                color: tab===t.id ? 'var(--t1)' : 'var(--t3)',
                fontSize: 12, fontWeight: tab===t.id?600:400, cursor: 'pointer',
                touchAction: 'manipulation', whiteSpace: 'nowrap',
              }}>{t.icon}{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Form ingresar resultado */}
        {showForm && (
          <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg3)', border: '1px solid rgba(91,127,255,0.25)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Ingresar resultado del sorteo</p>
            <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
              Al guardar, se evalúan todas las estrategias contra este resultado para el ranking.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg4)', borderRadius: 9, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Números ganadores — {formNums.length}/5</p>
                <NumberPicker max={50} count={5} selected={formNums} onChange={setFormNums}/>
              </div>
              <div style={{ padding: 12, background: 'var(--bg4)', borderRadius: 9, border: '1px solid rgba(240,180,41,0.15)' }}>
                <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Estrellas — {formStars.length}/2</p>
                <NumberPicker max={12} count={2} selected={formStars} onChange={setFormStars}/>
              </div>
              {ready5 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', background: 'var(--bg4)', borderRadius: 9 }}>
                  {formNums.map(n=><Ball key={n} n={n} size="sm"/>)}
                  <span style={{ color: 'var(--t3)', margin: '0 3px' }}>·</span>
                  {formStars.map(n=><Ball key={n} n={n} type="star" size="sm"/>)}
                </div>
              )}
              <button onClick={handleSaveResult} disabled={saving||!ready5} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9,
                border: 'none', background: ready5?'var(--blue)':'var(--bg5)', color: ready5?'#fff':'var(--t3)',
                fontSize: 13, fontWeight: 600, cursor: ready5?'pointer':'not-allowed', opacity: saving?0.6:1,
                width: 'fit-content', touchAction: 'manipulation',
              }}>
                {saving?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<PlusCircle size={13}/>}
                Guardar y evaluar
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--t3)', gap: 10 }}>
            <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/>
            <span style={{ fontSize: 12, fontFamily: "'Space Mono',monospace" }}>Cargando...</span>
          </div>
        )}

        {/* TAB Predicción */}
        {!loading && tab === 'predict' && (
          !ready ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--t3)', gap: 10 }}>
              <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>
              <span style={{ fontSize: 12, fontFamily: "'Space Mono',monospace" }}>Calculando...</span>
            </div>
          ) : orderedStrategies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🔮</div>
              <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Necesitas más sorteos</p>
            </div>
          ) : (
            <>
              {ranking.length > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(78,203,160,0.06)', border: '1px solid rgba(78,203,160,0.15)' }}>
                  <p style={{ fontSize: 11, color: 'var(--green)', fontFamily: "'Space Mono',monospace", lineHeight: 1.6 }}>
                    ✓ Ordenadas por rendimiento real: la #1 es la que más ha acertado en {ranking[0]?.count || 0} sorteos evaluados.
                  </p>
                </div>
              )}
              {orderedStrategies.map((pred, i) => {
                const rankInfo = ranking.find(r => r.strategy === pred.strategy)
                return (
                  <div key={pred.strategy} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${expanded===i?'rgba(91,127,255,0.25)':'var(--border)'}`, background: expanded===i?'var(--bg4)':'var(--bg3)' }}>
                    <button onClick={() => setExpanded(expanded===i?null:i)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', gap: 10, touchAction: 'manipulation',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {i === 0 && ranking.length > 0 && <span style={{ fontSize: 16 }}>🏆</span>}
                        <span style={{ fontSize: 18 }}>{pred.strategy.split(' ')[0]}</span>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pred.strategy.slice(pred.strategy.indexOf(' ')+1)}
                          </p>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
                            <div style={{height:3,width:60,background:'var(--bg5)',borderRadius:3,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${pred.confidence}%`,background:pred.confidence>=65?'var(--green)':pred.confidence>=55?'var(--gold)':'var(--t3)',borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:10,color:pred.confidence>=65?'var(--green)':pred.confidence>=55?'var(--gold)':'var(--t3)',fontFamily:"'Space Mono',monospace",fontWeight:700}}>{pred.confidence}%</span>
                            {rankInfo && <span style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>· prom {rankInfo.avg.toFixed(1)}</span>}
                            {!rankInfo && lastDrawScores[pred.strategy] !== undefined && (
                              <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,
                                color:lastDrawScores[pred.strategy]>=3?'var(--green)':lastDrawScores[pred.strategy]>=2?'var(--gold)':'var(--t3)'}}>
                                · último sorteo: {lastDrawScores[pred.strategy]} acierto{lastDrawScores[pred.strategy]!==1?'s':''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                          {pred.numbers.map(n=><Ball key={n} n={n} size="sm"/>)}
                          <span style={{color:'var(--t3)',margin:'0 2px'}}>·</span>
                          {pred.stars.map(n=><Ball key={n} n={n} type="star" size="sm"/>)}
                        </div>
                        {expanded===i?<ChevronUp size={15} color="var(--t3)"/>:<ChevronDown size={15} color="var(--t3)"/>}
                      </div>
                    </button>
                    {expanded===i && (
                      <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>{pred.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {pred.numbers.map(n=><Ball key={n} n={n} size="md"/>)}
                          <span style={{ color: 'var(--t3)', margin: '0 5px', fontSize: 18 }}>·</span>
                          {pred.stars.map(n=><Ball key={n} n={n} type="star" size="md"/>)}
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 11, color: 'var(--t2)', fontFamily: "'Space Mono',monospace", lineHeight: 1.7 }}>{pred.reasoning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )
        )}

        {/* TAB Ranking */}
        {!loading && tab === 'ranking' && (
          ranking.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🏆</div>
              <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Sin datos de rendimiento aún</p>
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Ingresa resultados de sorteos para ver qué estrategia acierta más</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>
                Promedio de aciertos por sorteo · {ranking[0]?.count || 0} sorteos evaluados
              </p>
              {ranking.map((r, i) => {
                const max = ranking[0].avg || 1
                return (
                  <div key={r.strategy} style={{ padding: '14px 16px', borderRadius: 12, background: i===0?'rgba(91,127,255,0.08)':'var(--bg3)', border: i===0?'1px solid rgba(91,127,255,0.3)':'1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontFamily: "'Space Mono',monospace", color: 'var(--t3)', minWidth: 16 }}>{i+1}</span>
                      <span style={{ fontSize: 16 }}>{r.strategy.split(' ')[0]}</span>
                      <p style={{ fontSize: 13, fontWeight: i===0?700:500, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.strategy.slice(r.strategy.indexOf(' ')+1)}
                      </p>
                      <span style={{ fontSize: 14, fontWeight: 800, color: i===0?'var(--blue)':'var(--t2)', fontFamily: "'Space Mono',monospace" }}>{r.avg.toFixed(1)}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${(r.avg/max)*100}%`, background: i===0?'var(--blue)':'var(--t3)', borderRadius: 3 }}/>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>
                      {r.numHits} núms + {r.starHits} estrellas acertados · mejor sorteo: {r.best} aciertos
                    </p>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* TAB Sorteos (solo 2026) */}
        {!loading && tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>
              Sorteos de 2026 ({draws2026.length}) · el análisis usa todo el histórico
            </p>
            {draws2026.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎰</div>
                <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: "'Space Mono',monospace" }}>Sin sorteos de 2026</p>
              </div>
            ) : draws2026.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: "'Space Mono',monospace", minWidth: 70 }}>{d.date}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                  {d.numbers.map(n=><Ball key={n} n={n} size="sm"/>)}
                  <span style={{ color: 'var(--t3)', margin: '0 3px' }}>·</span>
                  {d.stars.map(n=><Ball key={n} n={n} type="star" size="sm"/>)}
                </div>
                <button onClick={() => d.id && deleteDraw(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, touchAction: 'manipulation' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
