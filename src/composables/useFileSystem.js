import { ref } from 'vue'

export function useFileSystem() {
  const error = ref(null)

  // 读取文件
  const readFile = async (filePath) => {
    try {
      error.value = null

      if (typeof window !== 'undefined' && window.electronAPI) {
        // uTools 环境
        const data = await window.electronAPI.readFile(filePath)
        return data
      } else {
        throw new Error('无法访问文件系统，需要在 uTools 环境中运行')
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // 同步读取文件
  const readFileSync = (filePath) => {
    try {
      error.value = null

      if (typeof window !== 'undefined' && window.electronAPI) {
        return window.electronAPI.readFileSync(filePath)
      } else {
        throw new Error('无法访问文件系统，需要在 uTools 环境中运行')
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // 获取文件信息
  const getFileStats = async (filePath) => {
    try {
      error.value = null

      if (typeof window !== 'undefined' && window.electronAPI) {
        const stats = await window.electronAPI.getFileStats(filePath)
        return stats
      } else {
        throw new Error('无法访问文件系统，需要在 uTools 环境中运行')
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  // 检查文件是否为 EPUB
  const isEpubFile = (filePath) => {
    return filePath && filePath.toLowerCase().endsWith('.epub')
  }

  // 扫描目录及其子目录中的所有 EPUB 文件，最多返回500个
  const scanDirectoryForEpubs = async (directoryPath, maxFiles = 500) => {
    try {
      error.value = null
      const epubFiles = []
      let fileCount = 0
      let stopScanning = false

      if (typeof window !== 'undefined' && window.electronAPI) {
        // 使用递归函数扫描目录
        const scanRecursively = async (path) => {
          // 如果已经达到最大文件数，停止扫描
          if (stopScanning) {
            return
          }

          // 获取目录内容
          const entries = await window.electronAPI.readdir(path, { withFileTypes: true })

          for (const entry of entries) {
            // 如果已经达到最大文件数，停止扫描
            if (stopScanning) {
              break
            }

            const fullPath = `${path}/${entry.name}`

            if (entry.isDirectory()) {
              // 递归扫描子目录
              await scanRecursively(fullPath)
            } else if (entry.isFile() && isEpubFile(fullPath)) {
              // 达到最大文件数，停止扫描
              if (fileCount >= maxFiles) {
                stopScanning = true
                break
              }

              // 获取文件信息
              let stats = {}
              try {
                stats = await window.electronAPI.getFileStats(fullPath)
              } catch (err) {
                // 忽略获取文件信息失败的情况
              }

              epubFiles.push({
                path: fullPath,
                name: entry.name,
                size: stats.size || 0,
                mtime: stats.mtime || null,
                birthtime: stats.birthtime || null
              })

              // 增加文件计数
              fileCount++
            }
          }
        }

        // 开始扫描
        await scanRecursively(directoryPath)
        return epubFiles
      } else {
        throw new Error('无法访问文件系统，需要在 uTools 环境中运行')
      }
    } catch (err) {
      error.value = err.message
      throw new Error(`扫描目录失败: ${err.message}`)
    }
  }

  return {
    readFile,
    readFileSync,
    getFileStats,
    isEpubFile,
    scanDirectoryForEpubs,
    error
  }
}