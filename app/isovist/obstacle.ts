import type { Line, Obstacle } from './types'

function createCircle(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const segments = 48
  const lines: Line[] = []
  const step = (endAngle - startAngle) / segments
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * step
    const a2 = a1 + step
    lines.push({
      x1: cx + Math.cos(a1) * radius,
      y1: cy + Math.sin(a1) * radius,
      x2: cx + Math.cos(a2) * radius,
      y2: cy + Math.sin(a2) * radius,
    })
  }
  return lines
}

export const obstacles: Obstacle[] = [
  // outline
  {
    type: 'circle',
    lines: createCircle(300, 300, 300, 0, Math.PI * 2),
  },

  // 1
  {
    type: 'line',
    line: { x1: 90, y1: 150, x2: 90, y2: 285 },
  },
  {
    type: 'line',
    line: { x1: 90, y1: 315, x2: 90, y2: 450 },
  },

  // 2
  {
    type: 'line',
    line: { x1: 170, y1: 120, x2: 170, y2: 200 },
  },
  {
    type: 'circle',
    lines: createCircle(171, 250, 50, Math.PI / 2, 3 * Math.PI / 2),
  },
  {
    type: 'line',
    line: { x1: 170, y1: 300, x2: 170, y2: 380 },
  },
  {
    type: 'line',
    line: { x1: 170, y1: 400, x2: 170, y2: 480 },
  },

  // 3
  {
    type: 'line',
    line: { x1: 220, y1: 120, x2: 220, y2: 230 },
  },
  {
    type: 'circle',
    lines: createCircle(220, 250, 8, 0, Math.PI * 2),
    fill: true,
  },
  {
    type: 'line',
    line: { x1: 220, y1: 270, x2: 220, y2: 300 },
  },
  {
    type: 'circle',
    lines: createCircle(219, 330, 30, Math.PI / 2, -Math.PI / 2),
  },
  {
    type: 'line',
    line: { x1: 220, y1: 360, x2: 220, y2: 480 },
  },

  // 4
  {
    type: 'line',
    line: { x1: 270, y1: 120, x2: 270, y2: 160 },
  },
  {
    type: 'line',
    line: { x1: 270, y1: 180, x2: 270, y2: 230 },
  },
  {
    type: 'circle',
    lines: createCircle(269, 303, 75, Math.PI / 2, -Math.PI / 2),
  },
  {
    type: 'line',
    line: { x1: 270, y1: 379, x2: 270, y2: 480 },
  },
  {
    type: 'circle',
    lines: createCircle(280, 290, 20, 0, Math.PI * 2),
    fill: true,
  },

  // 5
  {
    type: 'polygon',
    lines: [
      { x1: 325, y1: 120, x2: 325, y2: 210 },
      { x1: 325, y1: 210, x2: 335, y2: 210 },
      { x1: 335, y1: 200, x2: 335, y2: 210 },
      { x1: 345, y1: 200, x2: 335, y2: 200 },
      { x1: 345, y1: 150, x2: 345, y2: 200 },
      { x1: 335, y1: 150, x2: 345, y2: 150 },
      { x1: 335, y1: 120, x2: 335, y2: 150 },
      { x1: 335, y1: 150, x2: 335, y2: 120 },
    ],
    fill: true,
  },
  {
    type: 'polygon',
    lines: [
      { x1: 395, y1: 120, x2: 395, y2: 210 },
      { x1: 385, y1: 210, x2: 395, y2: 210 },
      { x1: 385, y1: 200, x2: 385, y2: 210 },
      { x1: 375, y1: 200, x2: 385, y2: 200 },
      { x1: 375, y1: 150, x2: 375, y2: 200 },
      { x1: 385, y1: 150, x2: 375, y2: 150 },
      { x1: 385, y1: 120, x2: 385, y2: 150 },
      { x1: 395, y1: 120, x2: 385, y2: 120 },
    ],
    fill: true,
  },
  {
    type: 'polygon',
    lines: [
      { x1: 325, y1: 480, x2: 325, y2: 390 },
      { x1: 335, y1: 390, x2: 325, y2: 390 },
      { x1: 335, y1: 400, x2: 335, y2: 390 },
      { x1: 345, y1: 400, x2: 335, y2: 400 },
      { x1: 345, y1: 450, x2: 345, y2: 400 },
      { x1: 335, y1: 450, x2: 345, y2: 450 },
      { x1: 335, y1: 480, x2: 335, y2: 450 },
      { x1: 325, y1: 480, x2: 335, y2: 480 },
    ],
    fill: true,
  },
  {
    type: 'polygon',
    lines: [
      { x1: 395, y1: 480, x2: 395, y2: 390 },
      { x1: 385, y1: 390, x2: 395, y2: 390 },
      { x1: 385, y1: 400, x2: 385, y2: 390 },
      { x1: 375, y1: 400, x2: 385, y2: 400 },
      { x1: 375, y1: 450, x2: 375, y2: 400 },
      { x1: 385, y1: 450, x2: 375, y2: 450 },
      { x1: 385, y1: 480, x2: 385, y2: 450 },
      { x1: 395, y1: 480, x2: 385, y2: 480 },
    ],
    fill: true,
  },

  {
    type: 'circle',
    lines: createCircle(390, 260, 20, 3 * Math.PI / 4, 9 * Math.PI / 4),
  },

  // 6
  {
    type: 'line',
    line: { x1: 440, y1: 120, x2: 440, y2: 210 },
  },
  {
    type: 'line',
    line: { x1: 440, y1: 240, x2: 440, y2: 290 },
  },
  {
    type: 'circle',
    lines: createCircle(441, 340, 50, Math.PI / 2, 3 * Math.PI / 2),
  },
  {
    type: 'line',
    line: { x1: 440, y1: 390, x2: 440, y2: 480 },
  },
  {
    type: 'circle',
    lines: createCircle(460, 340, 20, 0, Math.PI * 2),
    fill: true,
  },

  // 7
  {
    type: 'line',
    line: { x1: 510, y1: 150, x2: 510, y2: 285 },
  },
  {
    type: 'line',
    line: { x1: 510, y1: 315, x2: 510, y2: 450 },
  },

  // Others
  {
    type: 'circle',
    lines: createCircle(240, 60, 10, 0, Math.PI * 2),
    fill: true,
  },
  {
    type: 'circle',
    lines: createCircle(240, 540, 10, 0, Math.PI * 2),
    fill: true,
  },
]
