import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Draw } from '../types'

const COLLECTION = 'draws'

export function useDraws() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Draw[]
      setDraws(data)
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addDraw = async (draw: Omit<Draw, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, COLLECTION), {
        ...draw,
        createdAt: Timestamp.now().toMillis()
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
