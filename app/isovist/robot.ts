interface Config {
  x?: number
  y?: number
}

const SPEED = 1

export class Robot {
  x: number
  y: number

  constructor(c: Config = {}) {
    const {
      x = 0,
      y = 0,
    } = c

    this.x = x
    this.y = y
  }

  up() { this.y += SPEED }
  down() { this.y -= SPEED }
  left() { this.x += SPEED }
  right() { this.x -= SPEED }
}
