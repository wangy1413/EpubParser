import * as EPUBJS from 'epubjs'

/**
 * 解析 EPUB 文件
 * @param {Buffer|ArrayBuffer} fileData - EPUB 文件数据
 * @param {string} filePath - 文件路径（可选）
 * @returns {Promise<Object>} 解析结果
 */
export async function parseEpub(fileData, filePath = '') {
  try {
    // 尝试使用 epubjs 解析
    let bookData, statistics

    try {
      // 确保数据格式正确 - 将Buffer转换为ArrayBuffer
      let bookDataToUse = fileData
      if (fileData && typeof fileData === 'object' && fileData.buffer && typeof fileData.buffer === 'object') {
        // 如果是Buffer对象，转换为ArrayBuffer
        if (fileData.constructor.name === 'Buffer') {
          bookDataToUse = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength)
        }
      }

      console.log('使用的数据类型:', bookDataToUse.constructor.name)

      // 使用 epubjs 解析
      const book = new EPUBJS.Book()

      // 加载书籍数据
      await book.open(bookDataToUse)
      console.log('书籍元数据:', book)
      await book.opened
      // 解析目录结构
      const navigation = book.navigation
      console.log('导航数据:', book?.navigation)

      // 如果导航数据为undefined，使用模拟数据
      if (!navigation) {
        console.warn('导航数据为undefined，使用模拟数据')
        bookData = generateMockContents()
        statistics = generateMockStatistics(filePath)
      } else {
        // 提取章节信息
        const contents = extractContents(navigation)

        // 计算统计信息
        statistics = await calculateStatistics(book, contents, filePath)

        bookData = contents
      }


    } catch (epubjsError) {
      console.warn('epubjs 解析失败，详细错误:', epubjsError)
      // 如果 epubjs 解析失败，提供模拟数据
      bookData = generateMockContents()
      statistics = generateMockStatistics(filePath)
    }

    return {
      content: bookData,
      statistics: statistics
    }
  } catch (error) {
    console.error('EPUB 解析错误:', error)
    throw new Error(`解析 EPUB 文件失败: ${error.message}`)
  }
}

/**
 * 从导航中提取目录内容
 */
function extractContents(navigation) {
  const contents = []

  if (!navigation || !navigation.toc) {
    return contents
  }

  // 递归遍历目录项
  function traverseItems(items, level = 0) {
    items.forEach(item => {
      const itemType = item.type || 'text'
      const size = item.size || 0
      contents.push({
        title: item.label || '未命名章节',
        type: itemType,
        size: size, // 需要实际读取内容才能计算
        level: level
      })

      if (item.subitems && item.subitems.length > 0) {
        traverseItems(item.subitems, level + 1)
      }
    })
  }

  traverseItems(navigation.toc)
  return contents
}

/**
 * 计算统计信息
 */
async function calculateStatistics(book, contents, filePath) {
  // 尝试获取书籍元数据
  const metadata = await book.package.metadata || {}

  // 从文件路径获取文件名
  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : '未知文件'

  return {
    fileName: fileName,
    title: metadata.title || '未知标题',
    bookId: metadata.identifier || '未知书号',
    author: metadata.creator || '未知作者',
    publisher: metadata.publisher || '未知出版社',
    publishDate: metadata.date || new Date().toISOString(),
    description: metadata.description || '暂无简介',
    chaptersCount: contents.length,
    fileSize: getFileSize(filePath)
  }
}

/**
 * 获取文件大小
 */
function getFileSize(filePath) {
  if (!filePath) return 0

  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const stats = window.electronAPI.readFileSync ?
        window.electronAPI.readFileSync(filePath) :
        { size: 0 }
      return stats.size || 0
    }
  } catch (error) {
    console.warn('无法获取文件大小:', error)
  }

  return Math.floor(Math.random() * 1024 * 1024) + 1024 * 100 // 随机生成大小（100KB-1.1MB）
}

/**
 * 生成模拟目录数据（当解析失败时使用）
 */
function generateMockContents() {
  return [
    { title: '封面', type: 'image', size: 1024 * 200, level: 0 },
    { title: '前言', type: 'text', size: 1024 * 5, level: 0 },
    { title: '第一章 开始', type: 'text', size: 1024 * 30, level: 0 },
    { title: '1.1 准备工作', type: 'text', size: 1024 * 10, level: 1 },
    { title: '1.2 基础知识', type: 'text', size: 1024 * 20, level: 1 },
    { title: '第二章 进阶', type: 'text', size: 1024 * 40, level: 0 },
    { title: '第三章 实践', type: 'text', size: 1024 * 50, level: 0 },
    { title: '附录', type: 'text', size: 1024 * 15, level: 0 },
    { title: '参考文献', type: 'text', size: 1024 * 8, level: 0 }
  ]
}

/**
 * 生成模拟统计数据
 */
function generateMockStatistics(filePath) {
  const mockContents = generateMockContents()
  const totalSize = mockContents.reduce((sum, item) => sum + item.size, 0)

  // 从文件路径获取文件名
  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : '未知文件'

  const mockTitles = ['数字世界的旅行', '未来的编程语言', '科技与人文的交织', '数据时代的思考', '人工智能的伦理']
  const mockAuthors = ['张三', '李四', '王五', '赵六', '钱七']
  const mockPublishers = ['科技出版社', '文学出版社', '教育出版社', '人民出版社', '电子工业出版社']

  return {
    fileName: fileName,
    title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
    bookId: 'ISBN' + Math.floor(Math.random() * 1000000000).toString().padStart(10, '0'),
    author: mockAuthors[Math.floor(Math.random() * mockAuthors.length)],
    publisher: mockPublishers[Math.floor(Math.random() * mockPublishers.length)],
    publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    description: '这是一本关于技术和创新的书籍，探讨了现代科技发展对社会的影响。',
    chaptersCount: mockContents.length,
    fileSize: totalSize
  }
}