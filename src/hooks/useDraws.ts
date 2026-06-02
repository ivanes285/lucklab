import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Draw } from '../types'

const COLLECTION = 'draws'

export function useDraws() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Draw[]
      // Ordenar en el cliente por createdAt desc
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
    const now = Timestamp.now()
    try {
      await addDoc(collection(db, COLLECTION), {
        ...draw,
        createdAt: now.toMillis(),
        date: now.toDate().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
      })
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteDraw = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return { draws, loading, error, addDraw, deleteDraw }
}
