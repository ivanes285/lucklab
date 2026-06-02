import { useState } from 'react'
import { useBets } from '../hooks/useBets'
import Ball from './Ball'
import { PlusCircle, Trash2, CheckCircle, Loader2 } from 'lucide-react'

function NumberPicker({ max, count, selected, onChange }: { max:number, count:number, selected:number[], onChange:(v:number[])=>void }) {
  const isStar = max === 12
  const toggle = (n:number) => {
    if (selected.includes(n)) onChange(selected.filter(x=>x!==n))
    else if (selected.length < count) onChange([...selected,n].sort((a,b)=>a-b))
  }
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
      {Array.from({length:max},(_,i)=>i+1).map(n => {
        const sel = selected.includes(n)
        const disabled = !sel && selected.length >= count
        return (
          <button key={n} onClick={()=>toggle(n)} disabled={disabled} style={{
            width:32,height:32,borderRadius:'50%',border:'none',fontSize:10,
            fontFamily:"'Space Mono',monospace",fontWeight:700,cursor:disabled?'not-allowed':'pointer',
            transition:'all 0.12s',transform:sel?'scale(1.15)':'scale(1)',
            background:sel?(isStar?'var(--gold)':'var(--blue)'):(disabled?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)'),
            color:sel?(isStar?'#1a0e00':'#fff'):(disabled?'var(--t3)':'var(--t2)'),
            touchAction:'manipulation',WebkitTapHighlightColor:'transparent',
          }}>{n<10?`0${n}`:n}</button>
        )
      })}
    </div>
  )
}

export default function BetsTab() {
  const { bets, loading, addBet, deleteBet, evaluateBet } = useBets()
  const [showForm, setShowForm] = useState(false)
  const [nums, setNums] = useState<number[]>([])
  const [stars, setStars] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [evalBetId, setEvalBetId] = useState<string|null>(null)
  const [evalNums, setEvalNums] = useState<number[]>([])
  const [evalStars, setEvalStars] = useState<number[]>([])
  const [evaluating, setEvaluating] = useState(false)

  const handleSave = async () => {
    if (nums.length !== 5 || stars.length !== 2) return
    setSaving(true)
    await addBet({ numbers:nums, stars:stars })
    setNums([]); setStars([]); setShowForm(false); setSaving(false)
  }

  const handleEvaluate = async (bet: any) => {
    if (evalNums.length !== 5 || evalStars.length !== 2) return
    setEvaluating(true)
    await evaluateBet(bet.id, evalNums, evalStars, bet)
    setEvalBetId(null); setEvalNums([]); setEvalStars([]); setEvaluating(false)
  }

  const card: React.CSSProperties = {padding:'14px 16px',borderRadius:12,background:'var(--bg3)',border:'1px solid var(--border)'}

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'var(--t3)'}}>
    <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/>
  </div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <p style={{fontSize:12,color:'var(--t2)'}}>Registra tus boletos y compáralos con el resultado real.</p>
        <button onClick={()=>setShowForm(!showForm)} style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,
          border:'none',background:'var(--blue)',color:'#fff',fontSize:12,fontWeight:600,
          cursor:'pointer',touchAction:'manipulation',WebkitTapHighlightColor:'transparent',
        }}>
          <PlusCircle size={13}/> Boleto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{...card,border:'1px solid rgba(91,127,255,0.25)'}}>
          <p style={{fontSize:13,fontWeight:700,marginBottom:16}}>Nuevo boleto</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{padding:12,background:'var(--bg4)',borderRadius:9,border:'1px solid var(--border)'}}>
              <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginBottom:8,textTransform:'uppercase',letterSpacing:'0.07em'}}>Números ({nums.length}/5)</p>
              <NumberPicker max={50} count={5} selected={nums} onChange={setNums}/>
            </div>
            <div style={{padding:12,background:'var(--bg4)',borderRadius:9,border:'1px solid rgba(240,180,41,0.12)'}}>
              <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginBottom:8,textTransform:'uppercase',letterSpacing:'0.07em'}}>Estrellas ({stars.length}/2)</p>
              <NumberPicker max={12} count={2} selected={stars} onChange={setStars}/>
            </div>
            {(nums.length>0||stars.length>0) && (
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',padding:'10px 12px',background:'var(--bg4)',borderRadius:9}}>
                {nums.map(n=><Ball key={n} n={n} size="sm"/>)}
                {stars.length>0&&<span style={{color:'var(--t3)',margin:'0 4px'}}>·</span>}
                {stars.map(n=><Ball key={n} n={n} type="star" size="sm"/>)}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleSave} disabled={saving||nums.length!==5||stars.length!==2} style={{
                display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:9,
                border:'none',background:'var(--blue)',color:'#fff',fontSize:13,fontWeight:600,
                cursor:(saving||nums.length!==5||stars.length!==2)?'not-allowed':'pointer',
                opacity:(saving||nums.length!==5||stars.length!==2)?0.5:1,
                touchAction:'manipulation',
              }}>
                {saving?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<PlusCircle size={13}/>} Guardar
              </button>
              <button onClick={()=>setShowForm(false)} style={{padding:'10px 14px',borderRadius:9,background:'var(--bg5)',border:'1px solid var(--border)',color:'var(--t2)',fontSize:13,cursor:'pointer',touchAction:'manipulation'}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bets list */}
      {bets.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <div style={{fontSize:40,marginBottom:12}}>🎫</div>
          <p style={{fontSize:13,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>Sin boletos guardados</p>
        </div>
      ) : bets.map((bet:any) => (
        <div key={bet.id}>
          <div style={{...card,border:bet.result?`1px solid ${bet.result.prize.includes('❌')?'rgba(255,92,92,0.2)':'rgba(78,203,160,0.3)'}`:card.border}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace"}}>
                {new Date(bet.createdAt).toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'})}
              </span>
              <div style={{display:'flex',gap:6}}>
                {!bet.result && (
                  <button onClick={()=>setEvalBetId(evalBetId===bet.id?null:bet.id)} style={{
                    display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,
                    border:'1px solid rgba(78,203,160,0.3)',background:'rgba(78,203,160,0.08)',
                    color:'var(--green)',fontSize:11,fontWeight:600,cursor:'pointer',touchAction:'manipulation',
                  }}>
                    <CheckCircle size={11}/> Evaluar
                  </button>
                )}
                <button onClick={()=>bet.id&&deleteBet(bet.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',padding:4,touchAction:'manipulation'}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
              {bet.numbers.map((n:number)=><Ball key={n} n={n} size="sm"/>)}
              <span style={{color:'var(--t3)',margin:'0 4px'}}>·</span>
              {bet.stars.map((n:number)=><Ball key={n} n={n} type="star" size="sm"/>)}
            </div>

            {bet.result && (
              <div style={{marginTop:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700,color:bet.result.prize.includes('❌')?'var(--red)':'var(--green)'}}>{bet.result.prize}</span>
                  <span style={{fontSize:11,color:'var(--t2)',fontFamily:"'Space Mono',monospace"}}>
                    {bet.result.numbersHit}/5 nums · {bet.result.starsHit}/2 ⭐
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Evaluate form */}
          {evalBetId === bet.id && (
            <div style={{...card,marginTop:6,border:'1px solid rgba(78,203,160,0.2)',background:'var(--bg4)'}}>
              <p style={{fontSize:12,fontWeight:600,color:'var(--green)',marginBottom:12}}>Ingresa el resultado del sorteo</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div>
                  <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginBottom:6,textTransform:'uppercase'}}>Números ganadores ({evalNums.length}/5)</p>
                  <NumberPicker max={50} count={5} selected={evalNums} onChange={setEvalNums}/>
                </div>
                <div>
                  <p style={{fontSize:10,color:'var(--t3)',fontFamily:"'Space Mono',monospace",marginBottom:6,textTransform:'uppercase'}}>Estrellas ({evalStars.length}/2)</p>
                  <NumberPicker max={12} count={2} selected={evalStars} onChange={setEvalStars}/>
                </div>
                <button onClick={()=>handleEvaluate(bet)} disabled={evaluating||evalNums.length!==5||evalStars.length!==2} style={{
                  display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:9,
                  border:'none',background:'var(--green)',color:'#fff',fontSize:13,fontWeight:600,
                  cursor:'pointer',width:'fit-content',touchAction:'manipulation',
                  opacity:evalNums.length!==5||evalStars.length!==2?0.5:1,
                }}>
                  {evaluating?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<CheckCircle size={13}/>} Calcular resultado
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
