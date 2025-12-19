# EPUB Parser (uTools 插件)

一个基于 Vue 3 的 EPUB 文件解析和阅读工具，专为 uTools 插件环境设计。

## 功能特性

- 📁 **文件选择与扫描**：支持单个 EPUB 文件解析和目录批量扫描
- 📊 **统计信息提取**：自动提取 EPUB 书籍的标题、作者、出版信息等元数据
- 📖 **内置阅读器**：基于 epubjs 的轻量级 EPUB 阅读器
- 🎨 **美观界面**：现代化的 Vue 3 界面设计

## 技术栈

- **框架**: Vue 3
- **构建工具**: Vite
- **EPUB 处理**: epubjs
- **样式**: SCSS
- **插件平台**: uTools

## 安装

### 开发环境设置

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/epub-parser-utools-vue.git
   cd epub-parser-utools-vue
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   ```

4. 构建生产版本
   ```bash
   npm run build
   ```

5. 预览生产构建
   ```bash
   npm run preview
   ```

## 在 uTools 中使用

### 插件激活方式

uTools 中可以通过以下方式激活本插件：

1. **关键词激活**：
   - 输入 `epub解析`
   - 输入 `epub阅读`
   - 输入 `批量epub`

2. **文件拖拽激活**：
   - 将 EPUB 文件直接拖拽到 uTools 搜索框

3. **文件选择器激活**：
   - 在文件资源管理器中选择 EPUB 文件，右键选择 "解析EPUB信息"

### 主要功能

#### 1. 文件选择
- 支持单个 EPUB 文件解析
- 通过文件对话框选择文件
- 支持文件拖拽操作

#### 2. 目录扫描
- 扫描指定目录下的所有 EPUB 文件
- 支持批量查看和选择书籍
- 最多显示前 500 个 EPUB 文件

#### 3. 统计信息提取
- 书籍标题、作者、出版者
- 书籍语言、创建日期
- 总页数、章节数
- 封面预览

#### 4. 内置阅读器
- 流畅的翻页体验
- 基于 epubjs 的专业阅读功能
- 自适应屏幕大小

## 项目结构

```
├── public/               # 静态资源
│   ├── logo.png         # 应用图标
│   ├── plugin.json      # uTools 插件配置
│   └── preload/         # 预加载脚本
│       └── services.js
├── src/                 # 源代码
│   ├── components/      # Vue 组件
│   │   ├── BooksTable.vue       # 书籍列表表格
│   │   ├── FileSelector.vue     # 文件选择器组件
│   │   ├── ProgressBar.vue      # 进度条组件
│   │   ├── Reader.vue           # EPUB 阅读器
│   │   ├── ResultsTable.vue     # 解析结果表格
│   │   └── Statistics.vue       # 书籍统计信息
│   ├── composables/     # 组合式函数
│   │   ├── useEpubParser.js     # EPUB 解析逻辑
│   │   └── useFileSystem.js     # 文件系统操作
│   ├── utils/           # 工具函数
│   │   ├── epubParser.js        # EPUB 解析工具
│   │   └── zipUtils.js          # ZIP 处理工具
│   ├── App.vue          # 主应用组件
│   ├── main.js          # 应用入口
│   └── main.scss        # 全局样式
├── index.html           # HTML 模板
├── package.json         # 项目配置
└── vite.config.js       # Vite 配置
```

## 插件配置信息

- **名称**: EPUB 阅读解析器
- **版本**: 1.0.1
- **作者**: yi
- **描述**: 用于 EPUB 文件阅读解析并提取统计信息与封面

## 开发说明

### 组件说明

- **FileSelector**: 处理文件选择和目录扫描
- **BooksTable**: 显示扫描到的 EPUB 文件列表
- **Statistics**: 展示书籍统计信息和封面
- **Reader**: EPUB 阅读器组件
- **ProgressBar**: 操作进度显示
- **ResultsTable**: 解析结果表格

### 组合式函数

- **useEpubParser**: 封装 EPUB 文件解析和阅读功能
- **useFileSystem**: 封装文件系统操作

## 许可证

MIT License

## 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目！