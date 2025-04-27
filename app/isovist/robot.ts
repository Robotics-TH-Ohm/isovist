interface Config {
  x?: number
  y?: number
  speed?: number
}

export class Robot {
  x: number
  y: number
  speed: number

  constructor(c: Config = {}) {
    const {
      x = 0,
      y = 0,
      speed = 1,
    } = c

    this.x = x
    this.y = y
    this.speed = speed
  }

  up() { this.y += this.speed }
  down() { this.y -= this.speed }
  left() { this.x += this.speed }
  right() { this.x -= this.speed }
}
