const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 存儲所有導出函數及其所在文件
const exportMap = new Map();
// 存儲所有導入語句及其來源
const importMap = new Map();
// 存儲不匹配的情況
const mismatches = [];

// 搜索項目中的所有 TypeScript 文件
function findAllTsFiles(rootDir) {
  return glob.sync(path.join(rootDir, '**/*.{ts,tsx}'), {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
  });
}

// 解析一個 TypeScript 文件，提取導出和導入
function parseFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  // 解析導出
  parseExports(sourceFile, filePath);
  // 解析導入
  parseImports(sourceFile, filePath);
}

// 提取文件中的所有導出
function parseExports(sourceFile, filePath) {
  function visit(node) {
    // 檢查是否是導出聲明
    if (ts.isExportDeclaration(node)) {
      // 處理具名導出
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(exportSpecifier => {
          const exportName = exportSpecifier.name.text;
          if (!exportMap.has(exportName)) {
            exportMap.set(exportName, []);
          }
          exportMap.get(exportName).push(filePath);
        });
      }
    }
    // 檢查是否是導出的函數/變量聲明
    else if (
      (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) &&
      node.modifiers && 
      node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const exportName = node.name.text;
        if (!exportMap.has(exportName)) {
          exportMap.set(exportName, []);
        }
        exportMap.get(exportName).push(filePath);
      }
      else if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(declaration => {
          if (ts.isIdentifier(declaration.name)) {
            const exportName = declaration.name.text;
            if (!exportMap.has(exportName)) {
              exportMap.set(exportName, []);
            }
            exportMap.get(exportName).push(filePath);
          }
        });
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
}

// 提取文件中的所有導入
function parseImports(sourceFile, filePath) {
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      if (node.importClause) {
        // 獲取導入文件路徑
        const importPath = node.moduleSpecifier.text;
        const resolvedPath = resolveImportPath(filePath, importPath);
        
        // 處理默認導入
        if (node.importClause.name) {
          const importName = node.importClause.name.text;
          if (!importMap.has(`${filePath}:${importName}`)) {
            importMap.set(`${filePath}:${importName}`, {
              name: importName,
              from: resolvedPath,
              importingFile: filePath,
              isDefault: true
            });
          }
        }
        
        // 處理具名導入
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach(importSpecifier => {
            const importName = importSpecifier.name.text;
            importMap.set(`${filePath}:${importName}`, {
              name: importName,
              from: resolvedPath,
              importingFile: filePath,
              isDefault: false
            });
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
}

// 解析導入路徑為絕對路徑
function resolveImportPath(currentFilePath, importPath) {
  // 處理相對路徑導入
  if (importPath.startsWith('.')) {
    const baseDir = path.dirname(currentFilePath);
    const absolutePath = path.resolve(baseDir, importPath);
    
    // 嘗試解析實際文件 (.ts, .tsx, .js, .jsx)
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      const fullPath = `${absolutePath}${ext}`;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // 檢查是否是目錄導入（index.ts）
    for (const ext of extensions) {
      const indexPath = path.join(absolutePath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    // 如果無法解析，返回原始路徑
    return importPath;
  }
  
  // 處理非相對路徑（如 package 導入）
  return importPath;
}

// 驗證所有導入是否有效
function validateImports() {
  for (const [_, importInfo] of importMap) {
    const { name, from, importingFile, isDefault } = importInfo;
    
    // 僅驗證項目內的文件導入（跳過包導入）
    if (from.startsWith('.') || path.isAbsolute(from)) {
      // 檢查導入的函數是否在目標文件中定義
      if (exportMap.has(name)) {
        const exportFiles = exportMap.get(name);
        if (!exportFiles.some(file => file.endsWith(from) || from.endsWith(file))) {
          // 找到不一致：導入的函數在其他文件中定義，而不是在聲明的導入來源中
          mismatches.push({
            type: 'mismatch',
            name,
            importedFrom: from,
            importingFile,
            actualFiles: exportFiles
          });
        }
      } else {
        // 找不到導出函數
        mismatches.push({
          type: 'notFound',
          name,
          importedFrom: from,
          importingFile
        });
      }
    }
  }
}

// 生成報告
function generateReport() {
  console.log('\n===== Import Validation Report =====\n');
  
  if (mismatches.length === 0) {
    console.log('No import mismatches found. All imports are valid!');
    return;
  }
  
  console.log(`Found ${mismatches.length} issues:\n`);
  
  mismatches.forEach((mismatch, index) => {
    console.log(`Issue #${index + 1}:`);
    if (mismatch.type === 'mismatch') {
      console.log(`  函數 '${mismatch.name}' 從 '${mismatch.importedFrom}' 匯入`);
      console.log(`  在檔案 '${mismatch.importingFile}' 中`);
      console.log(`  但實際定義在：`);
      mismatch.actualFiles.forEach(file => {
        console.log(`    - ${file}`);
      });
      
      // 提供修正建議
      const suggestedImport = mismatch.actualFiles[0];
      console.log(`  建議修正: 更新匯入來源為正確檔案路徑`);
      const relativePath = path.relative(path.dirname(mismatch.importingFile), suggestedImport)
        .replace(/\.(ts|tsx)$/, '')
        .replace(/\\/g, '/');
      const fixedImport = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      console.log(`  例如: import { ${mismatch.name} } from '${fixedImport}';`);
    } else {
      console.log(`  函數 '${mismatch.name}' 從 '${mismatch.importedFrom}' 匯入`);
      console.log(`  在檔案 '${mismatch.importingFile}' 中`);
      console.log(`  但在專案中沒有找到此函數的導出`);
      
      // 尋找名稱相似的導出
      const similarExports = findSimilarExports(mismatch.name);
      if (similarExports.length > 0) {
        console.log(`  您是否想使用以下類似名稱的函數？`);
        similarExports.forEach(exp => {
          console.log(`    - ${exp.name} (定義在 ${exp.file})`);
        });
      }
    }
    console.log('');
  });
}

// 尋找名稱相似的導出
function findSimilarExports(name) {
  const similarExports = [];
  const threshold = 0.7; // 相似度閾值
  
  for (const [exportName, files] of exportMap.entries()) {
    if (isSimilar(name, exportName, threshold)) {
      similarExports.push({
        name: exportName,
        file: files[0]
      });
    }
  }
  
  return similarExports;
}

// 計算兩個字符串的相似度（使用萊文斯坦距離）
function isSimilar(str1, str2, threshold) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - distance / maxLength;
  return similarity >= threshold;
}

// 萊文斯坦距離算法
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // 創建距離矩陣
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // 填充剩餘的矩陣
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // 刪除
        dp[i][j - 1] + 1,      // 插入
        dp[i - 1][j - 1] + cost // 替換
      );
    }
  }
  
  return dp[m][n];
}

// 主函數
function main(rootDir) {
  console.log(`分析專案：${rootDir}`);
  
  // 1. 找到所有 TypeScript 文件
  const tsFiles = findAllTsFiles(rootDir);
  console.log(`找到 ${tsFiles.length} 個 TypeScript 檔案進行分析`);
  
  // 2. 解析每個文件
  tsFiles.forEach(file => {
    try {
      parseFile(file);
    } catch (err) {
      console.error(`解析檔案 ${file} 時出錯:`, err);
    }
  });
  
  console.log(`共找到 ${exportMap.size} 個匯出函數`);
  console.log(`共找到 ${importMap.size} 個匯入語句`);
  
  // 3. 驗證導入
  validateImports();
  
  // 4. 生成報告
  generateReport();
}

// 如果直接運行腳本，使用命令行參數作為項目根目錄
if (require.main === module) {
  const rootDir = process.argv[2] || '.';
  main(path.resolve(rootDir));
}

module.exports = { main }; 