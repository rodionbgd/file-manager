<template>
  <div>
    <FilesList
      :isHiddenFiles="isHiddenFiles"
      :isRemoved="isRemoved"
      :isRenamed="isRenamed"
    />
  </div>
</template>

<script setup>
import FilesList from "./components/FilesList.vue";

import { onMounted, ref } from "vue";
const isHiddenFiles = ref(false);
const isRemoved = ref(false);
const isRenamed = ref(false);

onMounted(async () => {
  window.electron.onShowHiddenFiles(isHiddenFiles);
  window.electron.onRemove(isRemoved);
  window.electron.onRename(isRenamed);
});
</script>
