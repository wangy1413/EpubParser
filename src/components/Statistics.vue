<template>
  <div class="statistics mt-md">
    <h2>文件统计</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">总章节数</div>
        <div class="value">{{ stats.chaptersCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">文件大小</div>
        <div class="value">{{ formatSize(stats.fileSize) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">出版日期</div>
        <div class="value">{{ formatDate(stats.publishDate) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">作者</div>
        <div class="value">{{ stats.author || '未知' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Statistics',
  props: {
    stats: {
      type: Object,
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
    },

    formatDate(date) {
      if (!date) return '未知'

      const d = new Date(date)
      if (isNaN(d.getTime())) return '未知'

      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.statistics {
  background-color: $white;
  padding: 16px;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  h2 {
    margin-bottom: 16px;
    color: $text-color;
    font-size: 18px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 16px;
    background-color: $white;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }
  }

  .stat-card .label {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-card .value {
    font-size: 24px;
    font-weight: 600;
    color: $primary-color;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      padding: 12px;
    }

    .stat-card .value {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>