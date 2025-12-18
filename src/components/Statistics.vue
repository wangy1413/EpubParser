<template>
  <div class="statistics mt-md">
    <div class="statistics-header">
      <h2>文件统计</h2>
      <button class="btn export-btn" @click="exportToExcel">
        导出Excel表格
      </button>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">文件名</div>
        <div class="value">{{ stats.fileName || '未知' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">书名</div>
        <div class="value">{{ stats.title || '未知' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">书号</div>
        <div class="value">{{ stats.bookId || '未知' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">作者</div>
        <div class="value">{{ stats.author || '未知' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">出版社</div>
        <div class="value">{{ stats.publisher || '未知' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">出版日期</div>
        <div class="value">{{ formatDate(stats.publishDate) }}</div>
      </div>
      <div class="stat-card full-width">
        <div class="label">简介</div>
        <div class="value">{{ stats.description || '暂无简介' }}</div>
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
    formatDate(date) {
      if (!date) return '未知'

      const d = new Date(date)
      if (isNaN(d.getTime())) return '未知'

      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },

    exportToExcel() {
      try {
        // 创建CSV内容，包含所有要求的字段
        let csvContent = '文件名,书名,书号,作者,出版社,出版日期,简介\n'

        // 准备单行数据
        const stats = this.stats || {}
        const row = [
          `"${(stats.fileName || '').replace(/"/g, '""')}"`,
          `"${(stats.title || '').replace(/"/g, '""')}"`,
          stats.bookId || '',
          `"${(stats.author || '').replace(/"/g, '""')}"`,
          `"${(stats.publisher || '').replace(/"/g, '""')}"`,
          `"${(stats.publishDate || '').replace(/"/g, '""')}"`,
          `"${(stats.description || '').replace(/"/g, '""')}"`
        ]
        csvContent += row.join(',') + '\n'

        // 创建Blob并下载
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        // 添加UTF-8 BOM以正确处理中文
        const url = URL.createObjectURL(new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), blob], { type: 'text/csv;charset=utf-8;' }))

        link.setAttribute('href', url)
        link.setAttribute('download', `epub_book_${stats.title || ''}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 模拟导出成功的反馈
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('导出成功', '已成功导出EPUB文件信息')
        } else {
          alert('导出成功')
        }
      } catch (error) {
        console.error('导出失败:', error)
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('导出失败', error.message)
        } else {
          alert('导出失败: ' + error.message)
        }
      }
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

  .statistics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      color: $text-color;
      font-size: 18px;
    }
  }

  .export-btn {
    background-color: $primary-color;
    color: $white;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background-color: darken($primary-color, 10%);
      transform: translateY(-2px);
      box-shadow: $shadow-sm;
    }
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

  .stat-card.full-width {
    grid-column: 1 / -1;
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