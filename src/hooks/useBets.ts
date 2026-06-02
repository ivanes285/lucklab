import { useState, useEffect } from 'react'
import { ref, push, remove, update, onValue } from 'firebase/database'
import { db } from '../firebase'

export interface Bet {
  id?: string
  numbers: number[]
  stars: number[]
  drawDate?: string      // fecha del sorteo al que va dirigida
  createdAt: number
  result?: {
    numbersHit: number
    starsHit: number
    prize: string
  }
}

const PATH = 'bets'

export function useBets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, PATH), (snapshot) => {
      const data: Bet[] = []
      snapshot.forEach((child) => {
        data.push({ id: child.key!, ...child.val() })
      })
      data.sort((a, b) => b.createdAt - a.createdAt)
      setBets(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addBet = async (bet: Omit<Bet, 'id' | 'createdAt'>) => {
    await push(ref(db, PATH), { ...bet, createdAt: Date.now() })
  }

  const deleteBet = async (id: string) => {
    await remove(ref(db, `${PATH}/${id}`))
  }

  const evaluateBet = async (id: string, actualNumbers: number[], actualStars: number[], bet: Bet) => {
    const numbersHit = bet.numbers.filter(n => actualNumbers.includes(n)).length
    const starsHit = bet.stars.filter(n => actualStars.includes(n)).length
    const prize = getPrize(numbersHit, starsHit)
    await update(ref(db, `${PATH}/${id}`), { result: { numbersHit, starsHit, prize } })
  }

  return { bets, loading, addBet, deleteBet, evaluateBet }
}

function getPrize(nums: number, stars: number): string {
  if (nums === 5 && stars === 2) return '🏆 JACKPOT'
  if (nums === 5 && stars === 1) return '🥇 2º Premio'
  if (nums === 5 && stars === 0) return '🥈 3º Premio'
  if (nums === 4 && stars === 2) return '🥉 4º Premio'
  if (nums === 4 && stars === 1) return '🎯 5º Premio'
  if (nums === 3 && stars === 2) return '🎯 6º Premio'
  if (nums === 4 && stars === 0) return '🎯 7º Premio'
  if (nums === 2 && stars === 2) return '🎯 8º Premio'
  if (nums === 3 && stars === 1) return '🎯 9º Premio'
  if (nums === 3 && stars === 0) return '🎯 10º Premio'
  if (nums === 1 && stars === 2) return '🎯 11º Premio'
  if (nums === 2 && stars === 1) return '🎯 12º Premio'
  if (nums === 2 && stars === 0) return '🎯 13º Premio'
  return '❌ Sin premio'
}
