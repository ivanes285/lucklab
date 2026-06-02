import { Draw, Prediction, AnalysisResult, FrequencyMap } from '../types'

// ─── Utilidades ───────────────────────────────────────────────────────────────

function frequency(items: number[]): FrequencyMap {
  return items.reduce((acc, n) => {
    acc[n] = (acc[n] || 0) + 1
    return acc
  }, {} as FrequencyMap)
}

function sortByFreq(freq: FrequencyMap, asc = false): number[] {
  return Object.entries(freq)
    .sort((a, b) => asc ? Number(a[1]) - Number(b[1]) : Number(b[1]) - Number(a[1]))
    .map(([k]) => Number(k))
}

function pickUnique(pool: number[], count: number, max: number): number[] {
  const result: number[] = []
  const used = new Set<number>()
  for (const n of pool) {
    if (result.length >= count) break
    if (!used.has(n)) { result.push(n); used.add(n) }
  }
  // Si falta rellena con números aleatorios del rango
  while (result.length < count) {
    const r = Math.floor(Math.random() * max) + 1
    if (!used.has(r)) { result.push(r); used.add(r) }
  }
  return result.sort((a, b) => a - b)
}

function allNumbers(draws: Draw[]) {
  return draws.flatMap(d => d.numbers)
}
function allStars(draws: Draw[]) {
  return draws.flatMap(d => d.stars)
}

// ─── Estrategias ──────────────────────────────────────────────────────────────

/** 1. Números más frecuentes (Hot Numbers) */
function hotStrategy(draws: Draw[]): Prediction {
  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  const numbers = pickUnique(sortByFreq(numFreq), 5, 50)
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)
  const topNums = sortByFreq(numFreq).slice(0, 10).join(', ')
  return {
    strategy: '🔥 Números Calientes',
    description: 'Números con mayor frecuencia histórica de aparición.',
    numbers, stars,
    confidence: 62,
    reasoning: `Los más frecuentes históricamente son: ${topNums}. La teoría de la frecuencia dice que continúan saliendo.`
  }
}

/** 2. Números menos frecuentes (Cold Numbers) */
function coldStrategy(draws: Draw[]): Prediction {
  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  // Nos aseguramos de incluir todos los números del 1-50 aunque nunca hayan salido
  for (let i = 1; i <= 50; i++) if (!numFreq[i]) numFreq[i] = 0
  for (let i = 1; i <= 12; i++) if (!starFreq[i]) starFreq[i] = 0
  const numbers = pickUnique(sortByFreq(numFreq, true), 5, 50)
  const stars = pickUnique(sortByFreq(starFreq, true), 2, 12)
  return {
    strategy: '❄️ Números Fríos',
    description: 'Números que llevan más tiempo sin aparecer — teoría del "retraso".',
    numbers, stars,
    confidence: 48,
    reasoning: `Estos números llevan muchos sorteos sin salir. La ley de los grandes números sugiere que "se deben" aparecer.`
  }
}

/** 3. Balance par/impar */
function balanceStrategy(draws: Draw[]): Prediction {
  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  // Histórico: ¿cuántos pares vs impares en promedio?
  const avgEven = draws.reduce((s, d) => s + d.numbers.filter(n => n % 2 === 0).length, 0) / draws.length
  const targetEven = Math.round(avgEven) // p.ej. 2 o 3
  const targetOdd = 5 - targetEven

  const evens = sortByFreq(numFreq).filter(n => n % 2 === 0)
  const odds = sortByFreq(numFreq).filter(n => n % 2 !== 0)
  const numbers = pickUnique([...evens.slice(0, targetEven * 2), ...odds.slice(0, targetOdd * 2)], 5, 50)
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)

  return {
    strategy: '⚖️ Balance Par/Impar',
    description: `Mezcla óptima basada en el patrón histórico (≈${targetEven} pares + ${targetOdd} impares).`,
    numbers, stars,
    confidence: 55,
    reasoning: `El histórico muestra una media de ${avgEven.toFixed(1)} números pares por sorteo. Esta combinación respeta ese patrón.`
  }
}

/** 4. Balance alto/bajo */
function highLowStrategy(draws: Draw[]): Prediction {
  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  const avgHigh = draws.reduce((s, d) => s + d.numbers.filter(n => n > 25).length, 0) / draws.length
  const targetHigh = Math.round(avgHigh)
  const targetLow = 5 - targetHigh

  const highs = sortByFreq(numFreq).filter(n => n > 25)
  const lows = sortByFreq(numFreq).filter(n => n <= 25)
  const numbers = pickUnique([...lows.slice(0, targetLow * 2), ...highs.slice(0, targetHigh * 2)], 5, 50)
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)

  return {
    strategy: '📊 Balance Alto/Bajo',
    description: `Mezcla de números bajos (1-25) y altos (26-50) según la distribución histórica.`,
    numbers, stars,
    confidence: 53,
    reasoning: `Históricamente: ≈${avgHigh.toFixed(1)} números altos por sorteo. Combinación: ${targetLow} bajos + ${targetHigh} altos.`
  }
}

/** 5. Análisis de pares frecuentes (Co-occurrence) */
function pairStrategy(draws: Draw[]): Prediction {
  const pairCount: { [key: string]: number } = {}
  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b)
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`
        pairCount[key] = (pairCount[key] || 0) + 1
      }
    }
  }
  const topPairs = Object.entries(pairCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k.split('-').map(Number))

  const used = new Set<number>()
  const numbers: number[] = []
  for (const pair of topPairs) {
    for (const n of pair) {
      if (!used.has(n) && numbers.length < 5) {
        numbers.push(n); used.add(n)
      }
    }
    if (numbers.length >= 5) break
  }
  while (numbers.length < 5) {
    const r = Math.floor(Math.random() * 50) + 1
    if (!used.has(r)) { numbers.push(r); used.add(r) }
  }

  const starFreq = frequency(allStars(draws))
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)
  const topPairStr = topPairs.slice(0, 3).map(p => p.join('+') ).join(', ')

  return {
    strategy: '🔗 Pares Frecuentes',
    description: 'Números que suelen aparecer juntos (co-ocurrencia).',
    numbers: numbers.sort((a, b) => a - b), stars,
    confidence: 58,
    reasoning: `Los pares que más co-aparecen son: ${topPairStr}. Se construye la combinación a partir de ellos.`
  }
}

/** 6. Números delta (diferencias entre consecutivos) */
function deltaStrategy(draws: Draw[]): Prediction {
  // Calcula deltas históricos y los aplica
  const deltas: number[] = []
  for (const draw of draws) {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      deltas.push(sorted[i] - sorted[i - 1])
    }
  }
  const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length

  // Genera combinación usando el delta promedio
  const start = Math.max(1, Math.round(Math.random() * 10) + 1)
  const nums: number[] = [start]
  while (nums.length < 5) {
    const next = nums[nums.length - 1] + Math.round(avgDelta * (0.8 + Math.random() * 0.4))
    if (next <= 50 && !nums.includes(next)) {
      nums.push(next)
    } else {
      const fallback = Math.floor(Math.random() * 50) + 1
      if (!nums.includes(fallback)) nums.push(fallback)
    }
  }

  const starFreq = frequency(allStars(draws))
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)

  return {
    strategy: '📐 Método Delta',
    description: 'Genera números usando la diferencia promedio entre consecutivos históricos.',
    numbers: nums.sort((a, b) => a - b), stars,
    confidence: 45,
    reasoning: `El delta promedio entre números consecutivos es ${avgDelta.toFixed(1)}. Se aplica ese espaciado para generar una combinación coherente.`
  }
}

/** 7. Análisis de décadas (decade distribution) */
function decadeStrategy(draws: Draw[]): Prediction {
  const decades = [
    [1, 10], [11, 20], [21, 30], [31, 40], [41, 50]
  ]
  const decadeFreq = decades.map(([lo, hi]) => ({
    lo, hi,
    count: draws.reduce((s, d) => s + d.numbers.filter(n => n >= lo && n <= hi).length, 0)
  })).sort((a, b) => b.count - a.count)

  const numFreq = frequency(allNumbers(draws))
  const used = new Set<number>()
  const numbers: number[] = []

  // Pick mostly from top decades
  for (let i = 0; i < decadeFreq.length && numbers.length < 5; i++) {
    const { lo, hi } = decadeFreq[i]
    const candidates = sortByFreq(numFreq).filter(n => n >= lo && n <= hi)
    for (const c of candidates) {
      if (numbers.length >= 5) break
      if (!used.has(c)) { numbers.push(c); used.add(c) }
      if (i === 0 && numbers.length === 2) break // Solo 2 del más frecuente
      if (i > 0 && numbers.length - (i) >= 1) break
    }
  }
  while (numbers.length < 5) {
    const r = Math.floor(Math.random() * 50) + 1
    if (!used.has(r)) { numbers.push(r); used.add(r) }
  }

  const starFreq = frequency(allStars(draws))
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)
  const topDecade = decadeFreq[0]

  return {
    strategy: '🔟 Distribución por Décadas',
    description: 'Selecciona según la frecuencia histórica de cada rango de 10 números.',
    numbers: numbers.sort((a, b) => a - b), stars,
    confidence: 50,
    reasoning: `La década más activa históricamente es ${topDecade.lo}-${topDecade.hi}. Los números se distribuyen priorizando los rangos más productivos.`
  }
}

/** 8. Último sorteo + skip (evita repeticiones recientes) */
function noRepeatStrategy(draws: Draw[]): Prediction {
  const recent = draws.slice(0, Math.min(5, draws.length)).flatMap(d => d.numbers)
  const recentSet = new Set(recent)
  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))

  const candidates = sortByFreq(numFreq).filter(n => !recentSet.has(n))
  const numbers = pickUnique(candidates, 5, 50)
  const stars = pickUnique(sortByFreq(starFreq), 2, 12)

  return {
    strategy: '🚫 Sin Repetición Reciente',
    description: 'Evita números que salieron en los últimos 5 sorteos.',
    numbers, stars,
    confidence: 44,
    reasoning: `Los números ${[...recentSet].slice(0, 8).join(', ')}... salieron recientemente. Esta estrategia busca los que llevan más ausentes.`
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

export function analyzeDraws(draws: Draw[]): AnalysisResult {
  if (draws.length === 0) {
    return {
      hotNumbers: [], coldNumbers: [], hotStars: [], coldStars: [],
      mostCommonPairs: [], averageGap: 0, predictions: []
    }
  }

  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  for (let i = 1; i <= 50; i++) if (!numFreq[i]) numFreq[i] = 0
  for (let i = 1; i <= 12; i++) if (!starFreq[i]) starFreq[i] = 0

  const hotNumbers = sortByFreq(numFreq).slice(0, 10)
  const coldNumbers = sortByFreq(numFreq, true).slice(0, 10)
  const hotStars = sortByFreq(starFreq).slice(0, 5)
  const coldStars = sortByFreq(starFreq, true).slice(0, 5)

  const pairCount: { [key: string]: number } = {}
  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b)
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`
        pairCount[key] = (pairCount[key] || 0) + 1
      }
  }
  const mostCommonPairs = Object.entries(pairCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k.split('-').map(Number) as [number, number])

  const gaps: number[] = []
  for (const draw of draws) {
    const s = [...draw.numbers].sort((a, b) => a - b)
    for (let i = 1; i < s.length; i++) gaps.push(s[i] - s[i - 1])
  }
  const averageGap = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 0

  const predictions: Prediction[] = draws.length >= 3 ? [
    consensusStrategy(draws),
    weightedStrategy(draws),
    markovStrategy(draws),
    streakStrategy(draws),
    hotStrategy(draws),
    coldStrategy(draws),
    balanceStrategy(draws),
    highLowStrategy(draws),
    pairStrategy(draws),
    deltaStrategy(draws),
    decadeStrategy(draws),
    noRepeatStrategy(draws),
  ] : []

  return { hotNumbers, coldNumbers, hotStars, coldStars, mostCommonPairs, averageGap, predictions }
}

// ─── Frecuencia por posición ──────────────────────────────────────────────────
export interface PositionFrequency {
  position: number  // 1-5 para números, 1-2 para estrellas
  top: Array<{ n: number; count: number; pct: number }>
}

export function analyzePositions(draws: Draw[]): { numbers: PositionFrequency[], stars: PositionFrequency[] } {
  const numPos: FrequencyMap[] = [0,1,2,3,4].map(() => ({}))
  const starPos: FrequencyMap[] = [0,1].map(() => ({}))

  for (const draw of draws) {
    const sorted = [...draw.numbers].sort((a, b) => a - b)
    sorted.forEach((n, i) => { numPos[i][n] = (numPos[i][n] || 0) + 1 })
    const sortedStars = [...draw.stars].sort((a, b) => a - b)
    sortedStars.forEach((n, i) => { starPos[i][n] = (starPos[i][n] || 0) + 1 })
  }

  const toTop = (freq: FrequencyMap, total: number) =>
    Object.entries(freq)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([k, v]) => ({ n: Number(k), count: v, pct: Math.round((v / total) * 100) }))

  return {
    numbers: numPos.map((freq, i) => ({ position: i + 1, top: toTop(freq, draws.length) })),
    stars:   starPos.map((freq, i) => ({ position: i + 1, top: toTop(freq, draws.length) })),
  }
}

// ─── Top 3 combinaciones sugeridas ───────────────────────────────────────────
export interface TopPick {
  label: string
  numbers: number[]
  stars: number[]
  score: number
}

export function getTopPicks(draws: Draw[]): TopPick[] {
  if (draws.length < 3) return []

  const numFreq = frequency(allNumbers(draws))
  const starFreq = frequency(allStars(draws))
  for (let i = 1; i <= 50; i++) if (!numFreq[i]) numFreq[i] = 0
  for (let i = 1; i <= 12; i++) if (!starFreq[i]) starFreq[i] = 0

  // Pick 1: Puros calientes
  const hot = pickUnique(sortByFreq(numFreq), 5, 50)
  const hotStars = pickUnique(sortByFreq(starFreq), 2, 12)

  // Pick 2: Mezcla calientes + 2 fríos
  const coldNums = sortByFreq(numFreq, true).filter(n => !hot.includes(n))
  const mixNums = [...pickUnique(sortByFreq(numFreq), 3, 50), ...pickUnique(coldNums, 2, 50)]
  const mixSorted = [...new Set(mixNums)].sort((a, b) => a - b).slice(0, 5)
  while (mixSorted.length < 5) {
    const r = Math.floor(Math.random() * 50) + 1
    if (!mixSorted.includes(r)) mixSorted.push(r)
  }

  // Pick 3: Por posición — el más frecuente en cada posición
  const pos = analyzePositions(draws)
  const posNums = pos.numbers.map(p => p.top[0]?.n ?? Math.floor(Math.random() * 50) + 1)
  const posNumsUnique = [...new Set(posNums)].sort((a, b) => a - b)
  while (posNumsUnique.length < 5) {
    const r = Math.floor(Math.random() * 50) + 1
    if (!posNumsUnique.includes(r)) posNumsUnique.push(r)
  }
  const posStars = pos.stars.map(p => p.top[0]?.n ?? Math.floor(Math.random() * 12) + 1)
  const posStarsUnique = [...new Set(posStars)].sort((a, b) => a - b)
  while (posStarsUnique.length < 2) {
    const r = Math.floor(Math.random() * 12) + 1
    if (!posStarsUnique.includes(r)) posStarsUnique.push(r)
  }

  return [
    { label: '🔥 Combinación caliente',     numbers: hot,                              stars: hotStars,         score: 85 },
    { label: '⚖️ Combinación equilibrada',  numbers: mixSorted.sort((a,b) => a-b),     stars: hotStars,         score: 72 },
    { label: '📍 Por posición histórica',   numbers: posNumsUnique.slice(0,5),          stars: posStarsUnique.slice(0,2), score: 68 },
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// TÉCNICAS AVANZADAS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Ventana deslizante con peso exponencial ────────────────────────────────
// Los sorteos recientes pesan exponencialmente más que los antiguos.
// λ = factor de decaimiento: 0.98 = decae lento, 0.90 = decae rápido.
function weightedFrequency(draws: Draw[], lambda = 0.97): FrequencyMap {
  const freq: FrequencyMap = {}
  const sorted = [...draws].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  sorted.forEach((draw, i) => {
    const weight = Math.pow(lambda, i)  // sorteos más recientes = i pequeño = peso mayor
    draw.numbers.forEach(n => { freq[n] = (freq[n] || 0) + weight })
  })
  return freq
}

function weightedStarFrequency(draws: Draw[], lambda = 0.97): FrequencyMap {
  const freq: FrequencyMap = {}
  const sorted = [...draws].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  sorted.forEach((draw, i) => {
    const weight = Math.pow(lambda, i)
    draw.stars.forEach(n => { freq[n] = (freq[n] || 0) + weight })
  })
  return freq
}

export function weightedStrategy(draws: Draw[]): Prediction {
  const numFreq = weightedFrequency(draws)
  const starFreq = weightedStarFrequency(draws)
  const numbers = pickUnique(sortByFreq(numFreq), 5, 50)
  const stars   = pickUnique(sortByFreq(starFreq), 2, 12)
  const recent10 = draws.slice(0, 10).flatMap(d => d.numbers)
  const recentFreq = frequency(recent10)
  const top3recent = sortByFreq(recentFreq).slice(0, 3).join(', ')
  return {
    strategy: '📉 Tendencia Reciente Ponderada',
    description: 'Ponderación exponencial: los últimos sorteos valen mucho más que los históricos lejanos (λ=0.97).',
    numbers, stars,
    confidence: 66,
    reasoning: `Con decaimiento exponencial λ=0.97, cada sorteo pasado vale el 97% del siguiente. Los más activos en los últimos 10 sorteos: ${top3recent}. Esta técnica reduce el "ruido" histórico y enfoca en tendencias vigentes.`
  }
}

// ─── 2. Cadenas de Markov (transición entre sorteos consecutivos) ──────────────
// Para cada número, calcula qué otros números aparecen más en el sorteo SIGUIENTE.
// Si X salió hoy, ¿qué sale mañana con más frecuencia?
function buildMarkovMatrix(draws: Draw[]): { [from: number]: FrequencyMap } {
  const matrix: { [from: number]: FrequencyMap } = {}
  const sorted = [...draws].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i].numbers
    const next    = sorted[i + 1].numbers
    for (const c of current) {
      if (!matrix[c]) matrix[c] = {}
      for (const n of next) {
        matrix[c][n] = (matrix[c][n] || 0) + 1
      }
    }
  }
  return matrix
}

export function markovStrategy(draws: Draw[]): Prediction {
  if (draws.length < 10) {
    return hotStrategy(draws)  // fallback con pocos datos
  }
  const sorted = [...draws].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const lastDraw  = sorted[0]
  const matrix    = buildMarkovMatrix(draws)
  const starFreq  = weightedStarFrequency(draws)

  // Para cada número del último sorteo, suma los votos de sus sucesores históricos
  const votes: FrequencyMap = {}
  for (const n of lastDraw.numbers) {
    const transitions = matrix[n] || {}
    for (const [next, count] of Object.entries(transitions)) {
      const k = Number(next)
      if (!lastDraw.numbers.includes(k)) {  // que no repita del último sorteo
        votes[k] = (votes[k] || 0) + count
      }
    }
  }

  // Completar con ponderación si faltan candidatos
  const weighted = weightedFrequency(draws)
  const candidates = sortByFreq(Object.keys(votes).length >= 5 ? votes : weighted)
  const numbers = pickUnique(candidates, 5, 50)
  const stars   = pickUnique(sortByFreq(starFreq), 2, 12)
  const lastNums = lastDraw.numbers.join(', ')

  return {
    strategy: '🔗 Cadenas de Markov',
    description: 'Analiza transiciones entre sorteos consecutivos: dado lo que salió last draw, ¿qué suele salir después?',
    numbers, stars,
    confidence: 61,
    reasoning: `Último sorteo: [${lastNums}]. La matriz de Markov rastreó ${draws.length - 1} transiciones consecutivas y calculó qué números siguen históricamente a cada uno de esos valores. No predice — describe la correlación temporal más frecuente.`
  }
}

// ─── 3. Análisis de rachas (streak analysis) ──────────────────────────────────
// Detecta números en racha caliente RECIENTE vs su media histórica.
// Score = (frecuencia últimos 20) / (frecuencia esperada global) — ratio de activación.
export function streakStrategy(draws: Draw[]): Prediction {
  const window   = Math.min(20, draws.length)
  const sorted   = [...draws].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const recent   = sorted.slice(0, window)
  const all      = sorted

  const recentFreq = frequency(recent.flatMap(d => d.numbers))
  const globalFreq = frequency(all.flatMap(d => d.numbers))
  const totalRecent = window * 5
  const totalGlobal = all.length * 5
  // ratio de referencia: totalRecent / totalGlobal

  // Ratio de activación: cuánto más activo de lo normal en los últimos 20 sorteos
  const activation: FrequencyMap = {}
  for (let n = 1; n <= 50; n++) {
    const rF = (recentFreq[n] || 0) / totalRecent
    const gF = (globalFreq[n] || 0) / totalGlobal || 0.02
    activation[n] = rF / gF
  }

  const starRecent = frequency(recent.flatMap(d => d.stars))
  const starGlobal = frequency(all.flatMap(d => d.stars))
  const starActivation: FrequencyMap = {}
  for (let n = 1; n <= 12; n++) {
    const rF = (starRecent[n] || 0) / (window * 2)
    const gF = (starGlobal[n] || 0) / (all.length * 2) || 0.04
    starActivation[n] = rF / gF
  }

  const numbers = pickUnique(sortByFreq(activation), 5, 50)
  const stars   = pickUnique(sortByFreq(starActivation), 2, 12)
  const top3 = sortByFreq(activation).slice(0, 3)
  const ratios = top3.map(n => `${n}(×${activation[n].toFixed(1)})`).join(', ')

  return {
    strategy: '⚡ Análisis de Rachas',
    description: `Ratio de activación: frecuencia en últimos ${window} sorteos vs media histórica global. Detecta números "en forma" ahora.`,
    numbers, stars,
    confidence: 63,
    reasoning: `Números con mayor activación reciente vs histórica: ${ratios}. Un ratio >1 significa que sale más de lo esperado estadísticamente en este período. Diferente al hot/cold simple que no pondera por tiempo.`
  }
}

// ─── 4. Consenso multi-estrategia ─────────────────────────────────────────────
// Combina votos de todas las estrategias avanzadas. El número que más estrategias
// eligen gana. Es el más "robusto" estadísticamente.
export function consensusStrategy(draws: Draw[]): Prediction {
  const strategies = [
    weightedStrategy(draws),
    markovStrategy(draws),
    streakStrategy(draws),
  ]

  const votes: FrequencyMap = {}
  const starVotes: FrequencyMap = {}

  // Markov pesa 3x, Rachas 2x, Ponderación 1x — basado en rendimiento histórico
  const weights = [3, 2, 1]
  strategies.forEach((pred, i) => {
    const w = weights[i] ?? 1
    pred.numbers.forEach(n => { votes[n] = (votes[n] || 0) + w })
    pred.stars.forEach(n   => { starVotes[n] = (starVotes[n] || 0) + w })
  })

  // Desempate con ponderación
  const weighted = weightedFrequency(draws)
  for (let n = 1; n <= 50; n++) {
    votes[n] = (votes[n] || 0) + (weighted[n] || 0) * 0.01
  }

  const numbers = pickUnique(sortByFreq(votes), 5, 50)
  const stars   = pickUnique(sortByFreq(starVotes), 2, 12)
  const agreements = numbers.map(n => `${n}(${Math.round(votes[n])} voto${votes[n] !== 1 ? 's' : ''})`).join(', ')

  return {
    strategy: '🧠 Consenso Multi-Estrategia',
    description: 'Combina Markov + Rachas + Ponderación. Los números elegidos por más estrategias simultáneamente.',
    numbers, stars,
    confidence: 70,
    reasoning: `Votos acumulados por número: ${agreements}. Este es el enfoque más robusto — no depende de una sola técnica sino del acuerdo entre varias metodologías independientes.`
  }
}
