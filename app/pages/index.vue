<script setup lang="ts">
import type { FeatureConfig, FeatureKey, Point } from '~/isovist/types'
import { euclidean, manhattan } from '~/isovist/distances'
import { computeFeatures, featureCheckboxes } from '~/isovist/features'
import { map } from '~/isovist/map'
import { useRobot } from '~/isovist/robot'
import { cast, distPointToLine } from '~/isovist/utils'

const colorMode = useColorMode()

const mapConfig = map.config
const obstacles = map.obstacles
const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
const area = mapConfig.radius ** 2

const config = ref<{
  features: FeatureConfig
  distance: 'euclidean' | 'manhattan'
  grid: {
    show: boolean
    random: boolean
  }
  robot: {
    rays: true
  }
}>({
  features: {},
  distance: 'euclidean',
  grid: {
    show: true,
    random: false,
  },
  robot: {
    rays: true,
  },
})

const featureKeys = ref<FeatureKey[]>([
  'area',
  'perimeter',
  'areaPermeterRatio',
  'circularity',
  'dispersion',
  'dispersionAbs',
  'drift',
  'maxRadialLength',
  'meanRadialLength',
  'minRadialLength',
])
watch(featureKeys, (keys) => {
  config.value.features = {}
  for (const k of keys) {
    config.value.features[k] = true
  }
}, { immediate: true, deep: true })

const grids = (() => {
  const arr: [number, number][] = []
  for (let x = 0; x <= mapConfig.width; x += mapConfig.gridCell) {
    for (let y = 0; y <= mapConfig.height; y += mapConfig.gridCell) {
      const dx = x - mapConfig.cx
      const dy = y - mapConfig.cy
      const distSq = dx * dx + dy * dy
      if (distSq > area)
        continue

      const point = { x, y }
      const isNear = lines.some(line => distPointToLine(point, line) <= mapConfig.lineWidth)
      if (isNear)
        continue

      arr.push([x, y])
    }
  }
  return arr
})()

const featureEntries = computed(() => grids.map(([x, y]) => {
  const viewpoint = { x, y }
  const points = cast(viewpoint, lines)
  const features = computeFeatures(viewpoint, points, config.value.features)
  return { point: viewpoint, features }
}))

const robot = useRobot({ x: 100, y: 100 })
const found = shallowRef<{ position: Point | undefined, d: number }>()

function find() {
  const point = { x: robot.x.value, y: robot.y.value }
  const points = cast(point, lines)
  const features = computeFeatures(point, points, config.value.features)
  if (!features)
    return { position: undefined, d: Number.POSITIVE_INFINITY }

  let minD = Number.POSITIVE_INFINITY
  let nearest: Point | undefined

  const distanceFn = config.value.distance === 'euclidean' ? euclidean : manhattan

  for (const entry of featureEntries.value) {
    if (!entry.features)
      continue

    const d = distanceFn(features, entry.features)
    if (d < minD) {
      minD = d
      nearest = entry.point
    }
  }

  return { position: nearest, d: minD }
}

const canvasEl = useTemplateRef('canvas')

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  // Draw background
  ctx.fillStyle = colorMode.value === 'dark'
    ? 'oklch(20.5% 0 0)'
    : '#fff'
  ctx.fillRect(0, 0, mapConfig.width, mapConfig.height)

  // Draw dots
  if (config.value.grid.show) {
    for (const g of grids) {
      const [x, y] = g

      if (found.value?.position?.x === x && found.value?.position?.y === y) {
        ctx.fillStyle = colorMode.value === 'dark'
          ? 'oklch(79.5% 0.184 86.047)'
          : 'oklch(85.2% 0.199 91.936)'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
      else {
        ctx.fillStyle = colorMode.value === 'dark'
          ? 'oklch(55.6% 0 0)'
          : 'oklch(70.8% 0 0)'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  // Draw obstacles
  ctx.strokeStyle = colorMode.value === 'dark' ? '#fff' : '#000'
  ctx.lineWidth = mapConfig.lineWidth
  obstacles.forEach((o) => {
    if (o.type === 'line') {
      ctx.beginPath()
      ctx.moveTo(o.line.x1, o.line.y1)
      ctx.lineTo(o.line.x2, o.line.y2)
      ctx.stroke()
      return
    }

    if (o.fill) {
      ctx.beginPath()
      ctx.moveTo(o.lines[0].x1, o.lines[0].y1)
      o.lines.forEach((l) => {
        ctx.lineTo(l.x2, l.y2)
      })
      ctx.closePath()
      // ctx.fillStyle = colorMode.value === 'dark' ? '#fff' : '#000'
      // ctx.fill()
      ctx.stroke()
      return
    }

    o.lines.forEach((l) => {
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    })
  })

  // Draw rays
  if (config.value.robot.rays) {
    const points = cast({ x: robot.x.value, y: robot.y.value }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = colorMode.value === 'dark'
      ? 'oklch(72.3% 0.219 149.579)'
      : 'oklch(79.2% 0.209 151.711)'
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(robot.x.value, robot.y.value)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
  }

  // Draw robot
  ctx.fillStyle = colorMode.value === 'dark'
    ? 'oklch(63.7% 0.237 25.331)'
    : 'oklch(70.4% 0.191 22.216)'
  ctx.beginPath()
  ctx.arc(robot.x.value, robot.y.value, 10, 0, 2 * Math.PI)
  ctx.fill()
}

const keys = new Set<string>()

window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
})

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f')
    found.value = find()
})

function input() {
  if (keys.has('w') && robot.y.value > 0) {
    robot.down()
  }
  if (keys.has('s') && robot.y.value < mapConfig.height) {
    robot.up()
  }
  if (keys.has('a') && robot.x.value > 0) {
    robot.right()
  }
  if (keys.has('d') && robot.x.value < mapConfig.width) {
    robot.left()
  }
}

function animate() {
  draw()
  input()
  requestAnimationFrame(animate)
}
onMounted(animate)
</script>

<template>
  <div class="relative p-6 mx-auto font-mono @container">
    <ColorMode class="absolute top-6 right-6" />
    <div class="grid grid-cols-1 gap-6 @min-[1200px]:grid-cols-2">
      <div class="flex flex-col gap-3 items-center justify-center">
        <h1 class="font-extrabold text-xl">
          Isovist
        </h1>
        <canvas
          ref="canvas"
          :width="mapConfig.width"
          :height="mapConfig.height"
          class="my-3"
        />
        <UCard>
          <div class="grid gap-1">
            <p>
              <span class="font-extrabold text-success">W/A/S/D</span> to move
            </p>
            <p>
              <span class="font-extrabold text-success">F</span> to find grid position.
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              TODO
            </p>
            <p> - Remove node inside small circle or polygon obstacles</p>
            <p> - Restricted Random Grid</p>
            <p> - Hover on grid node</p>
            <p> - Features (more?, description for each)</p>
            <p> - Distances: maybe also cosine</p>
          </div>
        </UCard>
      </div>

      <div class="grid gap-3">
        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Grid
            </p>
            <div class="flex items-center gap-6">
              <USwitch
                v-model="config.grid.show"
                label="Show"
              />
            </div>
            <p>
              Found: {{ found?.position?.x }}x | {{ found?.position?.y }}y | {{ found?.d }}d
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Features
            </p>
            <UCheckboxGroup
              v-model="featureKeys"
              :items="featureCheckboxes"
            />
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="mb-2 font-extrabold">
              Distances
            </p>
            <URadioGroup
              v-model="config.distance"
              orientation="horizontal"
              :items="[
                { label: 'Euclidean', value: 'euclidean' },
                { label: 'Manhattan', value: 'manhattan' },
              ]"
              :ui="{ fieldset: 'gap-x-6' }"
            />
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="mb-2 font-extrabold">
              Robot
            </p>
            <USwitch
              v-model="config.robot.rays"
              label="Rays"
            />
            <label>
              <span>Speed: </span>
              <UInputNumber
                v-model="robot.speed.value"
                :min="1"
                :step="1"
                orientation="vertical"
                class="w-20"
              />
            </label>
            <p>Robot: {{ robot.x }}x | {{ robot.y }}y</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
