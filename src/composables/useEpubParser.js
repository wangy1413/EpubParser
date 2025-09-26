import { ref } from 'vue'
import { parseEpub } from '../utils/epubParser'

export function useEpubParser() {
  const loading = ref(false)
  const error = ref(null)
  
  const parseEpubFile = async (filePath) => {
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
      
      const result = await parseEpub(fileData, filePath)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    parseEpubFile,
    loading,
    error
  }
}