<template>
  <div class="file-selector mt-md">
    <h2>选择 EPUB 文件或目录</h2>
    <div class="selector-buttons">
      <button class="btn primary" @click="handleSelectFile">
        选择单个文件
      </button>
      <button class="btn secondary" @click="handleSelectDirectory">
        选择目录（批量扫描）
      </button>
    </div>
    <div v-if="selectedFilePath" class="selected-file mt-sm">
      <span class="file-path">{{ selectedFilePath }}</span>
    </div>
    <div v-if="selectedDirectoryPath" class="selected-file mt-sm">
      <span class="file-path">已选择目录: {{ selectedDirectoryPath }}</span>
    </div>
    <div v-if="epubFilesFound > 0" class="epub-count mt-sm">
      找到 {{ epubFilesFound }} 个 EPUB 文件
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileSelector',
  emits: ['file-selected', 'directory-scanned'],
  data() {
    return {
      selectedFilePath: '',
      selectedDirectoryPath: '',
      epubFilesFound: 0
    }
  },
  methods: {
    handleSelectFile() {
      try {
        // 检查是否在 Node.js/uTools 环境中
        if (typeof window !== 'undefined' && window.utools) {
          // uTools 环境
          const filePaths = window.utools.showOpenDialog({
            title: '选择 EPUB 文件',
            properties: ['openFile'],
            filters: [
              { name: 'EPUB 文件', extensions: ['epub'] }
            ]
          })
          if (filePaths && filePaths.length > 0) {
            this.selectedFilePath = filePaths[0]
            this.selectedDirectoryPath = ''
            this.epubFilesFound = 0
            this.$emit('file-selected', filePaths[0])
          }
        } else {
          throw new Error('无法选择文件，需要在 uTools 环境中运行')
        }
      } catch (error) {
        alert('选择文件失败: ' + error.message)
      }
    },

    handleSelectDirectory() {
      try {
        // 检查是否在 Node.js/uTools 环境中
        if (typeof window !== 'undefined' && window.utools) {
          // uTools 环境
          const directoryPaths = window.utools.showOpenDialog({
            title: '选择目录',
            properties: ['openDirectory']
          })
          if (directoryPaths && directoryPaths.length > 0) {
            this.selectedDirectoryPath = directoryPaths[0]
            this.selectedFilePath = ''
            // 发送目录扫描事件，但不在此组件中执行扫描，让父组件处理
            this.$emit('directory-scanned', directoryPaths[0])
          }
        } else {
          throw new Error('无法选择目录，需要在 uTools 环境中运行')
        }
      } catch (error) {
        alert('选择目录失败: ' + error.message)
      }
    },

    // 设置扫描到的 EPUB 文件数量
    setEpubFilesCount(count) {
      this.epubFilesFound = count
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.file-selector {
  text-align: center;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: $border-radius;
  background-color: #f9f9f9;
}

.file-selector h2 {
  color: $text-color;
  margin-bottom: 16px;
  font-size: 1.5rem;
}

.selector-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.selected-file {
  margin-top: 16px;
  padding: 12px;
  background-color: $white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-path {
  color: $primary-color;
  font-family: monospace;
}

.file-name {
  color: $text-color;
  font-size: 14px;
  max-width: 400px;
}

.epub-count {
  margin-top: 12px;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 500;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn.primary {
  background-color: $primary-color;
  color: $white;
}

.btn.primary:hover {
  background-color: darken($primary-color, 10%);
  transform: translateY(-2px);
  box-shadow: $shadow-sm;
}

.btn.secondary {
  background-color: #e0e0e0;
  color: $text-color;
}

.btn.secondary:hover {
  background-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: $shadow-sm;
}
</style>