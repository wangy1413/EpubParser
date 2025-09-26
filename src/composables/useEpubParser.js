import { ref, computed } from 'vue'
import { useFileSystem } from './useFileSystem'

export function useEpubParser() {
  const results = ref([])
  const isProcessing = ref(false)
  const progress = ref(0)
  const currentFile = ref('')
  const totalFiles = ref(0)

  const { readEpubFiles, parseEpubFile, exportToCSV } = useFileSystem()

  const parseFiles = async (filePaths) => {
    isProcessing.value = true
    results.value = []
    totalFiles.value = filePaths.length

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]
      currentFile.value = filePath
      progress.value = Math.round(((i + 1) / filePaths.length) * 100)

      try {
        const metadata = await parseEpubFile(filePath)
        results.value.push({
          success: true,
          data: metadata
        })
      } catch (error) {
        results.value.push({
          success: false,
          error: error.message,
          filePath: filePath
        })
      }
    }

    isProcessing.value = false
    progress.value = 0
    currentFile.value = ''
  }

  const parseFolder = async (folderPath) => {
    try {
      const epubFiles = await readEpubFiles(folderPath)
      if (epubFiles.length === 0) {
        throw new Error('该文件夹中没有找到EPUB文件')
      }
      await parseFiles(epubFiles)
    } catch (error) {
      console.error('处理文件夹失败:', error)
      // 可以添加错误提示
    }
  }

  return {
    results,
    isProcessing,
    progress,
    currentFile,
    totalFiles,
    parseFiles,
    parseFolder,
    exportToCSV
  }
}