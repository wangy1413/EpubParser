<template>
  <div class="results-section" v-if="results.length > 0">
    <div class="section-header">
      <h2>解析结果</h2>
      <button @click="exportResults" class="btn success">
        <span class="icon">📊</span>
        导出CSV
      </button>
    </div>

    <div class="results-table-container">
      <table class="results-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>书名</th>
            <th>作者</th>
            <th>出版社</th>
            <th>文件大小</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, index) in results" :key="index" :class="{ 'error-row': !result.success }">
            <td>{{ getFileName(result) }}</td>
            <td>{{ result.success ? result.data.title : '解析失败' }}</td>
            <td>{{ result.success ? result.data.creator : '-' }}</td>
            <td>{{ result.success ? result.data.publisher : '-' }}</td>
            <td>{{ result.success ? formatFileSize(result.data.fileSize) : '-' }}</td>
            <td>
              <span :class="['status', result.success ? 'success' : 'error']">
                {{ result.success ? '✅ 成功' : '❌ 失败' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFileSystem } from '../composables/useFileSystem'

const { exportToCSV } = useFileSystem()

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['export'])

const getFileName = (result) => {
  if (result.success) {
    return result.data.fileName
  } else {
    return result.filePath ? result.filePath.split('/').pop() : '未知文件'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(2)} MB`
}

const exportResults = async () => {
  try {
    if (window.utools) {
      const exportPath = await window.utools.showSaveDialog({
        filters: [{ name: 'CSV文件', extensions: ['csv'] }],
        defaultPath: 'epub解析结果.csv'
      })

      if (exportPath) {
        exportToCSV(props.results, exportPath)
        // 显示成功消息
        if (window.utools.showNotification) {
          window.utools.showNotification('导出成功！')
        }
      }
    } else {
      // 开发环境模拟
      console.log('导出功能:', props.results)
    }
  } catch (error) {
    console.error('导出失败:', error)
  }
}
</script>

<style scoped>
.results-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0;
}

.results-table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background: #34495e;
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
}

tr:hover {
  background: #f8f9fa;
}

.error-row {
  background: #ffeaea;
}

.error-row:hover {
  background: #ffdada;
}

.status.success {
  color: #27ae60;
  font-weight: bold;
}

.status.error {
  color: #e74c3c;
  font-weight: bold;
}

.btn.success {
  background: #27ae60;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn.success:hover {
  background: #219653;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .results-table {
    font-size: 12px;
  }

  th,
  td {
    padding: 8px;
  }
}
</style>