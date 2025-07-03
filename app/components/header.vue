<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const colorMode = useColorMode()
if (colorMode.preference === 'system') {
  colorMode.preference = 'dark'
}

const PAPER_URL = 'https://robotics-th-ohm.github.io/isovist-report/'
const WEB_URL = 'https://robotics-th-ohm.github.io/isovist/'
const WEB_REPO_URL = 'https://github.com/Robotics-TH-Ohm/isovist'
const CARBOT_REPO_URL = 'https://github.com/Robotics-TH-Ohm/carbot-isovist'
const PRESENTATION_URL = 'https://pitch.com/v/krp-isovist-ndkrs6'

const qrModal = ref({
  src: useQrCode(WEB_URL),
  open: false,
})

const items = ref<DropdownMenuItem[]>([
  {
    label: 'Paper',
    icon: 'i-lucide-file-text',
    type: 'link',
    target: '_blank',
    to: PAPER_URL,
  },
  {
    label: 'Presentation',
    icon: 'i-lucide-presentation',
    type: 'link',
    target: '_blank',
    to: PRESENTATION_URL,
  },
  {
    label: 'Web Simmulator',
    icon: 'i-lucide-github',
    type: 'link',
    target: '_blank',
    to: WEB_REPO_URL,
  },
  {
    label: 'Carbot Simmulator',
    icon: 'i-lucide-github',
    type: 'link',
    target: '_blank',
    to: CARBOT_REPO_URL,
  },
  {
    label: 'Show QR-Code',
    icon: 'i-lucide-qr-code',
    onSelect() {
      qrModal.value.open = true
    },
  },
])
</script>

<template>
  <div class="absolute top-0 right-0 flex gap-1">
    <UTooltip :text="colorMode.preference === 'dark' ? 'Dark Mode' : 'Light Mode'">
      <UButton
        :icon="colorMode.preference === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
        variant="soft"
        square
        size="sm"
        @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
      />
    </UTooltip>

    <UDropdownMenu
      :items="items"
      :content="{ align: 'end' }"
      :ui="{ content: 'w-48' }"
      size="sm"
    >
      <UButton
        icon="i-lucide-menu"
        variant="soft"
        size="sm"
        label="More"
        trailing
      />
    </UDropdownMenu>

    <UModal
      v-model:open="qrModal.open"
      :title="WEB_URL"
      description="QR-Code"
      :ui="{ body: 'p-0 sm:p-0 aspect-square', description: 'sr-only' }"
    >
      <template #body>
        <div class="flex items-center justify-center aspect-square size-full p-6">
          <img :src="qrModal.src" alt="QR-Code" class="aspect-square size-full object-contain">
        </div>
      </template>
    </UModal>
  </div>

  <h1 class="text-success text-xl font-medium tracking-wider">
    Kidnapped Robot Problem & Isovisten
  </h1>
</template>
