/**
 * 压缩工具函数
 */

/**
 * 创建一个 Blob URL 用于下载
 * @param {Blob} blob - Blob 对象
 * @param {string} fileName - 文件名
 */
export function downloadBlob(blob, fileName) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * 将 Base64 编码转换为 Blob 对象
 * @param {string} base64 - Base64 编码字符串
 * @returns {Blob|null} Blob 对象或 null（如果输入无效）
 */
export function base64ToBlob(base64) {
  if (!base64 || typeof base64 !== 'string') {
    return null
  }

  const matches = base64.match(/^data:(.+);base64,(.+)$/)
  if (!matches || matches.length !== 3) {
    return null
  }

  const mimeType = matches[1]
  const data = atob(matches[2])
  const arrayBuffer = new ArrayBuffer(data.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < data.length; i++) {
    uint8Array[i] = data.charCodeAt(i)
  }

  return new Blob([uint8Array], { type: mimeType })
}

/**
 * 创建 Zip 文件（使用原生 JavaScript 实现简单的 Zip 功能）
 * 注意：这是一个简化版的 Zip 实现，只支持基本的文件存储，不支持压缩
 * @param {Array<Object>} files - 文件数组，每个对象包含 name 和 blob 属性
 * @returns {Promise<Blob>} Zip 文件的 Blob 对象
 */
export async function createZip(files) {
  // 简单的 Zip 文件头和结构
  const zipSignature = new Uint8Array([80, 75, 3, 4])
  const fileHeaderSize = 30
  const endOfCentralDirectorySignature = new Uint8Array([80, 75, 5, 6])
  const endOfCentralDirectorySize = 22

  const zipParts = []
  const centralDirectory = []
  let offset = 0

  // 添加文件签名
  zipParts.push(zipSignature)
  offset += zipSignature.length

  for (const file of files) {
    const fileName = file.name
    const fileBlob = file.blob
    const fileData = new Uint8Array(await fileBlob.arrayBuffer())

    // 先编码文件名，获取字节长度
    const fileNameBytes = new TextEncoder().encode(fileName)

    // 文件头
    const fileHeader = new ArrayBuffer(fileHeaderSize + fileNameBytes.length)
    const fileHeaderView = new DataView(fileHeader)

    // 签名
    fileHeaderView.setUint32(0, 0x04034b50, true)
    // 版本
    fileHeaderView.setUint16(4, 20, true)
    // 标志 - 设置 UTF-8 编码标志
    fileHeaderView.setUint16(6, 0x0800, true)
    // 压缩方法（0 表示存储）
    fileHeaderView.setUint16(8, 0, true)
    // 文件修改时间
    fileHeaderView.setUint16(10, 0, true)
    // 文件修改日期
    fileHeaderView.setUint16(12, 0, true)
    // CRC32
    fileHeaderView.setUint32(14, 0, true)
    // 压缩大小
    fileHeaderView.setUint32(18, fileData.length, true)
    // 未压缩大小
    fileHeaderView.setUint32(22, fileData.length, true)
    // 文件名长度（使用字节长度）
    fileHeaderView.setUint16(26, fileNameBytes.length, true)
    // 额外字段长度
    fileHeaderView.setUint16(28, 0, true)

    // 文件名
    new Uint8Array(fileHeader).set(fileNameBytes, fileHeaderSize)

    // 添加到 Zip 包
    zipParts.push(new Uint8Array(fileHeader))
    zipParts.push(fileData)

    // 中央目录记录
    const centralDirectoryRecord = new ArrayBuffer(46 + fileNameBytes.length)
    const centralDirectoryView = new DataView(centralDirectoryRecord)

    // 签名
    centralDirectoryView.setUint32(0, 0x02014b50, true)
    // 版本制作
    centralDirectoryView.setUint16(4, 20, true)
    // 版本所需
    centralDirectoryView.setUint16(6, 20, true)
    // 标志 - 设置 UTF-8 编码标志
    centralDirectoryView.setUint16(8, 0x0800, true)
    // 压缩方法
    centralDirectoryView.setUint16(10, 0, true)
    // 文件修改时间
    centralDirectoryView.setUint16(12, 0, true)
    // 文件修改日期
    centralDirectoryView.setUint16(14, 0, true)
    // CRC32
    centralDirectoryView.setUint32(16, 0, true)
    // 压缩大小
    centralDirectoryView.setUint32(20, fileData.length, true)
    // 未压缩大小
    centralDirectoryView.setUint32(24, fileData.length, true)
    // 文件名长度（使用字节长度）
    centralDirectoryView.setUint16(28, fileNameBytes.length, true)
    // 额外字段长度
    centralDirectoryView.setUint16(30, 0, true)
    // 文件注释长度
    centralDirectoryView.setUint16(32, 0, true)
    // 磁盘号
    centralDirectoryView.setUint16(34, 0, true)
    // 内部文件属性
    centralDirectoryView.setUint16(36, 0, true)
    // 外部文件属性
    centralDirectoryView.setUint32(38, 0, true)
    // 本地文件头偏移
    centralDirectoryView.setUint32(42, offset, true)

    // 文件名
    new Uint8Array(centralDirectoryRecord).set(fileNameBytes, 46)

    centralDirectory.push(new Uint8Array(centralDirectoryRecord))

    // 更新偏移
    offset += fileHeader.byteLength + fileData.length
  }

  // 中央目录大小
  const centralDirectorySize = centralDirectory.reduce((total, record) => total + record.length, 0)
  const centralDirectoryOffset = offset

  // 添加中央目录
  for (const record of centralDirectory) {
    zipParts.push(record)
    offset += record.length
  }

  // 结束中央目录记录
  const endOfCentralDirectory = new ArrayBuffer(endOfCentralDirectorySize)
  const endOfCentralDirectoryView = new DataView(endOfCentralDirectory)

  // 签名
  endOfCentralDirectoryView.setUint32(0, 0x06054b50, true)
  // 磁盘号
  endOfCentralDirectoryView.setUint16(4, 0, true)
  // 中央目录开始的磁盘号
  endOfCentralDirectoryView.setUint16(6, 0, true)
  // 本磁盘上的中央目录记录数
  endOfCentralDirectoryView.setUint16(8, centralDirectory.length, true)
  // 中央目录记录总数
  endOfCentralDirectoryView.setUint16(10, centralDirectory.length, true)
  // 中央目录大小
  endOfCentralDirectoryView.setUint32(12, centralDirectorySize, true)
  // 中央目录开始偏移
  endOfCentralDirectoryView.setUint32(16, centralDirectoryOffset, true)
  // 注释长度
  endOfCentralDirectoryView.setUint16(20, 0, true)

  zipParts.push(new Uint8Array(endOfCentralDirectory))

  // 合并所有部分 - 使用更安全的方式
  try {
    // 计算总长度
    let totalLength = 0
    for (const part of zipParts) {
      totalLength += part.length
    }

    // 确保 totalLength 是有效的
    if (totalLength <= 0) {
      throw new Error('Zip 文件内容为空')
    }

    // 创建结果数组
    const result = new Uint8Array(totalLength)

    // 合并各个部分
    let position = 0
    for (const part of zipParts) {
      // 确保不会超出边界
      if (position + part.length <= totalLength) {
        result.set(part, position)
        position += part.length
      } else {
        const remaining = totalLength - position
        if (remaining > 0) {
          result.set(part.slice(0, remaining), position)
          break
        }
      }
    }

    return new Blob([result], { type: 'application/zip' })
  } catch (error) {
    // 使用替代方法合并
    return new Blob(zipParts, { type: 'application/zip' })
  }
}
