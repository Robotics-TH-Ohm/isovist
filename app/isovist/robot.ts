interface Config {
  x?: number
  y?: number
  speed?: number
}

export function useRobot(config: Config = {}) {
  const c = {
    x: 0,
    y: 0,
    speed: 2,
    ...config,
  }

  const x = shallowRef(c.x)
  const y = shallowRef(c.y)
  const speed = shallowRef(c.speed)

  const up = () => {
    y.value += speed.value
  }
  const down = () => {
    y.value -= speed.value
  }
  const left = () => {
    x.value += speed.value
  }
  const right = () => {
    x.value -= speed.value
  }

  return { x, y, speed, up, down, left, right }
}
