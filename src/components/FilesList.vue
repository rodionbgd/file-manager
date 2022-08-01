<template>
  <div class="table-section">
    <div class="sticky-header-container"></div>
    <div class="sticky_anchor_begin"></div>
    <table class="files-table" v-if="files.length">
      <thead class="thead-light sticky-header">
        <tr>
          <th>name</th>
          <th class="align-right">size</th>
          <th>modified time</th>
          <th>permissions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          class="file-item"
          data-type="file"
          draggable="true"
          v-for="(file, index) in files"
          :key="index"
          :class="{
            selected: selectedFile === file,
            dragged: draggedOverFile === file.name && file.isDir,
          }"
          @dragstart="(event) => copyFile(event, file.name)"
          @dragover.prevent="showDragFile(file)"
          @dragenter.prevent
          @mousedown="selectFile(file)"
          @drop.stop="(event) => moveFile(event, file)"
          @dblclick="openFile(file)"
        >
          <td class="w-25">
            <template v-if="file.isDir">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                viewBox="0 0 24 24"
              >
                <path
                  class="jp-icon3 jp-icon-selectable"
                  fill="#616161"
                  d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                />
              </svg>
              <input
                type="text"
                v-show="isShownRenaming(file)"
                v-model="file.name"
                :ref="isShownRenaming(file) ? 'inputFileName' : ''"
                @focusout="isStartRenaming = false"
              />
              <span v-show="!isShownRenaming(file)" class="file-name">
                [{{ file.name }}]
              </span>
            </template>
            <template v-else>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                viewBox="0 0 22 22"
              >
                <path
                  class="jp-icon3 jp-icon-selectable"
                  fill="#616161"
                  d="M19.3 8.2l-5.5-5.5c-.3-.3-.7-.5-1.2-.5H3.9c-.8.1-1.6.9-1.6 1.8v14.1c0 .9.7 1.6 1.6 1.6h14.2c.9 0 1.6-.7 1.6-1.6V9.4c.1-.5-.1-.9-.4-1.2zm-5.8-3.3l3.4 3.6h-3.4V4.9zm3.9 12.7H4.7c-.1 0-.2 0-.2-.2V4.7c0-.2.1-.3.2-.3h7.2v4.4s0 .8.3 1.1c.3.3 1.1.3 1.1.3h4.3v7.2s-.1.2-.2.2z"
                />
              </svg>
              <input
                type="text"
                v-show="isShownRenaming(file)"
                v-model="file.name"
                :ref="isShownRenaming(file) ? 'inputFileName' : ''"
                @focusout="isStartRenaming = false"
              />
              <span v-show="!isShownRenaming(file)" class="file-name">
                {{ file.name }}
              </span>
            </template>
          </td>
          <td class="align-right">{{ getShortSize(file) }}</td>
          <td>{{ formatDate(file.mtime) }}</td>
          <td>{{ file.modeHR }}</td>
        </tr>
      </tbody>
    </table>
    <div class="loader" v-else>Loading...</div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeMount, ref, watch } from "vue";
import { getFileStats, sortByNames } from "../api/file_list";
import { getCwdFromStorage, setWorkingDir, getShortSize } from "../utils";

const props = defineProps({
  isHiddenFiles: {
    type: Boolean,
    required: true,
  },
  isRemoved: {
    type: Boolean,
    required: true,
  },
  isRenamed: {
    type: Boolean,
    required: true,
  },
});

const files = ref([]);
const selectedFile = ref(null);
const movedFile = ref(null);
const draggedOverFile = ref(null);
const isUpdatedFileList = ref(false);

const isStartRenaming = ref(false);
const inputFileName = ref(null);
const newFile = ref(null);
const prevFileName = ref(null);

const fWatcher = window.electron.watchDir(isUpdatedFileList);
let dir = getCwdFromStorage();

onBeforeMount(async () => {
  if (!dir) {
    dir = process.cwd();
    setWorkingDir(dir);
  }
  updateFileList();
  try {
    fWatcher(dir);
  } catch (e) {
    new Notification(e.name, {
      body: e.message,
    });
  }
});

const isShownRenaming = (file) => {
  return (
    isStartRenaming.value && selectedFile.value === file && file.name !== ".."
  );
};

function updateFileList() {
  const { dirs: dirObj, files: fileObj, isWatch } = getFileStats(dir);
  if (isWatch) {
    dir = getCwdFromStorage();
    try {
      fWatcher(dir);
    } catch (e) {
      new Notification(e.name, {
        body: e.message,
      });
    }
  }
  let dirsMerged = dirObj.open;
  let filesMerged = fileObj.open;
  if (props.isHiddenFiles) {
    dirsMerged = [...dirObj.hidden, ...dirObj.open];
    filesMerged = [...fileObj.hidden, ...fileObj.open];
  }
  sortByNames(dirsMerged);
  sortByNames(filesMerged);
  files.value = [...dirsMerged, ...filesMerged];
}

watch(isUpdatedFileList, () => {
  updateFileList();
});

watch(
  () => props.isHiddenFiles,
  () => {
    updateFileList();
  }
);

watch(
  () => props.isRemoved,
  async () => {
    if (selectedFile.value) {
      const { name, isDir } = selectedFile.value;
      let res;
      try {
        res = await window.electron.removeFile(dir, name, isDir);
      } catch (e) {
        new Notification(e.name, {
          body: e.message,
        });
        return;
      }
      if (res) {
        files.value = files.value.filter(
          (file) => file.name !== selectedFile.value.name
        );
      }
      selectedFile.value = null;
    }
  }
);

watch(isStartRenaming, async () => {
  if (isStartRenaming.value && inputFileName.value) {
    const { name } = newFile.value;
    let res;
    try {
      res = await window.electron.renameFile(dir, prevFileName.value, name);
    } catch (e) {
      new Notification(e.name, {
        body: e.message,
      });
      newFile.value.name = prevFileName.value;
      return;
    }
    if (!res) {
      newFile.value.name = prevFileName.value;
    }
    selectedFile.value = null;
  }
});

watch(
  () => props.isRenamed,
  () => {
    isStartRenaming.value = !!selectedFile.value;
    if (isStartRenaming.value) {
      prevFileName.value = selectedFile.value.name;
      newFile.value = selectedFile.value;
      nextTick().then(() => {
        inputFileName.value[0]?.focus();
      });
    }
  }
);

const copyFile = (event, fileName) => {
  event.preventDefault();
  movedFile.value = fileName;
  window.electron.startDrag(fileName, dir);
};

const selectFile = (file) => {
  selectedFile.value = file;
};

const moveFile = async (event, dst) => {
  draggedOverFile.value = null;
  if (!dst.isDir || !movedFile.value || dst.name === movedFile.value) {
    return;
  }
  try {
    await window.electron.moveFile(movedFile.value, dst.name, dir);
  } catch (e) {
    new Notification(e.name, {
      body: e.message,
    });
    movedFile.value = null;
    return;
  }
  files.value = files.value.filter((file) => file.name !== movedFile.value);
  movedFile.value = null;
};

const openFile = async (file) => {
  if (file.isDir) {
    dir = window.electron.joinPath(dir, file.name);
    try {
      fWatcher(dir);
      selectedFile.value = null;
    } catch (e) {
      new Notification(e.name, {
        body: e.message,
      });
      return;
    }
    updateFileList();
    setWorkingDir(dir);
    return;
  }
  window.electron.openFile(dir, file.name);
};

const showDragFile = (file) => {
  draggedOverFile.value = file.name;
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("ru-RU").replace(",", "");
};
</script>

<style scoped lang="scss">
@import "../scss/modules/_table-section.scss";

.file-item {
  border: 1px solid black;
  border-radius: 3px;
  padding: 5px;
}

.dragged {
  background-color: #71d6fc;
}
</style>
