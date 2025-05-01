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

  const state = ref({ ...c })

  const up = () => {
    state.value.y += state.value.speed
  }
  const down = () => {
    state.value.y -= state.value.speed
  }
  const left = () => {
    state.value.x += state.value.speed
  }
  const right = () => {
    state.value.x -= state.value.speed
  }

  return { state, up, down, left, right }
}
