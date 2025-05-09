<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';
import confetti from 'canvas-confetti';

const props = defineProps<{
  active: boolean
  duration?: number
  intensity?: 'low' | 'medium' | 'high'
}>();

const fireworksContainer = ref<HTMLDivElement | null>(null);
let animationFrameId: number | null = null;
let canvas: HTMLCanvasElement | null = null;
let confettiInstance: confetti.CreateTypes | null = null;

const startFireworks = () => {
  if (!fireworksContainer.value || !canvas) return;
  
  // Clear previous animation if any
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (!confettiInstance) return;
  
  const duration = props.duration || 5000;
  const endTime = Date.now() + duration;
  const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];
  
  const intensity = props.intensity || 'medium';
  const particleDensity = intensity === 'low' ? 30 : intensity === 'medium' ? 70 : 100;
  
  const frame = () => {
    if (Date.now() < endTime) {
      // Randomize firework position
      confettiInstance?.({
        particleCount: particleDensity,
        spread: 120,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: colors,
        disableForReducedMotion: true
      });
      
      // Schedule next frame
      animationFrameId = requestAnimationFrame(frame);
    }
  };
  
  // Start the animation
  animationFrameId = requestAnimationFrame(frame);
};

onMounted(() => {
  if (fireworksContainer.value) {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    confettiInstance = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });
    
    if (props.active) {
      startFireworks();
    }
  }
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (canvas) {
    document.body.removeChild(canvas);
    canvas = null;
  }
});

watchEffect(() => {
  if (props.active) {
    startFireworks();
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});
</script>

<template>
  <div ref="fireworksContainer"></div>
</template>