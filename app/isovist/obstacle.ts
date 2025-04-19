import type { Obstacle } from './types'

export function createCircleObstacle(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): Obstacle[] {
  const segments = 96
  const result: Obstacle[] = []
  const step = (endAngle - startAngle) / segments
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * step
    const a2 = a1 + step
    result.push({
      x1: cx + Math.cos(a1) * radius,
      y1: cy + Math.sin(a1) * radius,
      x2: cx + Math.cos(a2) * radius,
      y2: cy + Math.sin(a2) * radius,
    })
  }
  return result
}
