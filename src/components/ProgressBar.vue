<template>
  <div class="progress-area">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
    <div class="progress-text">
      解析中... {{ progress }}% ({{ current }}/{{ total }})
    </div>
    <div class="current-file" v-if="currentFile">
      当前文件: {{ currentFile }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0
  },
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currentFile: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.progress-area {
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
  border-radius: 10px;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.current-file {
  text-align: center;
  font-size: 12px;
  color: #95a5a6;
  font-style: italic;
}
</style>