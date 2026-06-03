import { useMemo } from 'react'
import { Draw } from '../types'
import Ball from './Ball'
import DeltaSection from './DeltaSection'

interface Props { draws: Draw[] }

export default function StatsTab({ draws }: Props) {
  const stats = useMemo(() => {
    if (draws.length === 0) return null
    const numFreq: Record<number,number> = {}
    const starFreq: Record<number,number> = {}
    for (let i = 1; i <= 50; i++) numFreq[i] = 0
    for (let i = 1; i <= 12; i++) starFreq[i] = 0
    draws.forEach(d => {
      d.numbers.forEach(n => numFreq[n]++)
      d.stars.forEach(n => starFreq[n]++)
    })
    const maxNum = Math.max(...Object.values(numFreq))
    const maxStar = Math.max(...Object.values(starFreq))

    const lastSeen: Record<number,number> = {}
    const sorted = [...draws].sort((a,b) => a.date.localeCompare(b.date))
    sorted.forEach((d,i) => d.numbers.forEach(n => { lastSeen[n] = i }))
    const absenceStreak = Array.from({length:50},(_,i)=>i+1)
      .map(n => ({ n, streak: sorted.length - 1 - (lastSeen[n] ?? -1) }))
      .sort((a,b) => b.streak - a.streak)

    const evenCount = draws.reduce((s,d) => s + d.numbers.filter(n=>n%2===0).length, 0)
    const oddCount = draws.length*5 - evenCount
    const evenPct = Math.round(evenCount/(draws.length*5)*100)
    const lowCount = draws.reduce((s,d) => s + d.numbers.filter(n=>n<=25).length, 0)
    const highCount = draws.length*5 - lowCount
    const lowPct = Math.round(lowCount/(draws.length*5)*100)
    const sums = draws.map(d => d.numbers.reduce((a,b)=>a+b,0))
    const avgSum = Math.round(sums.reduce((a,b)=>a+b,0)/sums.length)
    const minSum = Math.min(...sums)
    const maxSum = Math.max(...sums)

    return { numFreq, starFreq, maxNum, maxStar, absenceStreak, evenPct, oddCount, evenCount, lowPct, highCount, lowCount, avgSum, minSum, maxSum }
  }, [draws])

  if (!stats || draws.length < 3) return (
    <div style={{textAlign:'center',padding:'80px 0'}}>
      <div style={{fontSize:44,marginBottom:14}}>📊</div>
      <p style={{fontSize:13,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>Mínimo 3 sorteos</p>
    </div>
  )

  const card: React.CSSProperties = {padding:'16px',borderRadius:14,background:'var(--bg3)',border:'1px solid var(--border)'}
  const title: React.CSSProperties = {fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:14}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Heatmap números */}
      <div style={card}>
        <p style={title}>🔥 Frecuencia números (1-50) — {draws.length} sorteos</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3}}>
          {Array.from({length:50},(_,i)=>i+1).map(n => {
            const freq = stats.numFreq[n]
            const intensity = freq / stats.maxNum
            const bg = `rgba(91,127,255,${0.06 + intensity*0.88})`
            const col = intensity > 0.45 ? '#fff' : 'var(--t2)'
            return (
              <div key={n} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 1px',borderRadius:7,background:bg}}>
                <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:col}}>{n<10?`0${n}`:n}</span>
                <span style={{fontSize:7,color:col,opacity:0.75,marginTop:1,fontFamily:"'Space Mono',monospace"}}>{freq}</span>
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10}}>
          <span style={{fontSize:9,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>MENOS</span>
          <div style={{flex:1,height:5,borderRadius:3,background:'linear-gradient(90deg,rgba(91,127,255,0.06),rgba(91,127,255,0.94))'}}/>
          <span style={{fontSize:9,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>MÁS</span>
        </div>
      </div>

      {/* Heatmap estrellas */}
      <div style={card}>
        <p style={title}>⭐ Frecuencia estrellas (1-12)</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
          {Array.from({length:12},(_,i)=>i+1).map(n => {
            const freq = stats.starFreq[n]
            const intensity = freq / stats.maxStar
            const bg = `rgba(240,180,41,${0.08 + intensity*0.85})`
            const col = intensity > 0.5 ? '#1a0e00' : 'var(--t2)'
            return (
              <div key={n} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 4px',borderRadius:8,background:bg}}>
                <span style={{fontSize:13,fontFamily:"'Space Mono',monospace",fontWeight:700,color:col}}>{n<10?`0${n}`:n}</span>
                <span style={{fontSize:9,color:col,opacity:0.8,marginTop:2,fontFamily:"'Space Mono',monospace"}}>{freq}x</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Par/impar + bajo/alto */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={card}>
          <p style={title}>⚖️ Par vs Impar</p>
          <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:8,height:10}}>
            <div style={{flex:stats.evenCount,height:'100%',borderRadius:4,background:'var(--blue)'}}/>
            <div style={{flex:stats.oddCount,height:'100%',borderRadius:4,background:'var(--gold)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'var(--blue)',fontFamily:"'Space Mono',monospace",fontWeight:700}}>Par {stats.evenPct}%</span>
            <span style={{fontSize:11,color:'var(--gold)',fontFamily:"'Space Mono',monospace",fontWeight:700}}>Impar {100-stats.evenPct}%</span>
          </div>
        </div>
        <div style={card}>
          <p style={title}>📊 Bajo vs Alto</p>
          <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:8,height:10}}>
            <div style={{flex:stats.lowCount,height:'100%',borderRadius:4,background:'var(--green)'}}/>
            <div style={{flex:stats.highCount,height:'100%',borderRadius:4,background:'rgba(255,92,92,0.7)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'var(--green)',fontFamily:"'Space Mono',monospace",fontWeight:700}}>1-25: {stats.lowPct}%</span>
            <span style={{fontSize:11,color:'rgba(255,92,92,0.9)',fontFamily:"'Space Mono',monospace",fontWeight:700}}>26-50: {100-stats.lowPct}%</span>
          </div>
        </div>
      </div>

      {/* Suma */}
      <div style={card}>
        <p style={title}>➕ Suma de los 5 números por sorteo</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,textAlign:'center',marginBottom:12}}>
          {[{label:'Promedio',value:stats.avgSum,color:'var(--blue)'},{label:'Mínimo',value:stats.minSum,color:'var(--green)'},{label:'Máximo',value:stats.maxSum,color:'var(--gold)'}].map(s=>(
            <div key={s.label}>
              <p style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</p>
              <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginTop:4,textTransform:'uppercase'}}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
          <p style={{fontSize:11,color:'var(--t2)',fontFamily:"'Space Mono',monospace"}}>
            💡 Combinaciones ganadoras típicas suman entre {Math.round(stats.avgSum*0.82)} y {Math.round(stats.avgSum*1.18)}
          </p>
        </div>
      </div>

      {/* Ausencia */}
      <div style={card}>
        <p style={title}>❄️ Números con más sorteos de ausencia</p>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {stats.absenceStreak.slice(0,10).map(({n,streak})=>(
            <div key={n} style={{display:'flex',alignItems:'center',gap:10}}>
              <Ball n={n} size="sm" />
              <div style={{flex:1,height:6,background:'var(--bg4)',borderRadius:3,overflow:'hidden'}}>
                <div style={{
                  height:'100%',
                  width:`${Math.min(100,(streak/draws.length)*200)}%`,
                  background:`rgba(79,160,240,${0.3+Math.min(0.7,(streak/draws.length)*3)})`,
                  borderRadius:3,
                }}/>
              </div>
              <span style={{fontSize:10,color:'var(--t2)',fontFamily:"'Space Mono',monospace",minWidth:55,textAlign:'right'}}>
                {streak} sorteos
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delta por posición */}
      <div style={card}>
        <p style={title}>📈 Análisis de diferencias consecutivas por posición</p>
        <DeltaSection draws={draws} />
      </div>

    </div>
  )
}
