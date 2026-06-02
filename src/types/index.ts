export interface Draw {
  id?: string
  date: string       // generado automáticamente al guardar
  numbers: number[]
  stars: number[]
  jackpot?: string
  createdAt?: number
}

export interface Prediction {
  strategy: string
  description: string
  numbers: number[]
  stars: number[]
  confidence: number
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
