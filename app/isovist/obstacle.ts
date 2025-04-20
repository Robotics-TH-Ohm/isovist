import type { Obstacle } from './types'

function createCircleObstacle(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): Obstacle[] {
  const segments = 48
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

export const map2: Obstacle[] = [
  // outline
  ...createCircleObstacle(300, 300, 297, 0, Math.PI * 2),

  // 1
  { x1: 90, y1: 150, x2: 90, y2: 285 },
  { x1: 90, y1: 315, x2: 90, y2: 450 },

  // 2
  { x1: 170, y1: 120, x2: 170, y2: 200 },
  ...createCircleObstacle(173, 250, 50, Math.PI / 2, 3 * Math.PI / 2),
  { x1: 170, y1: 300, x2: 170, y2: 380 },
  { x1: 170, y1: 400, x2: 170, y2: 480 },

  // 3
  { x1: 220, y1: 120, x2: 220, y2: 230 },
  ...createCircleObstacle(220, 250, 8, 0, Math.PI * 2),
  { x1: 220, y1: 270, x2: 220, y2: 300 },
  ...createCircleObstacle(218, 330, 30, Math.PI / 2, -Math.PI / 2),
  { x1: 220, y1: 360, x2: 220, y2: 480 },

  // 4
  { x1: 270, y1: 120, x2: 270, y2: 160 },
  { x1: 270, y1: 180, x2: 270, y2: 230 },
  ...createCircleObstacle(267, 303, 75, Math.PI / 2, -Math.PI / 2),
  { x1: 270, y1: 380, x2: 270, y2: 480 },
  ...createCircleObstacle(280, 290, 20, 0, Math.PI * 2),

  // 5
  { x1: 325, y1: 120, x2: 325, y2: 210 },
  { x1: 323, y1: 120, x2: 335, y2: 120 },
  { x1: 333, y1: 120, x2: 333, y2: 150 },
  { x1: 331, y1: 150, x2: 345, y2: 150 },
  { x1: 343, y1: 150, x2: 343, y2: 200 },
  { x1: 345, y1: 200, x2: 333, y2: 200 },
  { x1: 335, y1: 200, x2: 335, y2: 210 },
  { x1: 335, y1: 208, x2: 325, y2: 208 },

  { x1: 395, y1: 120, x2: 395, y2: 210 },
  { x1: 397, y1: 120, x2: 385, y2: 120 },
  { x1: 387, y1: 120, x2: 387, y2: 150 },
  { x1: 389, y1: 150, x2: 375, y2: 150 },
  { x1: 377, y1: 150, x2: 377, y2: 200 },
  { x1: 375, y1: 200, x2: 387, y2: 200 },
  { x1: 385, y1: 200, x2: 385, y2: 210 },
  { x1: 385, y1: 208, x2: 395, y2: 208 },

  { x1: 325, y1: 480, x2: 325, y2: 390 },
  { x1: 323, y1: 480, x2: 335, y2: 480 },
  { x1: 333, y1: 480, x2: 333, y2: 450 },
  { x1: 331, y1: 450, x2: 345, y2: 450 },
  { x1: 343, y1: 450, x2: 343, y2: 400 },
  { x1: 345, y1: 400, x2: 333, y2: 400 },
  { x1: 335, y1: 400, x2: 335, y2: 390 },
  { x1: 335, y1: 392, x2: 325, y2: 392 },

  { x1: 395, y1: 480, x2: 395, y2: 390 },
  { x1: 397, y1: 480, x2: 385, y2: 480 },
  { x1: 387, y1: 480, x2: 387, y2: 450 },
  { x1: 389, y1: 450, x2: 375, y2: 450 },
  { x1: 377, y1: 450, x2: 377, y2: 400 },
  { x1: 375, y1: 400, x2: 387, y2: 400 },
  { x1: 385, y1: 400, x2: 385, y2: 390 },
  { x1: 385, y1: 392, x2: 395, y2: 392 },

  ...createCircleObstacle(390, 260, 20, 3 * Math.PI / 4, 9 * Math.PI / 4),

  // 6
  { x1: 440, y1: 120, x2: 440, y2: 210 },
  { x1: 440, y1: 240, x2: 440, y2: 290 },
  ...createCircleObstacle(443, 340, 50, Math.PI / 2, 3 * Math.PI / 2),
  { x1: 440, y1: 390, x2: 440, y2: 480 },
  ...createCircleObstacle(460, 340, 20, 0, Math.PI * 2),

  // 7
  { x1: 510, y1: 150, x2: 510, y2: 285 },
  { x1: 510, y1: 315, x2: 510, y2: 450 },

  // Others
  ...createCircleObstacle(240, 60, 10, 0, Math.PI * 2),
  ...createCircleObstacle(240, 540, 10, 0, Math.PI * 2),
]
