import type { features } from './features'

export interface Point {
  x: number
  y: number
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type Obstacle =
  {
    type: 'circle' | 'polygon'
    lines: Line[]
    fill?: boolean
  }
  | {
    type: 'line'
    line: Line
  }

export type FeatureKey = keyof typeof features['fns']
export type Features = {
  [K in FeatureKey]: number
}
export type FeatureConfig = {
  [K in FeatureKey]?: boolean;
}
