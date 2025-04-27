<script setup lang="ts">
import type { FeatureConfig, FeatureKey, Point } from '~/isovist/types'
import { euclidean, manhattan } from '~/isovist/distances'
import { computeFeatures, featureCheckboxes } from '~/isovist/features'
import { map } from '~/isovist/map'
import { Robot } from '~/isovist/robot'
import { cast, distPointToLine } from '~/isovist/utils'

const mapConfig = map.config
const obstacles = map.obstacles
const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
const area = mapConfig.radius ** 2
const gridThreshold = 5

const config = ref<{
  features: FeatureConfig
  distance: 'euclidean' | 'manhattan'
  draw: {
    grid: true
    rays: true
  }
}>({
  features: {},
  distance: 'euclidean',
  draw: {
    grid: true,
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
      const isNear = lines.some(line => distPointToLine(point, line) <= gridThreshold)
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

const robot = ref(new Robot({ x: 100, y: 100 }))
const found = shallowRef<{ position: Point | undefined, d: number }>()

function find() {
  const point = { x: robot.value.x, y: robot.value.y }
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
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, mapConfig.width, mapConfig.height)

  // Draw dots
  if (config.value.draw.grid) {
    for (const g of grids) {
      const [x, y] = g

      if (found.value?.position?.x === x && found.value?.position?.y === y) {
        ctx.fillStyle = '#FFFF00'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
      else {
        ctx.fillStyle = '#555'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  // Draw obstacles
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
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
      ctx.fillStyle = '#fff'
      ctx.fill()
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
  if (config.value.draw.rays) {
    const points = cast({ x: robot.value.x, y: robot.value.y }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(0,255,0,0.5)'
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(robot.value.x, robot.value.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
  }

  // Draw robot
  ctx.fillStyle = '#f00'
  ctx.beginPath()
  ctx.arc(robot.value.x, robot.value.y, 10, 0, 2 * Math.PI)
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
  if (keys.has('w')) {
    robot.value.down()
  }
  if (keys.has('s')) {
    robot.value.up()
  }
  if (keys.has('a')) {
    robot.value.right()
  }
  if (keys.has('d')) {
    robot.value.left()
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
  <div class="p-6 max-w-[648px] mx-auto font-mono">
    <div class="flex flex-col items-center justify-center gap-6">
      <canvas ref="canvas" :width="mapConfig.width" :height="mapConfig.height" />

      <div class="w-full grid gap-3">
        <UCard>
          <div class="grid gap-1">
            <p><span class="font-extrabold text-success">W/A/S/D</span> to move</p>
            <p><span class="font-extrabold text-success">F</span> to find grid position.</p>
          </div>
        </UCard>

        <UCard>
          <p class="mb-2 font-extrabold">
            Draw
          </p>
          <div class="flex items-center gap-6">
            <USwitch v-model="config.draw.grid" label="Grid" />
            <USwitch v-model="config.draw.rays" label="Rays" />
          </div>
        </UCard>

        <UCard>
          <p class="mb-2 font-extrabold">
            Features
          </p>
          <UCheckboxGroup
            v-model="featureKeys"
            :items="featureCheckboxes"
          />
        </UCard>

        <UCard>
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
        </UCard>

        <UCard>
          <p class="mb-2 font-extrabold">
            Robot
          </p>

          <div class="grid gap-1">
            <label>
              <span>Speed: </span>
              <UInputNumber
                :min="0"
                :max="10"
                orientation="vertical"
                class="w-16"
                default-value="1"
              />
              <span> (not works yet)</span>
            </label>

            <p>Robot: {{ robot.x }}x | {{ robot.y }}y</p>
            <p>
              Found: {{ found?.position?.x }}x | {{ found?.position?.y }}y | {{ found?.d }}d
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
