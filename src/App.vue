<template>
  <div class="app">
    <header class="app-header text-center mb-md">
      <h1>EPUB 解析器</h1>
      <p>用于解析 EPUB 文件并提取统计信息与封面</p>
    </header>

    <main class="app-main">
      <!-- 文件选择器 -->
      <FileSelector ref="fileSelectorRef" @file-selected="handleFileSelected"
        @directory-scanned="handleDirectoryScanned" />

      <!-- 进度条 -->
      <ProgressBar v-if="progress > 0 && progress < 100" :progress="progress" />

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- EPUB文件列表 -->
      <BooksTable v-if="showBooksTable" :books="epubFiles" @book-selected="handleBookSelected" />

      <!-- 统计信息 -->
      <Statistics v-if="statistics" :stats="statistics" :cover-image="coverImage" />

      <!-- 结果表格 -->
      <ResultsTable v-if="results.length > 0" :data="results" />
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import FileSelector from './components/FileSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import ResultsTable from './components/ResultsTable.vue'
import Statistics from './components/Statistics.vue'
import BooksTable from './components/BooksTable.vue'
import { useEpubParser } from './composables/useEpubParser'
import { useFileSystem } from './composables/useFileSystem'

export default {
  name: 'App',
  components: {
    FileSelector,
    ProgressBar,
    ResultsTable,
    Statistics,
    BooksTable
  },
  setup() {
    const fileSelectorRef = ref(null)
    const results = ref([])
    const statistics = ref(null)
    const coverImage = ref(null)
    const progress = ref(0)
    const error = ref('')
    const epubFiles = ref([])
    const isScanning = ref(false)

    const { parseEpubFile } = useEpubParser()
    const { isEpubFile, scanDirectoryForEpubs } = useFileSystem()
    // 计算属性：是否显示书籍表格
    const showBooksTable = computed(() => {
      return epubFiles.value.length > 0
    })

    // 处理单个文件选择
    const handleFileSelected = async (filePath) => {
      console.log(`选择的文件路径: ${filePath}`)
      try {
        // 重置状态
        results.value = []
        statistics.value = null
        coverImage.value = null
        error.value = ''
        progress.value = 0
        epubFiles.value = [] // 清空文件列表

        // 验证文件类型
        if (!isEpubFile(filePath)) {
          throw new Error('请选择 EPUB 格式文件')
        }

        // 显示进度
        progress.value = 10

        // 解析文件
        await parseSingleFile(filePath)

      } catch (err) {
        console.error('处理文件时出错:', err)
        error.value = err.message || '处理文件时发生错误'
        progress.value = 0
      }
    }

    //处理目录扫描
    const handleDirectoryScanned = async (directoryPath) => {
      try {
        // 重置状态
        results.value = []
        statistics.value = null
        coverImage.value = null
        error.value = ''
        progress.value = 30 // 表示扫描开始
        isScanning.value = true
        epubFiles.value = []

        console.log(`开始扫描目录: ${directoryPath}`)

        // 扫描目录B 文件
        const files = await scanDirectoryForEpubs(directoryPath)

        // 更新文件列表
        epubFiles.value = files

        // 更新进度和文件数量显示
        progress.value = 100
        if (fileSelectorRef.value) {
          fileSelectorRef.value.setEpubFilesCount(files.length)
        }

        console.log(`扫描完成，找到 ${files.length} 个 EPUB 文件`)

        // 重置进度条
        setTimeout(() => {
          progress.value = 0
        }, 1000)

      } catch (err) {
        console.error('扫描目录时出错:', err)
        error.value = err.message || '扫描目录时发生错误'
        progress.value = 0

      } finally {
        isScanning.value = false
      }
    }

    // 从文件列表中选择一本书进行解析
    const handleBookSelected = async (filePath) => {
      try {
        // 重置状态
        results.value = []
        statistics.value = null
        coverImage.value = null
        error.value = ''
        progress.value = 10

        // 解析文件
        await parseSingleFile(filePath)
      } catch (err) {
        console.error('解析文件时出错:', err)
        error.value = err.message || '解析文件时发生错误'
        progress.value = 0
      }
    }

    // 解析单个文件
    const parseSingleFile = async (filePath) => {
      try {
        // 显示进度
        progress.value = 30

        // 解析文件
        const parseResult = await parseEpubFile(filePath)

        // 更新进度
        progress.value = 90

        // 设置结果
        results.value = parseResult.content || []
        statistics.value = parseResult.statistics
        coverImage.value = parseResult.coverImage

        // 完成进度
        progress.value = 100

        // 重置进度条
        setTimeout(() => {
          progress.value = 0
        }, 1000)

        return parseResult
      } catch (err) {
        console.error('解析文件时出错:', err)
        error.value = err.message || '解析文件时发生错误'
        progress.value = 0
        throw err
      }
    }

    return {
      fileSelectorRef,
      results,
      statistics,
      coverImage,
      progress,
      error,
      epubFiles,
      showBooksTable,
      handleFileSelected,
      handleDirectoryScanned,
      handleBookSelected
    }
  }
}
</script>

<style scoped lang="scss">
@import './main.scss';

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header h1 {
  color: $primary-color;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.app-header p {
  color: $text-secondary;
  font-size: 1.1rem;
}

.app-main {
  background-color: $white;
  border-radius: $border-radius;
  padding: 30px;
  box-shadow: $shadow-md;
}

.error-message {
  background-color: #fdf2f2;
  color: $error-color;
  padding: 16px;
  border-radius: $border-radius;
  margin-top: 20px;
  border: 1px solid #fde2e2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-main {
    padding: 15px;
  }

  .app-header h1 {
    font-size: 2rem;
  }
}
</style>