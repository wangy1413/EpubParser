const fs = require('node:fs')
const path = require('node:path')

// 简单的EPUB解析实现（实际项目中可以使用专业的EPUB解析库）
class SimpleEpubParser {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async parse() {
    try {
      // 这里简化实现，实际应该解压EPUB并解析OPF文件
      const stats = fs.statSync(this.filePath);

      return {
        title: path.basename(this.filePath, '.epub'),
        creator: '未知作者',
        publisher: '未知出版社',
        date: new Date(stats.mtime).toISOString().split('T')[0],
        language: 'zh-CN',
        description: '暂无描述',
        filePath: this.filePath,
        fileSize: stats.size,
        fileName: path.basename(this.filePath)
      };
    } catch (error) {
      throw new Error(`解析EPUB文件失败: ${error.message}`);
    }
  }
}

// 暴露文件系统API给渲染进程
window.electronAPI = {
  // 异步读取文件
  readFile: async (filePath) => {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  },

  // 同步读取文件
  readFileSync: (filePath) => {
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      throw new Error(`同步读取文件失败: ${error.message}`);
    }
  },

  // 获取文件信息
  getFileStats: async (filePath) => {
    try {
      return await fs.promises.stat(filePath);
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  },

  // 读取目录内容
  readdir: async (dirPath, options) => {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        isDirectory: () => entry.isDirectory(),
        isFile: () => entry.isFile()
      }));
    } catch (error) {
      throw new Error(`读取目录失败: ${error.message}`);
    }
  }
};

// 保留原有的epubAPI
window.epubAPI = {
  readEpubFiles: async (dirPath) => {
    try {
      const files = fs.readdirSync(dirPath);
      return files
        .filter(file => path.extname(file).toLowerCase() === '.epub')
        .map(file => path.join(dirPath, file));
    } catch (error) {
      throw new Error(`读取目录失败: ${error.message}`);
    }
  },

  parseEpubFile: async (filePath) => {
    const parser = new SimpleEpubParser(filePath);
    return await parser.parse();
  },

  exportToCSV: (data, exportPath) => {
    try {
      const headers = ['文件名', '书名', '书号', '作者', '出版社', '出版日期', '简介', '章节数', '文件大小'];
      const csvRows = data
        .filter(item => item.success)
        .map(item => {
          const result = item.result || {};
          return [
            `"${(result.fileName || '未知').replace(/"/g, '""')}"`,
            `"${(result.title || '未知').replace(/"/g, '""')}"`,
            `"${(result.bookId || '未知书号').replace(/"/g, '""')}"`,
            `"${(result.author || result.creator || '未知作者').replace(/"/g, '""')}"`,
            `"${(result.publisher || '未知出版社').replace(/"/g, '""')}"`,
            `"${(result.publishDate || result.date || new Date().toISOString()).replace(/"/g, '""')}"`,
            `"${(result.description || '暂无简介').replace(/"/g, '""')}"`,
            result.chaptersCount || 0,
            result.fileSize || 0
          ].join(',');
        });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      fs.writeFileSync(exportPath, '\uFEFF' + csvContent, 'utf8');
    } catch (error) {
      throw new Error(`导出CSV失败: ${error.message}`);
    }
  }
};