import type { FEATURE_KEYS } from './features'

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
    type: 'circle'
    lines: Line[]
    cx: number
    cy: number
    r: number
    fill?: boolean
    border?: boolean
  } |
  {
    type: 'polygon'
    lines: Line[]
    fill?: boolean
  }
  | {
    type: 'line'
    line: Line
  }

export interface MapConfig {
  width: number
  height: number
  cx: number
  cy: number
  r: number
  cell: number
  lineWidth: number
}

export type FeatureKey = typeof FEATURE_KEYS[number]
export type Features = {
  [K in FeatureKey]: number
}
