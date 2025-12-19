<template>
  <div class="app">
    <!-- 阅读器 -->
    <Reader v-if="showReader" :book="currentBook" @close="handleReaderClose" />

    <!-- 主应用界面 -->
    <div v-else class="app-content">
      <header class="app-header text-center mb-md">
        <h1>EPUB 阅读解析器</h1>
        <p>用于 EPUB 文件阅读解析并提取统计信息与封面</p>
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
        <div style="display: flex; justify-content: space-between;">
          <!-- EPUB文件列表 -->
          <BooksTable style="min-width: 450px;width: 100%;" v-if="showBooksTable" :books="epubFiles"
            @book-selected="handleBookSelected" />
          <div v-if="statistics" style=" margin-left: 20px;min-width: 400px;">
            <!-- 统计信息 -->
            <Statistics v-if="statistics" :stats="statistics" :cover-image="coverImage" @read-book="handleReadBook" />

            <!-- 结果表格 -->
            <ResultsTable v-if="results.length > 0" :data="results" />
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount } from 'vue'
import FileSelector from './components/FileSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import ResultsTable from './components/ResultsTable.vue'
import Statistics from './components/Statistics.vue'
import BooksTable from './components/BooksTable.vue'
import Reader from './components/Reader.vue'
import { useEpubParser } from './composables/useEpubParser'
import { useFileSystem } from './composables/useFileSystem'

export default {
  name: 'App',
  components: {
    FileSelector,
    ProgressBar,
    ResultsTable,
    Statistics,
    BooksTable,
    Reader
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
    // 阅读器相关状态
    const showReader = ref(false)
    const currentBook = ref(null)
    const bookInstance = ref(null)

    const { parseEpubFile, loadBook, closeBook, cleanup } = useEpubParser()
    const { isEpubFile, scanDirectoryForEpubs } = useFileSystem()
    // 计算属性：是否显示书籍表格
    const showBooksTable = computed(() => {
      return epubFiles.value.length > 0
    })

    utools.onPluginEnter(({ code, type, payload, option, from }) => {
      console.log("用户进入插件应用", code, type, payload);
      console.log("用户inrush插件的方式：", from);
      if (type === 'files' && payload.length > 0) {
        if (isEpubFile(payload[0].path)) {
          handleFileSelected(payload[0].path)
        }
      }
    })

    utools.onPluginOut((isKill) => {
      if (isKill) {
        console.log("用户结束运行插件应用");
      } else {
        console.log("插件应用被隐藏后台");
      }
    });

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

        // 扫描目录B 文件，最多加载500本书
        const files = await scanDirectoryForEpubs(directoryPath)

        // 更新文件列表
        epubFiles.value = files

        // 更新进度和文件数量显示
        progress.value = 100
        if (fileSelectorRef.value) {
          fileSelectorRef.value.setEpubFilesCount(files.length)
        }

        // 如果达到最大文件数，给用户提示
        if (files.length >= 500) {
          alert(`已扫描到 ${files.length} 个 EPUB 文件，已达到最大限制，只显示前500个文件。`)
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
        // 保存当前文件路径到 statistics 对象，用于阅读功能
        statistics.value = parseResult.statistics
        if (statistics.value) {
          statistics.value.filePath = filePath
        }
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

    // 处理阅读书籍请求
    const handleReadBook = async () => {
      try {
        // 检查是否有书籍统计信息和文件路径
        if (!statistics.value || !statistics.value.filePath) {
          throw new Error('请先选择并解析一本 EPUB 书籍')
        }

        // 加载书籍
        progress.value = 20
        const book = await loadBook(statistics.value.filePath)
        progress.value = 80

        // 设置当前书籍并显示阅读器
        currentBook.value = book
        showReader.value = true
        progress.value = 100

        // 重置进度条
        setTimeout(() => {
          progress.value = 0
        }, 1000)
      } catch (err) {
        console.error('加载书籍时出错:', err)
        error.value = err.message || '加载书籍时发生错误'
        progress.value = 0
      }
    }

    // 处理关闭阅读器
    const handleReaderClose = () => {
      closeBook()
      currentBook.value = null
      showReader.value = false
    }

    // 组件卸载时清理资源
    onBeforeUnmount(() => {
      cleanup()
    })

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
      handleBookSelected,
      // 阅读器相关
      showReader,
      currentBook,
      handleReadBook,
      handleReaderClose
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