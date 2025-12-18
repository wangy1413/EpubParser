<template>
  <div class="books-table mt-md">
    <div class="table-header">
      <h2>EPUB 文件列表</h2>
      <button class="btn export-btn" @click="exportToExcel" :disabled="books.length === 0 || loading">
        {{ loading ? '导出中...' : '批量导出解析数据' }}
      </button>
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>序号</th>
            <th>文件名</th>
            <th>大小</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(book, index) in books" :key="book.path || index">
            <td>{{ index + 1 }}</td>
            <td class="file-name">{{ book.name }}</td>
            <td>{{ formatSize(book.size) }}</td>
            <td>
              <button class="btn btn-small" @click="handleSelectBook(book)">
                解析
              </button>
            </td>
          </tr>
          <tr v-if="books.length === 0">
            <td colspan="4" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useEpubParser } from '../composables/useEpubParser'

export default {
  name: 'BooksTable',
  props: {
    books: {
      type: Array,
      default: () => []
    }
  },
  emits: ['book-selected'],
  setup() {
    const loading = ref(false)
    const { parseEpubFile } = useEpubParser()

    return {
      loading,
      parseEpubFile
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

    handleSelectBook(book) {
      this.$emit('book-selected', book.path)
    },

    async exportToExcel() {
      if (this.books.length === 0) {
        alert('没有数据可导出')
        return
      }

      try {
        this.loading = true

        // 创建CSV内容，包含所有要求的字段
        let csvContent = '文件名,书名,书号,作者,出版社,出版日期,简介\n'

        // 逐个解析并导出
        for (const [index, book] of this.books.entries()) {
          try {
            // 解析EPUB文件
            const parseResult = await this.parseEpubFile(book.path)
            const stats = parseResult.statistics

            const row = [
              `"${book.name.replace(/"/g, '""')}"`,
              `"${(stats.title || '').replace(/"/g, '""')}"`,
              stats.bookId || '',
              `"${(stats.author || '').replace(/"/g, '""')}"`,
              `"${(stats.publisher || '').replace(/"/g, '""')}"`,
              `"${(stats.publishDate || '').replace(/"/g, '""')}"`,
              `"${(stats.description || '').replace(/"/g, '""')}"`
            ]
            csvContent += row.join(',') + '\n'
          } catch (err) {
            console.warn(`解析文件 ${book.name} 失败，使用默认值`, err)
            // 解析失败时使用默认值
            const row = [
              `"${book.name.replace(/"/g, '""')}"`,
              '""',
              '""',
              '""',
              '""',
              '""',
              '""'
            ]
            csvContent += row.join(',') + '\n'
          }
        }

        // 创建Blob并下载
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        // 添加UTF-8 BOM以正确处理中文
        const url = URL.createObjectURL(new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), blob], { type: 'text/csv;charset=utf-8;' }))

        link.setAttribute('href', url)
        link.setAttribute('download', `epub_books_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 模拟导出成功的反馈
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('导出成功', '已成功导出EPUB文件列表')
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
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.books-table {
  margin-top: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h2 {
  color: $text-color;
  font-size: 1.5rem;
  margin: 0;
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
}

.export-btn:hover:not(:disabled) {
  background-color: darken($primary-color, 10%);
  transform: translateY(-2px);
  box-shadow: $shadow-sm;
}

.export-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
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

.file-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-small {
  background-color: $primary-color;
  color: $white;
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background-color: darken($primary-color, 10%);
}

.no-data {
  text-align: center;
  color: $text-secondary;
  padding: 40px 0;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .table th,
  .table td {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>