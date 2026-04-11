const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('useThemeColors')) {
    console.log('Skipping (already refactored): ' + filePath);
    return;
  }

  // Imports
  if (content.includes('import { COLORS')) {
    content = content.replace(/import\s+\{([^}]*)COLORS([^}]*)\}\s+from\s+['"]@\/constants\/theme['"];?/, (match, p1, p2) => {
        let inner = (p1 + p2).split(',').map(s=>s.trim()).filter(Boolean).join(', ');
        if (inner) return `import { ${inner} } from '@/constants/theme';`;
        return '';
    });
  }

  content = `import { useThemeColors } from '@/hooks/useThemeColors';\n` + content;

  // Injection
  const functionRegex = /(export default function [A-Za-z0-9_]+\([^)]*\)\s*\{)/;
  if (functionRegex.test(content)) {
    content = content.replace(functionRegex, (match) => {
        return match + `\n  const { colors, isDark } = useThemeColors();\n  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);\n`;
    });
  } else {
    // Arrow function format
    const arrowRegex = /(const [A-Za-z0-9_]+ = \([^)]*\) =>\s*\{)/;
    if (arrowRegex.test(content)) {
      content = content.replace(arrowRegex, (match) => {
          return match + `\n  const { colors, isDark } = useThemeColors();\n  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);\n`;
      });
    } else {
        console.log('Could not find component declaration in: ' + filePath);
        // Continue anyway, maybe it just imports COLORS
    }
  }

  // StyleSheet conversion
  content = content.replace(/const styles = StyleSheet\.create\(\{/g, 'const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({');

  // Replace COLORS
  content = content.replace(/COLORS\./g, 'colors.');
  
  // Replace hardcoded #1A1A1A 
  content = content.replace(/'#1A1A1A'/g, 'colors.background.card');
  content = content.replace(/'#1a1a1a'/g, 'colors.background.card');
  
  content = content.replace(/'rgba\(255,\s*255,\s*255,\s*0\.0[5-9]\)'/g, "isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'");
  content = content.replace(/'rgba\(255,\s*255,\s*255,\s*0\.1[0-9]\)'/g, "isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'");
  content = content.replace(/'rgba\(255,\s*255,\s*255,\s*0\.2\)'/g, "isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'");

  fs.writeFileSync(filePath, content);
  console.log('Refactored: ' + filePath);
}

walkDir('src/screens', refactorFile);
