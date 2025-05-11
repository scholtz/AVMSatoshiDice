<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const toast = useToast();
const length = 6;

const props = defineProps<{
  text: string;
}>();

function copyTextToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    function () {
      console.log("Async: Copying to clipboard was successful!");
      toast.add({
        detail: "Copied to clipboard",
        severity: "info",
        closable: true,
        life: 5000,
      });
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
      toast.add({
        detail: "Error occured while copying to clipboard",
        severity: "error",
        closable: true,
        life: 10000,
      });
    },
  );
}
</script>
<template>
  <abbr v-if="props.text?.length > length" :title="props.text" @click="copyTextToClipboard(props.text)">
    {{ props.text.substring(0, length) }}..{{ props.text.substring(props.text.length - length) }}
  </abbr>
  <span v-else>{{ props.text }}</span>
</template>
