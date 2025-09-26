<template>
  <div class="results-table mt-md">
    <h2>目录结构</h2>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>章节</th>
            <th>标题</th>
            <th>内容类型</th>
            <th>大小</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.type }}</td>
            <td>{{ formatSize(item.size) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultsTable',
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  methods: {
    formatSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.results-table {
  margin-top: 24px;
}

.results-table h2 {
  color: $text-color;
  margin-bottom: 16px;
  font-size: 1.5rem;
}

.table-container {
  overflow-x: auto;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: $white;
}

.table th {
  background-color: #f8f9fa;
  color: $text-color;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.table tr:hover {
  background-color: #f9f9f9;
}

.table tr:last-child td {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {

  .table th,
  .table td {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>