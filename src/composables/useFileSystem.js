import { ref } from 'vue'

// 在 uTools 环境中，这些 API 通过 preload.js 暴露
export function useFileSystem() {
  const readEpubFiles = async (dirPath) => {
    if (window.epubAPI) {
      return await window.epubAPI.readEpubFiles(dirPath)
    } else {
      // 开发环境模拟
      return ['/path/to/book1.epub', '/path/to/book2.epub']
    }
  }

  const parseEpubFile = async (filePath) => {
    if (window.epubAPI) {
      return await window.epubAPI.parseEpubFile(filePath)
    } else {
      // 开发环境模拟数据
      return {
        title: `模拟书名 - ${filePath.split('/').pop()}`,
        creator: '模拟作者',
        publisher: '模拟出版社',
        date: '2023-01-01',
        language: 'zh-CN',
        description: '这是一个模拟的EPUB文件描述',
        filePath: filePath,
        fileSize: 1024 * 1024, // 1MB
        fileName: filePath.split('/').pop()
      }
    }
  }

  const exportToCSV = (data, exportPath) => {
    if (window.epubAPI) {
      window.epubAPI.exportToCSV(data, exportPath)
    } else {
      console.log('导出CSV:', data, exportPath)
      // 开发环境模拟导出
    }
  }

  return {
    readEpubFiles,
    parseEpubFile,
    exportToCSV
  }
}