import { useState, useEffect } from 'react'
import { ref, push, onValue } from 'firebase/database'
import { db } from '../firebase'

export interface ScoreEntry {
  id?: string
  date: string                 // fecha del sorteo evaluado
  actual: { numbers: number[], stars: number[] }
  scores: Array<{ strategy: string, numHits: number, starHits: number, total: number }>
  createdAt: number
}

const PATH = 'strategyScores'

export function useStrategyScores() {
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, PATH), (snapshot) => {
      const data: ScoreEntry[] = []
      snapshot.forEach((child) => { data.push({ id: child.key!, ...child.val() }) })
      data.sort((a, b) => b.createdAt - a.createdAt)
      setEntries(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const saveScores = async (entry: Omit<ScoreEntry, 'id' | 'createdAt'>) => {
    await push(ref(db, PATH), { ...entry, createdAt: Date.now() })
  }

  // Ranking acumulado: suma de aciertos por estrategia a través de todos los sorteos evaluados
  const ranking = (() => {
    const acc: Record<string, { total: number, numHits: number, starHits: number, count: number, best: number }> = {}
    for (const e of entries) {
      for (const s of e.scores) {
        if (!acc[s.strategy]) acc[s.strategy] = { total: 0, numHits: 0, starHits: 0, count: 0, best: 0 }
        acc[s.strategy].total += s.total
        acc[s.strategy].numHits += s.numHits
        acc[s.strategy].starHits += s.starHits
        acc[s.strategy].count += 1
        acc[s.strategy].best = Math.max(acc[s.strategy].best, s.total)
      }
    }
    return Object.entries(acc)
      .map(([strategy, v]) => ({ strategy, ...v, avg: v.count ? v.total / v.count : 0 }))
      .sort((a, b) => b.avg - a.avg || b.total - a.total)
  })()

  return { entries, loading, saveScores, ranking }
}
