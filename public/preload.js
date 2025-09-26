const fs = require('fs');
const path = require('path');

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

// 暴露API给渲染进程
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
      const headers = ['文件名', '书名', '作者', '出版社', '出版日期', '语言', '文件大小'];
      const csvRows = data
        .filter(item => item.success)
        .map(item => [
          `"${item.data.fileName.replace(/"/g, '""')}"`,
          `"${item.data.title.replace(/"/g, '""')}"`,
          `"${item.data.creator.replace(/"/g, '""')}"`,
          `"${item.data.publisher.replace(/"/g, '""')}"`,
          `"${item.data.date}"`,
          `"${item.data.language}"`,
          `"${(item.data.fileSize / 1024 / 1024).toFixed(2)} MB"`
        ].join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      fs.writeFileSync(exportPath, '\uFEFF' + csvContent, 'utf8');
    } catch (error) {
      throw new Error(`导出CSV失败: ${error.message}`);
    }
  }
};