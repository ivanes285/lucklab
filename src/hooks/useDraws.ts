import { useState, useEffect } from 'react'
import { ref, push, remove, onValue } from 'firebase/database'
import { db } from '../firebase'
import { Draw } from '../types'

const PATH = 'euromillones'

export function useDraws() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onValue(ref(db, PATH), (snapshot) => {
      const data: Draw[] = []
      snapshot.forEach((child) => {
        data.push({ id: child.key!, ...child.val() })
      })
      // Ordenar por fecha del sorteo (date) de más reciente a más antiguo
      data.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      setDraws(data)
      setLoading(false)
    }, (err) => {
      console.error('[LuckLab] Error Firebase:', err.message)
      setError(err.message)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addDraw = async (draw: Omit<Draw, 'id' | 'createdAt' | 'date'>) => {
    const now = Date.now()
    try {
      await push(ref(db, PATH), {
        ...draw,
        createdAt: now,
        date: new Date(now).toISOString().split('T')[0]
      })
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteDraw = async (id: string) => {
    try {
      await remove(ref(db, `${PATH}/${id}`))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return { draws, loading, error, addDraw, deleteDraw }
}
