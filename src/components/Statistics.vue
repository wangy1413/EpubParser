<template>
  <div class="statistics">
    <h3>统计信息</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ totalFiles }}</span>
        <span class="stat-label">总文件数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ successFiles }}</span>
        <span class="stat-label">成功解析</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ failedFiles }}</span>
        <span class="stat-label">解析失败</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ successRate }}%</span>
        <span class="stat-label">成功率</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
})

const totalFiles = computed(() => props.results.length)
const successFiles = computed(() => props.results.filter(r => r.success).length)
const failedFiles = computed(() => totalFiles.value - successFiles.value)
const successRate = computed(() => {
  if (totalFiles.value === 0) return 0
  return Math.round((successFiles.value / totalFiles.value) * 100)
})
</script>

<style scoped>
.statistics {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.statistics h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>