import { useState, useEffect } from 'react'
import { ref, push, onValue } from 'firebase/database'
import { db } from '../firebase'

export interface StrategyEntry {
  id?: string
  date: string           // fecha en que se generó
  drawDate?: string      // fecha del sorteo siguiente esperado
  predictions: Array<{
    strategy: string
    numbers: number[]
    stars: number[]
  }>
  result?: {
    numbers: number[]
    stars: number[]
    enteredAt: number
    scores: Array<{ strategy: string, numHits: number, starHits: number, total: number }>
    winner: string
  }
  createdAt: number
}

const PATH = 'strategyLog'

export function useStrategyLog() {
  const [log, setLog] = useState<StrategyEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, PATH), (snapshot) => {
      const data: StrategyEntry[] = []
      snapshot.forEach((child) => { data.push({ id: child.key!, ...child.val() }) })
      data.sort((a, b) => b.createdAt - a.createdAt)
      setLog(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const saveSnapshot = async (predictions: StrategyEntry['predictions']) => {
    const today = new Date().toISOString().split('T')[0]
    await push(ref(db, PATH), {
      date: today,
      predictions,
      createdAt: Date.now()
    })
  }

  return { log, loading, saveSnapshot }
}
