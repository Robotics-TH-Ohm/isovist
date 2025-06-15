<script setup lang="ts">
const colorMode = useColorMode()
if (colorMode.preference === 'system') {
  colorMode.preference = 'dark'
}

const url = useQrCode('https://robotics-th-ohm.github.io/Isovist/')
</script>

<template>
  <div class="absolute top-0 right-0 grid grid-cols-2 gap-1">
    <UTooltip text="Github Repository">
      <UButton
        icon="i-lucide-github"
        variant="soft"
        to="https://github.com/Robotics-TH-Ohm/Isovist"
        target="_blank"
        size="sm"
      />
    </UTooltip>

    <UTooltip :text="colorMode.preference === 'dark' ? 'Dark Mode' : 'Light Mode'">
      <UButton
        :icon="colorMode.preference === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
        variant="soft"
        square
        size="sm"
        @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
      />
    </UTooltip>

    <UTooltip text="Papier">
      <UButton
        icon="i-lucide-newspaper"
        variant="soft"
        to="https://robotics-th-ohm.github.io/Isovist-Report/"
        target="_blank"
        size="sm"
      />
    </UTooltip>

    <UModal title="QR Code" :ui="{ body: 'p-0 sm:p-0 aspect-square' }">
      <UTooltip text="QR Code ">
        <UButton
          icon="i-lucide-qr-code"
          variant="soft"
          target="_blank"
          size="sm"
        />
      </UTooltip>

      <template #body>
        <div class="flex items-center justify-center aspect-square size-full p-6">
          <img :src="url" alt="QR Code" class="aspect-square size-full object-contain">
        </div>
      </template>
    </UModal>
  </div>

  <h1 class="text-success text-xl font-medium tracking-wider">
    Kidnapped Robot Problem & Isovisten
  </h1>
</template>
