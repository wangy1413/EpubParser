<template>
  <div class="file-selector">
    <div class="control-panel">
      <button @click="selectFiles" class="btn primary">
        <span class="icon">📚</span>
        选择EPUB文件
      </button>
      <button @click="selectFolder" class="btn secondary">
        <span class="icon">📁</span>
        选择文件夹
      </button>
    </div>

    <div class="drop-zone" :class="{ 'dragover': isDragging }" @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave" @drop="handleDrop">
      <div class="drop-content">
        <span class="drop-icon">📥</span>
        <p>拖放EPUB文件到这里</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['files-selected', 'folder-selected'])

const isDragging = ref(false)

const selectFiles = async () => {
  try {
    if (window.utools) {
      const files = await window.utools.showOpenDialog({
        filters: [{ name: 'EPUB文件', extensions: ['epub'] }],
        properties: ['openFile', 'multiSelections']
      })
      if (files && files.length > 0) {
        emit('files-selected', files)
      }
    } else {
      // 开发环境模拟
      console.log('选择文件功能')
    }
  } catch (error) {
    console.error('选择文件失败:', error)
  }
}

const selectFolder = async () => {
  try {
    if (window.utools) {
      const folder = await window.utools.showOpenDialog({
        properties: ['openDirectory']
      })
      if (folder && folder.length > 0) {
        emit('folder-selected', folder[0])
      }
    } else {
      // 开发环境模拟
      console.log('选择文件夹功能')
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false

  const files = Array.from(e.dataTransfer.files)
    .filter(file => file.name.toLowerCase().endsWith('.epub'))
    .map(file => file.path)

  if (files.length > 0) {
    emit('files-selected', files)
  }
}
</script>

<style scoped>
.file-selector {
  margin-bottom: 20px;
}

.control-panel {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.secondary {
  background: #95a5a6;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.drop-zone {
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.drop-zone.dragover {
  border-color: #3498db;
  background: #e3f2fd;
}

.drop-content {
  color: #7f8c8d;
}

.drop-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 10px;
}
</style>