import { useState, useMemo } from 'react'
import { Draw } from '../types'

interface Props { draws: Draw[] }

function fmt(n: number) { return n < 10 ? `0${n}` : `${n}` }

function median(arr: number[]): number {
  const s = [...arr].sort((a,b)=>a-b)
  const m = Math.floor(s.length/2)
  return s.length%2===0 ? (s[m-1]+s[m])/2 : s[m]
}

function linreg(vals: number[]): number {
  const w = vals.slice(-20), n=w.length
  const xm=(n-1)/2, ym=w.reduce((a,b)=>a+b,0)/n
  let num=0,den=0
  w.forEach((y,x)=>{num+=(x-xm)*(y-ym);den+=(x-xm)**2})
  return den!==0?num/den:0
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(v)))
}

function analyze(draws: Draw[], pos: number, isStar: boolean) {
  const max = isStar ? 12 : 50
  const sorted = [...draws].sort((a,b)=>a.date.localeCompare(b.date))
  const vals = sorted.map(d => {
    const arr = isStar ? [...d.stars].sort((a,b)=>a-b) : [...d.numbers].sort((a,b)=>a-b)
    return arr[pos-1]
  }).filter((v): v is number => v !== undefined)

  if (vals.length < 5) return null
  const deltas: number[] = []
  for (let i=1; i<vals.length; i++) deltas.push(vals[i]-vals[i-1])

  const last = vals[vals.length-1]
  const meanD = deltas.reduce((a,b)=>a+b,0)/deltas.length
  const medD  = median(deltas)
  const rec5m = deltas.slice(-5).reduce((a,b)=>a+b,0)/Math.min(5,deltas.length)
  const slope = linreg(vals)

  const m1=clamp(last+meanD,1,max), m2=clamp(last+medD,1,max)
  const m3=clamp(last+rec5m,1,max), m4=clamp(last+slope,1,max)
  const consensus=clamp((m1+m2+m3+m4)/4,1,max)

  return {
    vals: vals.slice(-12), deltas: deltas.slice(-15), last, consensus,
    estimates: [
      {key:'MÉTODO 1',name:'Media Δ',     value:m1, desc:`último ${last} + promedio de saltos`, color:'var(--blue)'},
      {key:'MÉTODO 2',name:'Mediana Δ',   value:m2, desc:'más robusta ante extremos',           color:'var(--green)'},
      {key:'MÉTODO 3',name:'Últimos 5 Δ', value:m3, desc:'tendencia reciente',                  color:'var(--gold)'},
      {key:'MÉTODO 4',name:'Regresión',   value:m4, desc:'tendencia global N+1',                color:'#FF7BAC'},
    ]
  }
}

export default function DeltaSection({ draws }: Props) {
  const [pos, setPos] = useState(1)
  const [isStar, setIsStar] = useState(false)
  const res = useMemo(() => analyze(draws, pos, isStar), [draws, pos, isStar])

  if (draws.length < 5) return null

  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding:'5px 13px', borderRadius:7, border:'none', cursor:'pointer',
    fontSize:11, fontFamily:"'Space Mono',monospace", fontWeight:600,
    background: active ? color : 'var(--bg4)',
    color: active ? (color==='var(--gold)'?'#1a0e00':'#fff') : 'var(--t3)',
    touchAction:'manipulation' as const,
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {[1,2,3,4,5].map(p=>(
          <button key={p} onClick={()=>{setPos(p);setIsStar(false)}} style={btnStyle(!isStar&&pos===p,'var(--blue)')}>P{p}</button>
        ))}
        <div style={{width:1,background:'var(--border)',margin:'0 2px'}}/>
        {[1,2].map(p=>(
          <button key={p} onClick={()=>{setPos(p);setIsStar(true)}} style={btnStyle(isStar&&pos===p,'var(--gold)')}>★{p}</button>
        ))}
      </div>

      {!res ? (
        <p style={{fontSize:12,color:'var(--t3)'}}>Sin datos suficientes para esta posición</p>
      ) : (
        <>
          {/* Serie visual */}
          <div style={{display:'flex',alignItems:'flex-end',gap:4,overflowX:'auto',paddingBottom:8,marginBottom:16}}>
            {res.vals.map((v,i)=>{
              const delta = i>0 ? res.vals[i]-res.vals[i-1] : null
              const isLast = i===res.vals.length-1
              return (
                <div key={i} style={{display:'flex',alignItems:'flex-end',gap:4}}>
                  {i>0&&<span style={{color:'var(--t3)',fontSize:13,paddingBottom:19}}>→</span>}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,
                      color:delta===null?'transparent':delta>0?'var(--green)':delta<0?'var(--red)':'var(--t3)'}}>
                      {delta!==null?(delta>0?`+${delta}`:`${delta}`):'·'}
                    </span>
                    <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontFamily:"'Space Mono',monospace",fontWeight:700,flexShrink:0,
                      background:isLast?(isStar?'var(--gold)':'var(--blue)'):'var(--bg4)',
                      color:isLast?(isStar?'#1a0e00':'#fff'):'var(--t2)',
                      border:isLast?'none':'1px solid var(--border)'}}>
                      {fmt(v)}
                    </div>
                    <span style={{fontSize:9,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>
                      {isLast?'último':''}
                    </span>
                  </div>
                </div>
              )
            })}
            <span style={{color:'var(--t3)',fontSize:13,paddingBottom:19}}>→</span>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:10,color:'transparent'}}>·</span>
              <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontFamily:"'Space Mono',monospace",fontWeight:700,flexShrink:0,
                background:'rgba(240,180,41,0.12)',color:'var(--gold)',
                border:'1px dashed rgba(240,180,41,0.4)'}}>?</div>
              <span style={{fontSize:9,color:'var(--gold)',fontFamily:"'Space Mono',monospace"}}>próximo</span>
            </div>
          </div>

          {/* Deltas */}
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
            <span style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginRight:2}}>SALTOS:</span>
            {res.deltas.map((d,i)=>(
              <span key={i} style={{padding:'2px 7px',borderRadius:5,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,
                background:d>0?'rgba(78,203,160,0.1)':d<0?'rgba(255,92,92,0.1)':'var(--bg4)',
                color:d>0?'var(--green)':d<0?'var(--red)':'var(--t3)',
                border:`1px solid ${d>0?'rgba(78,203,160,0.2)':d<0?'rgba(255,92,92,0.2)':'var(--border)'}`}}>
                {d>0?`+${d}`:`${d}`}
              </span>
            ))}
          </div>

          {/* 4 métodos */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
            {res.estimates.map(e=>(
              <div key={e.key} style={{padding:'12px 14px',borderRadius:10,background:'var(--bg4)',border:`1px solid ${e.color}33`}}>
                <p style={{fontSize:9,color:'var(--t3)',fontFamily:"'Space Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'0.07em',marginBottom:2}}>{e.key}</p>
                <p style={{fontSize:12,color:'var(--t2)',marginBottom:6,fontWeight:500}}>{e.name}</p>
                <p style={{fontSize:32,fontWeight:800,color:e.color,lineHeight:1,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{fmt(e.value)}</p>
                <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>{e.desc}</p>
              </div>
            ))}
          </div>

          {/* Consenso */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderRadius:12,background:'var(--bg3)',border:'1px solid var(--border2)'}}>
            <div>
              <p style={{fontSize:13,color:'var(--t1)',fontWeight:600}}>Consenso de los 4 métodos</p>
              <p style={{fontSize:11,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginTop:2}}>Promedio → estimado siguiente</p>
            </div>
            <div style={{fontSize:44,fontWeight:800,color:'var(--t1)',fontFamily:"'Space Mono',monospace",letterSpacing:'-0.02em'}}>
              {fmt(res.consensus)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
