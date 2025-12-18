<template>
  <div class="books-table mt-md">
    <div class="table-header">
      <h2>EPUB 文件列表</h2>
      <div class="header-buttons">
        <button class="btn export-btn" @click="exportToExcel" :disabled="books.length === 0 || loading">
          {{ loading ? '导出中...' : '批量导出解析数据' }}
        </button>
        <button class="btn export-btn" @click="batchExportCoverImages"
          :disabled="books.length === 0 || coverExportLoading">
          {{ coverExportLoading ? '导出中...' : '批量导出封面图' }}
        </button>
      </div>
    </div>

    <!-- 批量导出进度提示 -->
    <div v-if="coverExportProgress > 0" class="progress-indicator">
      <div class="progress-text">
        正在导出封面图: {{ currentExportIndex }}/{{ books.length }}
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: coverExportProgress + '%' }"></div>
      </div>
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
import { createZip, base64ToBlob, downloadBlob } from '../utils/zipUtils'

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
    const coverExportLoading = ref(false)
    const coverExportProgress = ref(0)
    const currentExportIndex = ref(0)
    const { parseEpubFile } = useEpubParser()

    return {
      loading,
      coverExportLoading,
      coverExportProgress,
      currentExportIndex,
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

    // 批量导出封面图
    async batchExportCoverImages() {
      if (this.books.length === 0) {
        alert('没有数据可导出')
        return
      }

      try {
        this.coverExportLoading = true
        this.coverExportProgress = 0
        this.currentExportIndex = 0

        const coverImages = []

        // 逐个解析并收集封面图
        for (const [index, book] of this.books.entries()) {
          this.currentExportIndex = index + 1
          this.coverExportProgress = Math.round(((index + 1) / this.books.length) * 100)

          try {
            // 解析EPUB文件
            const parseResult = await this.parseEpubFile(book.path)

            if (parseResult.coverImage) {
              // 收集封面图数据
              const blob = base64ToBlob(parseResult.coverImage)
              if (blob) {
                const extension = this.getImageExtension(parseResult.coverImage)
                const title = parseResult.statistics.title || book.name.replace('.epub', '')
                const fileName = `${title.replace(/[\\/:*?"<>|]/g, '')}.${extension}`

                coverImages.push({
                  name: fileName,
                  blob: blob
                })
              }
            }
          } catch (err) {
            // 继续处理下一个文件
          }

          // 延迟一下，避免浏览器卡死
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (coverImages.length === 0) {
          alert('没有找到可导出的封面图')
          return
        }

        // 创建压缩包
        const zipBlob = await createZip(coverImages)

        // 下载压缩包
        downloadBlob(zipBlob, `epub_cover_images_${new Date().toISOString().split('T')[0]}.zip`)

        // 反馈
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('批量导出成功', `已成功导出 ${coverImages.length} 个封面图到压缩包`)
        } else {
          alert(`批量导出成功，共导出 ${coverImages.length} 个封面图到压缩包`)
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.utools) {
          window.utools.showNotification('批量导出失败', error.message)
        } else {
          alert('批量导出失败: ' + error.message)
        }
      } finally {
        this.coverExportLoading = false
        this.coverExportProgress = 0
        this.currentExportIndex = 0
      }
    },

    // 下载单个封面图
    downloadCoverImage(coverImage, title) {
      try {
        // 创建下载链接
        const link = document.createElement('a')
        link.href = coverImage

        // 使用书名作为文件名，处理特殊字符
        const fileName = (title || '未知书名').replace(/[\\/:*?"<>|]/g, '') + '.' + this.getImageExtension(coverImage)
        link.download = fileName

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        // 下载失败已通过alert反馈给用户，不再需要控制台日志
      }
    },

    // 从Base64编码中提取图片格式
    getImageExtension(base64) {
      const matches = base64.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)
      return matches ? matches[1] : 'jpg' // 默认使用jpg
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

  h2 {
    color: $text-color;
    font-size: 1.5rem;
    margin: 0;
  }

  // 按钮容器样式
  .header-buttons {
    display: flex;
    gap: 10px;
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

// 进度提示样式
.progress-indicator {
  margin: 16px 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;

  .progress-text {
    margin-bottom: 8px;
    color: $text-color;
    font-size: 14px;
  }

  .progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background-color: $primary-color;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
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

  .header-buttons {
    width: 100%;
    flex-direction: column;
  }

  .table th,
  .table td {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>