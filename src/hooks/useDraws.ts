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
    const dbRef = ref(db, PATH)
    const unsub = onValue(dbRef, (snapshot) => {
      const data: Draw[] = []
      snapshot.forEach((child) => {
        data.push({ id: child.key!, ...child.val() })
      })
      data.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      setDraws(data)
      setLoading(false)
    }, (err) => {
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
        date: new Date(now).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
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
