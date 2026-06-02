export interface Draw {
  id?: string
  date: string
  numbers: number[]   // 5 números del 1 al 50
  stars: number[]     // 2 estrellas del 1 al 12
  jackpot?: string    // Premio bote (opcional)
  createdAt?: number
}

export interface Prediction {
  strategy: string
  description: string
  numbers: number[]
  stars: number[]
  confidence: number  // 0-100
  reasoning: string
}

export interface FrequencyMap {
  [key: number]: number
}

export interface AnalysisResult {
  hotNumbers: number[]
  coldNumbers: number[]
  hotStars: number[]
  coldStars: number[]
  mostCommonPairs: Array<[number, number]>
  averageGap: number
  predictions: Prediction[]
}
