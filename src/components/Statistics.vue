<template>
  <div class="statistics mt-md">
    <div class="statistics-header">
      <h2>文件统计</h2>
      <div class="header-buttons">
        <button class="btn read-btn" @click="handleReadBook" v-if="stats && Object.keys(stats).length > 0">
          阅读书籍
        </button>
        <button class="btn export-btn" @click="exportToExcel" v-if="stats && Object.keys(stats).length > 0">
          导出Excel表格
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <!-- 封面图展示 -->
      <div class="stat-card cover-card">
        <div class="label">封面图</div>
        <div class="cover-container">
          <img v-if="coverImage" :src="coverImage" alt="封面图" class="cover-image" />
          <div v-else class="cover-placeholder">
            暂无封面图
          </div>
        </div>
        <button v-if="coverImage" class="btn download-btn" @click="downloadCoverImage">
          下载封面图
        </button>
      </div>

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
      <div class="stat-card full-width">
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
    },
    coverImage: {
      type: String,
      default: null
    }
  },
  emits: ['read-book'],

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

    downloadCoverImage() {
      if (!this.coverImage) return

      try {
        // 创建下载链接
        const link = document.createElement('a')
        link.href = this.coverImage

        // 使用书名作为文件名，处理特殊字符
        const fileName = (this.stats.title || '未知书名').replace(/[\\/:*?"<>|]/g, '') + '.' + this.getImageExtension(this.coverImage)
        link.download = fileName

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 反馈
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('下载成功', '封面图已成功下载')
        } else {
          alert('封面图已成功下载')
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('下载失败', error.message)
        } else {
          alert('下载失败: ' + error.message)
        }
      }
    },

    getImageExtension(base64) {
      // 从Base64编码中提取图片格式
      const matches = base64.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)
      return matches ? matches[1] : 'jpg' // 默认使用jpg
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
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('导出失败', error.message)
        } else {
          alert('导出失败: ' + error.message)
        }
      }
    },

    // 处理阅读书籍请求
    handleReadBook() {
      this.$emit('read-book')
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

    .header-buttons {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .export-btn,
  .read-btn {
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
    grid-auto-rows: minmax(100px, auto);
  }

  .stat-card {
    padding: 16px;
    background-color: $white;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }
  }

  // 封面图卡片样式
  .stat-card.cover-card {
    grid-column: span 2;
    grid-row: span 2;
    align-items: center;
    text-align: center;
  }

  // 封面图样式
  .cover-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 250px;
    background-color: #f8f9fa;
    border-radius: $border-radius;
    overflow: hidden;
    margin: 8px 0;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }

  .cover-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .cover-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: $text-secondary;
    font-style: italic;
    font-size: 16px;
    background-color: #f0f0f0;
  }

  .download-btn {
    background-color: $primary-color;
    color: $white;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-top: 8px;

    &:hover {
      background-color: darken($primary-color, 10%);
      transform: translateY(-2px);
      box-shadow: $shadow-sm;
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
  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-card.cover-card {
      grid-column: span 2;
      grid-row: auto;
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .stat-card {
      padding: 12px;
    }

    .stat-card.cover-card {
      grid-column: span 1;
      grid-row: auto;
    }

    .stat-card .value {
      font-size: 20px;
    }

    .cover-container {
      height: 200px !important;
    }
  }

  @media (max-width: 480px) {
    .cover-container {
      height: 150px !important;
    }
  }
}
</style>