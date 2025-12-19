import { ref } from 'vue'
import * as EPUBJS from 'epubjs'
import { parseEpub } from '../utils/epubParser'

export function useEpubParser() {
  const loading = ref(false)
  const error = ref(null)
  const currentBook = ref(null) // 存储当前打开的书籍对象
  const currentRendition = ref(null) // 存储当前的渲染实例

  const parseEpubFile = async (filePath, extractCover = true) => {
    try {
      loading.value = true
      error.value = null

      // 检查是否在 Node.js 环境中
      let fileData
      if (typeof window !== 'undefined' && window.electronAPI) {
        // uTools 环境，使用原生文件系统
        fileData = await window.electronAPI.readFile(filePath)
      } else {
        // 浏览器环境，模拟读取文件（实际项目中需要通过 FileReader）
        throw new Error('浏览器环境暂不支持直接解析文件，请在 uTools 中使用')
      }

      const result = await parseEpub(fileData, filePath, extractCover)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 加载并打开EPUB文件，返回book对象用于阅读器
  const loadBook = async (filePath) => {
    try {
      loading.value = true
      error.value = null

      // 加载新书籍前先关闭之前的书籍，释放资源
      closeBook()

      // 检查是否在 Node.js 环境中
      let fileData
      if (typeof window !== 'undefined' && window.electronAPI) {
        // uTools 环境，使用原生文件系统
        fileData = await window.electronAPI.readFile(filePath)
      } else {
        // 浏览器环境，模拟读取文件（实际项目中需要通过 FileReader）
        throw new Error('浏览器环境暂不支持直接解析文件，请在 uTools 中使用')
      }

      // 确保数据格式正确 - 将Buffer转换为ArrayBuffer
      let bookDataToUse = fileData
      if (fileData && typeof fileData === 'object' && fileData.buffer && typeof fileData.buffer === 'object') {
        // 如果是Buffer对象，转换为ArrayBuffer
        if (fileData.constructor.name === 'Buffer') {
          bookDataToUse = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength)
        }
      }

      // 创建并打开书籍
      const book = new EPUBJS.Book()
      await book.open(bookDataToUse)
      await book.opened

      // 存储当前书籍
      currentBook.value = book

      return book
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 关闭当前书籍，清理所有相关资源
  const closeBook = () => {
    // 清理rendition资源
    if (currentRendition.value) {
      // 销毁rendition，EPUB.js会自动处理事件监听器的移除
      // currentRendition.value.destroy()
      currentRendition.value = null
    }

    // 清理book资源
    if (currentBook.value) {
      // 销毁book，EPUB.js会自动处理事件监听器的移除
      currentBook.value.destroy()
      currentBook.value = null
    }

    // 清理错误状态
    error.value = null
  }

  // 清理所有资源（用于组件卸载或应用退出时）
  const cleanup = () => {
    closeBook()
    // 重置loading状态
    loading.value = false
  }

  return {
    parseEpubFile,
    loadBook,
    closeBook,
    cleanup,
    loading,
    error,
    currentBook,
    currentRendition
  }
}