<template>
  <Fireworks
    ref="fw"
    v-if="mounted"
    :autostart="false"
    :options="options"
    :style="{
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      position: 'fixed',
      background: '',
      zIndex: '-1',
    }"
  />
</template>

<script lang="ts" setup>
import type { FireworksOptions } from "@fireworks-js/vue";
import { Fireworks } from "@fireworks-js/vue";
import { ref, watch } from "vue";

const fw = ref<InstanceType<typeof Fireworks>>();
const options = ref<FireworksOptions>({
  opacity: 0.5,
  traceSpeed: 1,
  intensity: 20,
  delay: {
    min: 30,
    max: 60,
  },
  rocketsPoint: {
    min: 10,
    max: 100,
  },
  sound: {
    enabled: true,
    files: ["/sound/explosion0.mp3", "sound/explosion1.mp3", "sound/explosion2.mp3"],
    volume: {
      min: 2,
      max: 4,
    },
  },
});
const mounted = ref(true);

async function startFireworks() {
  if (!fw.value) return;
  fw.value.start();
}

watch(fw, () => startFireworks());
</script>
