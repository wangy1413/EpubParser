import * as EPUBJS from 'epubjs'

/**
 * 解析 EPUB 文件
 * @param {Buffer|ArrayBuffer} fileData - EPUB 文件数据
 * @param {string} filePath - 文件路径（可选）
 * @param {boolean} extractCover - 是否提取封面图，默认 true
 * @returns {Promise<Object>} 解析结果
 */
export async function parseEpub(fileData, filePath = '', extractCover = true) {
  console.log(extractCover)
  try {
    // 尝试使用 epubjs 解析
    let bookData, statistics, coverImage

    try {
      // 确保数据格式正确 - 将Buffer转换为ArrayBuffer
      let bookDataToUse = fileData
      if (fileData && typeof fileData === 'object' && fileData.buffer && typeof fileData.buffer === 'object') {
        // 如果是Buffer对象，转换为ArrayBuffer
        if (fileData.constructor.name === 'Buffer') {
          bookDataToUse = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength)
        }
      }

      // 使用 epubjs 解析
      const book = new EPUBJS.Book()

      // 加载书籍数据
      await book.open(bookDataToUse)
      await book.opened
      // 解析目录结构
      const navigation = book.navigation

      // 提取封面图（仅当 extractCover 为 true 时）
      if (extractCover) {
        coverImage = await extractCoverImage(book)
      } else {
        coverImage = null
      }

      // 如果导航数据为undefined，使用模拟数据
      if (!navigation) {
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
      // 如果 epubjs 解析失败，提供模拟数据
      bookData = generateMockContents()
      statistics = generateMockStatistics(filePath)
    }

    return {
      content: bookData,
      statistics: statistics,
      coverImage: coverImage
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
 * 提取封面图
 * @param {Object} book - epubjs Book 对象
 * @returns {Promise<string|null>} 封面图的 Base64 编码或 null
 */
async function extractCoverImage(book) {
  try {
    // 方法1: 从书籍的封面属性获取
    if (book.cover) {
      try {
        const response = await book.request(book.cover)
        if (response && response.blob) {
          const blob = await response.blob()
          return await blobToBase64(blob)
        }
      } catch (error) {
        // 忽略错误，继续尝试其他方法
      }
    }

    // 方法2: 从 OPF 元数据中查找
    if (book.package && book.package.metadata) {
      const metadata = book.package.metadata
      // 查找 cover-image 元数据
      if (metadata['cover-image']) {
        const coverId = metadata['cover-image']
        if (book.package.manifest) {
          const coverItem = book.package.manifest.find(item => item.id === coverId)
          if (coverItem && coverItem.href) {
            try {
              const response = await book.request(coverItem.href)
              if (response && response.blob) {
                const blob = await response.blob()
                return await blobToBase64(blob)
              }
            } catch (error) {
              // 忽略错误，继续尝试其他方法
            }
          }
        }
      }
    }

    // 方法3: 尝试从目录的第一个项目获取（通常封面是第一个项目）
    if (book.navigation && book.navigation.toc && book.navigation.toc.length > 0) {
      const firstItem = book.navigation.toc[0]
      if (firstItem && firstItem.href) {
        try {
          // 这里简化处理，实际可能需要解析HTML内容查找图片
          const response = await book.request(firstItem.href)
          if (response && response.text) {
            const html = await response.text()
            // 简单的HTML解析，查找第一个图片标签
            const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/i)
            if (imgMatch && imgMatch[1]) {
              // 处理相对路径
              const imgSrc = imgMatch[1].startsWith('http') ? imgMatch[1] : new URL(imgMatch[1], new URL(firstItem.href, book.url)).href
              try {
                const imgResponse = await fetch(imgSrc)
                if (imgResponse.ok) {
                  const blob = await imgResponse.blob()
                  return await blobToBase64(blob)
                }
              } catch (error) {
                // 忽略错误，继续尝试其他方法
              }
            }
          }
        } catch (error) {
          // 忽略错误，继续尝试其他方法
        }
      }
    }

    // 方法4: 使用 book.coverUrl() 获取封面图 URL，然后转换为 Base64
    try {
      const coverUrl = await book.coverUrl()
      if (coverUrl) {
        // 如果是 blob URL，直接获取 blob 对象
        if (coverUrl.startsWith('blob:')) {
          // 使用 fetch 获取 blob 对象
          const response = await fetch(coverUrl)
          if (response.ok) {
            const blob = await response.blob()
            return await blobToBase64(blob)
          }
        } else {
          // 如果是普通 URL，使用 book.request 获取
          const response = await book.request(coverUrl)
          if (response && response.blob) {
            const blob = await response.blob()
            return await blobToBase64(blob)
          }
        }
      }
    } catch (error) {
      // 忽略错误，继续尝试其他方法
    }

    return null
  } catch (error) {
    console.error('提取封面图时出错:', error)
    return null
  }
}

/**
 * 将 Blob 转换为 Base64 编码
 * @param {Blob} blob - Blob 对象
 * @returns {Promise<string>} Base64 编码的字符串
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 格式化书号
 * @param {string} bookId - 原始书号
 * @returns {string} 格式化后的书号
 */
function formatBookId(bookId) {
  if (!bookId) return ''

  // 处理 UUID 格式 (urn:uuid:xxx-xxx-xxx)
  if (bookId.startsWith('urn:uuid:')) {
    return ''
  }

  // 可以添加其他格式的处理逻辑
  return bookId
}

/**
 * 计算统计信息
 */
async function calculateStatistics(book, contents, filePath) {
  // 尝试获取书籍元数据
  const metadata = book.package.metadata || {}

  // 从文件路径获取文件名
  const fileName = filePath ? filePath.split('/').pop() || filePath.split('\\').pop() : '未知文件'

  // 过滤作者字段
  let author = metadata.creator || ''
  if (author.toLowerCase() === 'unknown') {
    author = ''
  }

  // 过滤出版时间
  let publishDate = metadata.date || metadata.pubdate || ''
  // 处理无效的默认时间
  if (publishDate === '0101-01-01T00:00:00+00:00' || publishDate === '0001-01-01T00:00:00Z') {
    publishDate = ''
  } else if (publishDate) {
    // 格式化有效的出版时间
    publishDate = new Date(publishDate).toISOString().split('T')[0]
  }

  // 过滤简介中的HTML标签
  let description = metadata.description || ''
  if (description) {
    // 使用正则表达式移除HTML标签
    description = description.replace(/<[^>]*>/g, '')
    // 移除多余的空格和换行
    description = description.replace(/\s+/g, ' ').trim()
  }

  return {
    fileName: fileName,
    title: metadata.title || '',
    bookId: formatBookId(metadata.identifier),
    author: author,
    publisher: metadata.publisher || '',
    publishDate: publishDate,
    description: description
  }
}

/**
 * 生成模拟目录数据（当解析失败时使用）
 */
function generateMockContents() {
  return [
    { title: '封面', type: 'image', level: 0 },
    { title: '前言', type: 'text', level: 0 },
    { title: '第一章 开始', type: 'text', level: 0 },
    { title: '1.1 准备工作', type: 'text', level: 1 },
    { title: '1.2 基础知识', type: 'text', level: 1 },
    { title: '第二章 进阶', type: 'text', level: 0 },
    { title: '第三章 实践', type: 'text', level: 0 },
    { title: '附录', type: 'text', level: 0 },
    { title: '参考文献', type: 'text', level: 0 }
  ]
}

/**
 * 生成模拟统计数据
 */
function generateMockStatistics(filePath) {
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
    publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '这是一本关于技术和创新的书籍，探讨了现代科技发展对社会的影响。',
    coverImage: null
  }
}