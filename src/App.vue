<template>
  <div class="app">
    <header class="app-header">
      <h1>EPUB文件批量解析器</h1>
      <p>批量提取EPUB文件的元数据信息</p>
    </header>

    <div class="app-content">
      <FileSelector @files-selected="handleFilesSelected" @folder-selected="handleFolderSelected" />

      <ProgressBar v-if="isProcessing" :progress="progress" :current="currentFile" :total="totalFiles" />

      <Statistics v-if="results.length > 0" :results="results" />

      <ResultsTable :results="results" @export="handleExport" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FileSelector from './components/FileSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import ResultsTable from './components/ResultsTable.vue'
import Statistics from './components/Statistics.vue'
import { useEpubParser } from './composables/useEpubParser'

const {
  results,
  isProcessing,
  progress,
  currentFile,
  totalFiles,
  parseFiles,
  parseFolder
} = useEpubParser()

const handleFilesSelected = async (files) => {
  await parseFiles(files)
}

const handleFolderSelected = async (folderPath) => {
  await parseFolder(folderPath)
}

const handleExport = () => {
  // 导出功能在 ResultsTable 组件中实现
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  text-align: center;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.app-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.app-header p {
  color: #7f8c8d;
}

.app-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>