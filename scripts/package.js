const fs = require('fs');
const path = require('path');

// 复制必要的文件到dist目录
const filesToCopy = ['plugin.json', 'public/logo.png', 'public/preload.js'];

filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(__dirname, '..', 'dist', path.basename(file));

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`已复制: ${file}`);
  }
});

console.log('打包完成！');