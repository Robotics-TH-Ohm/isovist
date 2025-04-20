export interface Point {
  x: number
  y: number
}

export interface Features {
  area: number
  perimeter: number
  occlusivity: number
  m1: number
  m2: number
}

export interface Fingerprint {
  position: Point
  features: Features
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
