<template>
  <div class="reader-container">
    <!-- 阅读器头部 -->
    <header class="reader-header">
      <div class="header-left">
        <button class="btn back-btn" @click="handleClose">返回</button>
        <h2 class="book-title">{{ bookTitle }}</h2>
      </div>
      <div class="header-right">
        <button class="btn control-btn" @click="toggleToc">目录</button>
        <button class="btn control-btn" @click="toggleSettings">设置</button>
      </div>
    </header>

    <div class="reader-main">
      <!-- 左侧目录 -->
      <aside class="toc-sidebar" :class="{ 'open': showToc }">
        <div class="toc-header">
          <h3>目录</h3>
          <button class="btn close-btn" @click="toggleToc">×</button>
        </div>
        <div class="toc-content">
          <ul class="toc-list">
            <li v-for="item in tocItems" :key="item.url || item.label" class="toc-item"
              :class="{ 'active': currentChapter === item.url }" @click="navigateTo(item.url)">
              <span class="toc-label">{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- 中央阅读区域 -->
      <main class="content-area">
        <div ref="readerEl" class="reader-area"></div>

        <!-- 章节导航 -->
        <div class="navigation-controls">
          <button class="btn nav-btn prev-btn" @click="previousChapter" :disabled="!canGoPrevious">
            上一页
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages || '计算中...' }}</span>
          <button class="btn nav-btn next-btn" @click="nextChapter" :disabled="!canGoNext">
            下一页
          </button>
        </div>
      </main>

      <!-- 右侧设置面板 -->
      <aside class="settings-sidebar" :class="{ 'open': showSettings }">
        <div class="settings-header">
          <h3>设置</h3>
          <button class="btn close-btn" @click="toggleSettings">×</button>
        </div>
        <div class="settings-content">
          <!-- 字体大小调整 -->
          <div class="setting-group">
            <label class="setting-label">字体大小</label>
            <div class="setting-control">
              <button class="btn size-btn" @click="adjustFontSize(-1)">-</button>
              <span class="font-size">{{ fontSize }}px</span>
              <button class="btn size-btn" @click="adjustFontSize(1)">+</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reader',
  props: {
    // 书籍对象，由父组件传入
    book: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  data() {
    return {
      showToc: false,
      showSettings: false,
      fontSize: 18,

      tocItems: [],
      currentChapter: '',
      currentChapterIndex: 0,
      totalChapters: 0,
      currentPage: 1,
      totalPages: 0,
      pagesPerChapter: [], // 存储每章的页数
      canGoNext: false,
      canGoPrevious: false,
      bookTitle: '',
      rendition: null,
      locations: null
    }
  },
  mounted() {
    this.initReader()
  },
  beforeUnmount() {
    this.destroyReader()
  },
  methods: {
    // 初始化阅读器
    async initReader() {
      try {
        // 初始化目录相关变量
        this.tocItems = []
        this.totalChapters = 0
        this.currentChapterIndex = 0
        this.canGoNext = false
        this.canGoPrevious = false


        // 获取目录
        const navigation = this.book.navigation
        if (navigation && navigation.toc) {
          this.tocItems = this.flattenToc(navigation.toc)
          this.totalChapters = this.tocItems.length
        }

        // 如果没有从目录获取到内容，尝试从 spine 获取
        if (this.tocItems.length === 0 && this.book.spine && Array.isArray(this.book.spine)) {
          this.tocItems = this.book.spine.map((item, index) => ({
            label: `章节 ${index + 1}`,
            url: item.href,
            level: 0
          }))
          this.totalChapters = this.tocItems.length
        }

        // 获取书籍标题
        this.bookTitle = this.book.package?.metadata?.title || '未知书籍'

        // 创建渲染实例
        this.rendition = this.book.renderTo(this.$refs.readerEl, {
          width: '100%',
          height: '100%',
          spread: 'none'
        })

        // 设置字体大小
        this.rendition.themes.fontSize(`${this.fontSize}px`)

        // 加载第一章节
        if (this.tocItems.length > 0) {
          await this.rendition.display(this.tocItems[0].url)
          this.currentChapter = this.tocItems[0].url
          this.currentChapterIndex = 0
          this.updateNavigationState()
        }



        // 添加鼠标滚轮事件监听，实现横向滚动
        const readerEl = this.$refs.readerEl
        if (readerEl) {
          // 直接监听reader-area的滚轮事件，使用capture模式确保能捕获到所有子元素的滚轮事件
          readerEl.addEventListener('wheel', this.handleWheel, { passive: false, capture: true })
        }

        // 监听章节变化
        this.rendition.on('relocated', (location) => {
          this.updateCurrentChapter(location.start.cfi)
          this.updateCurrentPageInfo()

          // 检查是否需要自动跳转
          this.checkAutoNavigation()
        })

        // 监听内容渲染完成事件
        this.rendition.on('rendered', () => {
          // 渲染完成后无需额外操作
        })

        // 计算页数
        // 调整参数为2048，解决页码计算为实际2倍的问题
        this.book.locations.generate(2048).then(() => {
          this.locations = this.book.locations
          this.totalPages = this.locations.length()

          // 初始化每章页数数组
          this.pagesPerChapter = new Array(this.totalChapters).fill(0)

          // 计算每章的页数
          this.calculatePagesPerChapter()

          // 更新当前页信息，确保currentPage正确显示
          this.updateCurrentPageInfo()
        }).catch(error => {
          console.error('计算页数失败:', error)
          // 防止页面一直显示"计算中..."
          this.totalPages = 1
        })



        // 处理资源请求，拦截不支持的 URL 方案


        // 监听资源请求，处理不支持的 URL 方案
        this.rendition.on('request', (request) => {
          const url = request.url;
          // 拦截 res:// 或其他不支持的 URL 方案
          if (url.startsWith('res://')) {
            console.warn('拦截不支持的 URL 方案:', url);
            // 取消请求，避免报错
            request.abort();
          }
        });

      } catch (error) {
        console.error('初始化阅读器失败:', error)
        alert('初始化阅读器失败: ' + error.message)
      }
    },

    // 扁平化目录结构
    flattenToc(toc, level = 0, parentUrl = '') {
      const flattened = []

      toc.forEach((item) => {
        const tocItem = {
          label: item.label,
          url: item.href,
          level: level
        }
        flattened.push(tocItem)

        if (item.subitems && item.subitems.length > 0) {
          flattened.push(...this.flattenToc(item.subitems, level + 1, tocItem.url))
        }
      })

      return flattened
    },

    // 更新当前章节
    updateCurrentChapter(cfi) {
      // 简化实现：只在用户点击目录或导航按钮时更新章节
      // 移除复杂的CFI匹配逻辑，避免性能问题和潜在错误
    },

    // 更新导航状态
    updateNavigationState() {
      // 基于当前页和总页数来判断翻页状态
      // 对于章节内翻页，始终允许翻页，epubjs会处理边界情况
      this.canGoPrevious = this.currentPage > 1
      this.canGoNext = this.currentPage < this.totalPages
    },

    // 导航到指定章节
    async navigateTo(url) {
      try {
        await this.rendition.display(url)
        this.currentChapter = url
        this.currentChapterIndex = this.tocItems.findIndex(item => item.url === url)
        this.updateNavigationState()
        this.showToc = false
      } catch (error) {
        console.error('导航失败:', error)
      }
    },

    // 上一页
    async previousChapter() {
      if (!this.rendition) {
        return
      }

      try {
        // 使用epubjs内置的上一页方法
        await this.rendition.prev()
        // 更新当前页信息
        this.$nextTick(() => {
          this.updateCurrentPageInfo()
        })
      } catch (error) {
        console.error('上一页导航失败:', error)
      }
    },

    // 下一页
    async nextChapter() {
      if (!this.rendition) {
        return
      }

      try {
        // 使用epubjs内置的下一页方法
        await this.rendition.next()
        // 更新当前页信息
        this.$nextTick(() => {
          this.updateCurrentPageInfo()
        })
      } catch (error) {
        console.error('下一页导航失败:', error)
      }
    },

    // 切换目录显示
    toggleToc() {
      this.showToc = !this.showToc
      this.showSettings = false
    },

    // 切换设置显示
    toggleSettings() {
      this.showSettings = !this.showSettings
      this.showToc = false
    },

    // 调整字体大小
    adjustFontSize(delta) {
      this.fontSize = Math.max(12, Math.min(36, this.fontSize + delta))
      if (this.rendition) {
        this.rendition.themes.fontSize(`${this.fontSize}px`)
      }
    },



    // 返回
    handleClose() {
      this.destroyReader()
      this.$emit('close')
    },

    // 计算每章的页数
    calculatePagesPerChapter() {
      if (!this.locations || this.tocItems.length === 0) {
        return
      }

      // 遍历每章，计算每章的页数
      for (let i = 0; i < this.tocItems.length; i++) {
        const chapter = this.tocItems[i]
        const nextChapter = this.tocItems[i + 1]

        try {


          // 检查URL是否为有效的EpubCFI格式
          let startLocation, endLocation

          // 尝试将URL转换为location
          try {
            if (chapter.url && chapter.url.startsWith('/')) {
              // 这是一个相对路径，使用book.navigation获取CFI
              startLocation = 0
              endLocation = this.totalPages
            } else if (chapter.url && (chapter.url.startsWith('#') || chapter.url.includes('/'))) {
              // 尝试使用locationFromCfi，添加错误处理
              startLocation = this.locations.locationFromCfi(chapter.url)
              endLocation = this.totalPages
            } else {
              // 无效的URL格式，跳过
              console.warn(`Invalid chapter URL format for chapter ${i + 1}:`, chapter.url)
              this.pagesPerChapter[i] = 1
              continue
            }
          } catch (urlError) {
            // URL格式无效，跳过
            console.error(`Error parsing chapter URL for chapter ${i + 1}:`, urlError)
            this.pagesPerChapter[i] = 1
            continue
          }

          // 计算下一章的结束位置
          if (nextChapter) {
            try {
              if (nextChapter.url && (nextChapter.url.startsWith('#') || nextChapter.url.includes('/'))) {
                endLocation = this.locations.locationFromCfi(nextChapter.url)
              }
            } catch (nextError) {
              console.error(`Error calculating end location for chapter ${i + 1}:`, nextError)
            }
          }

          // 计算当前章的页数
          const chapterPages = endLocation - startLocation
          this.pagesPerChapter[i] = Math.max(1, chapterPages)


        } catch (error) {
          console.error(`Error calculating pages for chapter ${i + 1}:`, error)
          this.pagesPerChapter[i] = 1
        }
      }

      // 更新当前页信息
      this.updateCurrentPageInfo()
    },

    // 更新当前页信息
    updateCurrentPageInfo() {
      if (!this.locations) {
        return
      }

      // 获取当前位置
      const currentLocation = this.rendition.currentLocation()
      if (currentLocation && currentLocation.start) {
        const location = this.locations.locationFromCfi(currentLocation.start.cfi)
        this.currentPage = Math.max(1, Math.min(this.totalPages, location))
        // 更新导航状态
        this.updateNavigationState()
      }
    },

    // 检查是否需要自动跳转到下一章
    checkAutoNavigation() {
      if (!this.locations || !this.rendition) {
        return
      }

      try {
        // 获取当前位置
        const currentLocation = this.rendition.currentLocation()
        if (!currentLocation || !currentLocation.start) {
          return
        }

        const currentLocationIndex = this.locations.locationFromCfi(currentLocation.start.cfi)
        const currentChapter = this.tocItems[this.currentChapterIndex]
        const nextChapter = this.tocItems[this.currentChapterIndex + 1]

        // 如果有下一章，检查是否到达当前章的最后一页
        if (nextChapter) {
          let nextChapterStartLocation
          // 检查nextChapter.url是否为有效的EpubCFI格式，避免TypeError
          try {
            nextChapterStartLocation = this.locations.locationFromCfi(nextChapter.url)
          } catch (e) {
            // URL格式无效，跳过自动导航
            return
          }

          // 如果当前位置接近下一章开始位置（1页内），自动跳转到下一章
          if (currentLocationIndex >= nextChapterStartLocation - 1) {
            this.nextChapter()
          }
        }
      } catch (error) {
        // 忽略自动导航错误，不影响用户体验
        console.error('Error in auto navigation:', error)
      }
    },

    // 销毁阅读器
    destroyReader() {
      if (this.rendition) {
        this.rendition.destroy()
        this.rendition = null
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '../main.scss';

.reader-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  width: calc(100vw - 40px);
  background-color: $white;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* 阅读器头部 */
.reader-header {
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(5px, 3vw, 16px) clamp(16px, 4vw, 24px);
  background-color: $primary-color;
  color: $white;
  box-shadow: $shadow-md;
  z-index: 10;
  transition: all 0.3s ease;

  .header-left {
    display: flex;
    align-items: center;
    gap: clamp(12px, 3vw, 16px);
  }

  .back-btn {
    background-color: rgba(255, 255, 255, 0.2);
    color: $white;
    border: none;
    padding: clamp(3px, 2vw, 8px) clamp(12px, 3vw, 16px);
    border-radius: 4px;
    cursor: pointer;
    font-size: clamp(12px, 2.5vw, 14px);
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .book-title {
    font-size: clamp(16px, 3.5vw, 18px);
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: clamp(200px, 50vw, 400px);
  }

  .header-right {
    display: flex;
    gap: clamp(8px, 2vw, 12px);
  }

  .control-btn {
    background-color: rgba(255, 255, 255, 0.2);
    color: $white;
    border: none;
    padding: clamp(3px, 2vw, 8px) clamp(12px, 3vw, 16px);
    border-radius: 4px;
    cursor: pointer;
    font-size: clamp(12px, 2.5vw, 14px);
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

/* 阅读器主体 */
.reader-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #fafafa;
  transition: background-color 0.3s ease;
}

/* 目录侧边栏 */
.toc-sidebar {
  width: clamp(250px, 40vw, 350px);
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);

  &.open {
    transform: translateX(0);
  }

  .toc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(12px, 3vw, 16px);
    border-bottom: 1px solid #e0e0e0;
    background-color: $white;

    h3 {
      margin: 0;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: clamp(20px, 5vw, 24px);
      cursor: pointer;
      color: $text-secondary;
      padding: 0;
      width: clamp(25px, 6vw, 30px);
      height: clamp(25px, 6vw, 30px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f0f0f0;
        transform: scale(1.1);
      }
    }
  }

  .toc-content {
    padding: clamp(12px, 3vw, 16px) 0;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-item {
    padding: clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: clamp(13px, 2.8vw, 14px);
    border-left: 3px solid transparent;

    &:hover {
      background-color: rgba($primary-color, 0.1);
      transform: translateX(2px);
    }

    &.active {
      background-color: rgba($primary-color, 0.1);
      border-left-color: $primary-color;
      font-weight: 500;
      color: $primary-color;
    }

    .toc-label {
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }
}

/* 内容区域 */
.content-area {
  height: calc(100vh - 90px);
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: $white;
  transition: margin-left 0.3s ease;
}

/* 阅读器区域 */
.reader-area {
  overflow: hidden;
  padding: clamp(16px, 4vw, 32px);
  background-color: #fafafa;
  color: $text-color;
  background-color: var(--reader-bg, #fafafa);
  color: var(--reader-text, $text-color);

  /* 阅读区域最大宽度，提高可读性 */
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  /* 确保有明确的高度，解决 Epub.js 渲染高度问题 */
  height: calc(100% - 120px);
  min-height: 0;


}

/* 阅读内容样式 */
.reader-area {
  /* 设置基础字体大小，根据视口宽度自适应 */
  font-size: clamp(16px, 3vw, 20px);

  /* 优化行高，提高可读性 */
  line-height: 1.7;

  /* 设置合适的字间距和字母间距 */
  letter-spacing: 0.01em;
  word-spacing: 0.05em;

  /* 优化段落样式 */
  p {
    margin-bottom: 1.5em;
    text-align: justify;
    text-indent: 2em;
  }

  /* 优化标题样式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1.5em 0 0.8em 0;
    font-weight: 600;
    line-height: 1.3;
    color: var(--reader-title, $primary-color);
  }

  h1 {
    font-size: 1.8em;
  }

  h2 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1.3em;
  }

  /* 优化列表样式 */
  ul,
  ol {
    margin: 1em 0 1em 2em;
    padding-left: 1em;
  }

  li {
    margin-bottom: 0.5em;
  }

  /* 优化链接样式 */
  a {
    color: var(--reader-link, $primary-color);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  a:hover {
    color: darken($primary-color, 10%);
    text-decoration: underline;
  }

  /* 优化图片样式 */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.5em auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* 优化引用样式 */
  blockquote {
    margin: 1.5em 0;
    padding: 0.8em 1.2em;
    border-left: 4px solid $primary-color;
    background-color: rgba($primary-color, 0.05);
    font-style: italic;
  }

  /* 优化代码样式 */
  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre {
    margin: 1.5em 0;
    padding: 1em;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
}

::v-deep(.epub-container) {
  overflow-x: auto !important;
}

/* 导航控制 */
.navigation-controls {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(12px, 3vw, 16px);
  background-color: $white;
  border-top: 1px solid #e0e0e0;
  gap: clamp(12px, 3vw, 16px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

  .nav-btn {
    background-color: $primary-color;
    color: $white;
    border: none;
    padding: clamp(6px, 2vw, 8px) clamp(18px, 4vw, 24px);
    border-radius: 4px;
    cursor: pointer;
    font-size: clamp(12px, 2.5vw, 14px);
    transition: all 0.2s ease;
    min-width: 80px;

    &:hover:not(:disabled) {
      background-color: darken($primary-color, 10%);
      transform: translateY(-2px);
      box-shadow: $shadow-sm;
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  .chapter-info {
    font-size: clamp(12px, 2.5vw, 14px);
    color: $text-secondary;
    min-width: clamp(60px, 15vw, 80px);
    text-align: center;
    font-weight: 500;
  }
}

/* 设置侧边栏 */
.settings-sidebar {
  width: clamp(250px, 40vw, 350px);
  background-color: #f5f5f5;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);

  &.open {
    transform: translateX(0);
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(12px, 3vw, 16px);
    border-bottom: 1px solid #e0e0e0;
    background-color: $white;

    h3 {
      margin: 0;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: clamp(20px, 5vw, 24px);
      cursor: pointer;
      color: $text-secondary;
      padding: 0;
      width: clamp(25px, 6vw, 30px);
      height: clamp(25px, 6vw, 30px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f0f0f0;
        transform: scale(1.1);
      }
    }
  }

  .settings-content {
    padding: clamp(12px, 3vw, 16px);
  }

  .setting-group {
    margin-bottom: clamp(18px, 4vw, 24px);

    .setting-label {
      display: block;
      font-size: clamp(13px, 2.8vw, 14px);
      font-weight: 500;
      margin-bottom: clamp(6px, 2vw, 8px);
      color: $text-color;
    }

    .setting-control {
      display: flex;
      align-items: center;
      gap: clamp(10px, 2.5vw, 12px);
    }

    .size-btn {
      background-color: $primary-color;
      color: $white;
      border: none;
      width: clamp(25px, 6vw, 30px);
      height: clamp(25px, 6vw, 30px);
      border-radius: 4px;
      cursor: pointer;
      font-size: clamp(14px, 3vw, 16px);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background-color: darken($primary-color, 10%);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    .font-size {
      font-size: clamp(12px, 2.5vw, 14px);
      color: $text-color;
      min-width: clamp(40px, 10vw, 50px);
      text-align: center;
      font-weight: 500;
    }

    .theme-btn {
      flex: 1;
      background-color: $white;
      color: $text-color;
      border: 1px solid #e0e0e0;
      padding: clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px);
      border-radius: 4px;
      cursor: pointer;
      font-size: clamp(12px, 2.5vw, 14px);
      transition: all 0.2s ease;

      &:hover {
        border-color: $primary-color;
        transform: translateY(-1px);
      }

      &.active {
        background-color: $primary-color;
        color: $white;
        border-color: $primary-color;
      }
    }
  }
}

/* 滚动条样式优化 */
.reader-area::-webkit-scrollbar {
  width: 8px;
}

.reader-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.reader-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.reader-area::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .reader-container {
    height: 100vh;
  }

  .reader-area {
    padding: clamp(12px, 3vw, 20px);
    font-size: clamp(15px, 3.5vw, 18px);
  }

  .toc-sidebar,
  .settings-sidebar {
    width: clamp(220px, 80vw, 280px);
  }

  /* 移动端优化阅读体验 */
  .reader-area {
    p {
      text-indent: 1.5em;
      margin-bottom: 1.2em;
    }

    h1,
    h2,
    h3 {
      margin: 1.2em 0 0.6em 0;
    }
  }
}

@media (max-width: 480px) {
  .reader-header {
    padding: 10px 12px;
  }

  .reader-area {
    padding: 10px;
    font-size: 16px;
  }

  .navigation-controls {
    padding: 10px;
    gap: 8px;
  }

  .nav-btn {
    min-width: 60px;
    padding: 6px 12px;
  }
}

/* 平板设备优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .reader-area {
    max-width: 650px;
  }
}

/* 大屏设备优化 */
@media (min-width: 1025px) {
  .reader-area {
    max-width: 750px;
    font-size: 18px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .reader-area {
    color: #000000;
    background-color: #ffffff;

    &.dark-theme {
      color: #ffffff;
      background-color: #000000;
    }
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>