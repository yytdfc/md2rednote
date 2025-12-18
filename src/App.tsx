import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import './App.css'

interface PageConfig {
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMargin: number
  pageWidth: number
  pageHeight: number
  theme: 'light' | 'dark' | 'sepia' | 'pink'
}

const defaultConfig: PageConfig = {
  fontFamily: 'PingFang SC',
  fontSize: 16,
  lineHeight: 1.8,
  pageMargin: 40,
  pageWidth: 400,
  pageHeight: 600,
  theme: 'light',
}

const themes = {
  light: { bg: '#ffffff', text: '#333333', accent: '#e74c3c', quote: '#666666' },
  dark: { bg: '#1a1a2e', text: '#eaeaea', accent: '#ff6b6b', quote: '#aaaaaa' },
  sepia: { bg: '#f4ecd8', text: '#5c4b37', accent: '#8b4513', quote: '#7a6a5a' },
  pink: { bg: '#fff0f5', text: '#4a4a4a', accent: '#ff69b4', quote: '#888888' },
}

const fontOptions = [
  'PingFang SC',
  'Microsoft YaHei',
  'Noto Sans SC',
  'Source Han Sans CN',
  'Source Han Serif CN',
  'Noto Serif SC',
  'Helvetica Neue',
  'Arial',
  'Georgia',
  'Times New Roman',
]

const STORAGE_KEY = 'md-paged-config'

const exampleMarkdown = `# Markdown to Paged.js 演示

这是一个将 Markdown 渲染成分页内容的小工具。

## 主要功能

- 支持 Markdown 语法解析
- 使用 Paged.js 进行自动分页
- 实时预览效果

## 使用方法

1. 在左侧编辑器中输入 Markdown 内容
2. 右侧会自动渲染成分页效果
3. 可以调整页面尺寸和样式

## 代码示例

\`\`\`javascript
const greeting = "Hello, Paged.js!";
console.log(greeting);
\`\`\`

## 引用

> Paged.js 让 Web 开发者可以使用熟悉的 HTML 和 CSS 来创建专业的印刷品质文档。

## 更多内容

这里是一些额外的段落，用于测试分页效果。Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## 结语

感谢使用本工具！
`

function App() {
  const [markdown, setMarkdown] = useState(exampleMarkdown)
  const [config, setConfig] = useState<PageConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig
  })
  const [isRendering, setIsRendering] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const generateStyles = useCallback((cfg: PageConfig) => {
    const theme = themes[cfg.theme]
    return `
@page {
  size: ${cfg.pageWidth}px ${cfg.pageHeight}px;
  margin: ${cfg.pageMargin}px;
}
body {
  font-family: "${cfg.fontFamily}", "Noto Serif SC", "Noto Sans SC", sans-serif;
  font-size: ${cfg.fontSize}px;
  line-height: ${cfg.lineHeight};
  color: ${theme.text};
  background: ${theme.bg};
}
h1 { font-size: ${cfg.fontSize * 1.75}px; color: ${theme.accent}; break-after: avoid; margin-top: 0; }
h2 { font-size: ${cfg.fontSize * 1.375}px; color: ${theme.text}; break-after: avoid; margin-top: 1.5em; }
h3 { font-size: ${cfg.fontSize * 1.125}px; color: ${theme.text}; break-after: avoid; }
p { margin-bottom: 1em; text-align: justify; }
ul, ol { margin: 1em 0; padding-left: 2em; }
li { margin-bottom: 0.5em; break-inside: avoid; }
blockquote {
  border-left: 4px solid ${theme.accent};
  padding-left: 16px;
  margin: 1em 0;
  color: ${theme.quote};
  font-style: italic;
  break-inside: avoid;
}
pre {
  background: ${cfg.theme === 'dark' ? '#2d2d44' : '#f5f5f5'};
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  break-inside: avoid;
  font-size: ${cfg.fontSize * 0.875}px;
}
code {
  font-family: 'Monaco', 'Menlo', monospace;
  background: ${cfg.theme === 'dark' ? '#2d2d44' : '#f5f5f5'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: ${cfg.fontSize * 0.875}px;
}
pre code { background: none; padding: 0; }
`
  }, [])

  useEffect(() => {
    if (!markdown) return

    const renderPaged = async () => {
      setIsRendering(true)
      
      const htmlContent = marked.parse(markdown) as string
      const oldIframe = iframeRef.current
      if (!oldIframe?.parentNode) return

      // Create new iframe to avoid state pollution
      const newIframe = document.createElement('iframe')
      newIframe.title = 'preview'
      oldIframe.parentNode.replaceChild(newIframe, oldIframe)
      iframeRef.current = newIframe

      const iframeDoc = newIframe.contentDocument || newIframe.contentWindow?.document
      if (!iframeDoc) return

      const theme = themes[config.theme]
      const styles = generateStyles(config)

      const fontLink = config.fontFamily.includes('Serif') || config.fontFamily.includes('宋')
        ? '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">'
        : config.fontFamily.includes('Noto Sans') || config.fontFamily.includes('Source Han Sans')
        ? '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">'
        : ''

      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${fontLink}
          <style>${styles}</style>
          <style>
            .pagedjs_pages {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: center;
            }
            .pagedjs_page {
              background: ${theme.bg};
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              flex-shrink: 0;
            }
          </style>
        </head>
        <body style="background: #444; padding: 20px;">
          <div id="content">${htmlContent}</div>
          <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"><\/script>
          <script>
            class PagedHandler extends Paged.Handler {
              afterRendered() {
                window.parent.postMessage('rendered', '*');
              }
            }
            Paged.registerHandlers(PagedHandler);
          <\/script>
        </body>
        </html>
      `)
      iframeDoc.close()
    }

    const timer = setTimeout(renderPaged, 500)
    return () => clearTimeout(timer)
  }, [markdown, config, generateStyles])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'rendered') setIsRendering(false)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const updateConfig = (key: keyof PageConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const resetConfig = () => setConfig(defaultConfig)

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paged-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string)
          setConfig({ ...defaultConfig, ...imported })
        } catch {
          alert('配置文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const exportImages = async () => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const pages = iframeDoc.querySelectorAll('.pagedjs_page')
    if (pages.length === 0) {
      alert('没有可导出的页面')
      return
    }

    setIsExporting(true)

    try {
      // Use File System Access API to let user pick a directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      
      // @ts-expect-error File System Access API
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      const subDirHandle = await dirHandle.getDirectoryHandle(`pages-${timestamp}`, { create: true })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        })
        
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob((b) => resolve(b!), 'image/png')
        )
        
        const fileName = `page-${String(i + 1).padStart(2, '0')}.png`
        const fileHandle = await subDirHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
      }
      
      alert(`已导出 ${pages.length} 张图片到 pages-${timestamp} 文件夹`)
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled
      } else {
        console.error('Export error:', err)
        alert('导出失败，请重试')
      }
    }

    setIsExporting(false)
  }

  return (
    <div className="app">
      <div className="left-panel">
        <div className="config-panel">
          <h3>页面配置</h3>
          <div className="config-grid">
            <label>
              字体
              <select value={config.fontFamily} onChange={e => updateConfig('fontFamily', e.target.value)}>
                {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label>
              字号
              <input type="number" value={config.fontSize} min={12} max={24} 
                onChange={e => updateConfig('fontSize', +e.target.value)} />
            </label>
            <label>
              行高
              <input type="number" value={config.lineHeight} min={1.2} max={2.5} step={0.1}
                onChange={e => updateConfig('lineHeight', +e.target.value)} />
            </label>
            <label>
              页边距
              <input type="number" value={config.pageMargin} min={20} max={80}
                onChange={e => updateConfig('pageMargin', +e.target.value)} />
            </label>
            <label>
              页宽
              <input type="number" value={config.pageWidth} min={300} max={800}
                onChange={e => updateConfig('pageWidth', +e.target.value)} />
            </label>
            <label>
              页高
              <input type="number" value={config.pageHeight} min={400} max={1000}
                onChange={e => updateConfig('pageHeight', +e.target.value)} />
            </label>
            <label>
              主题
              <select value={config.theme} onChange={e => updateConfig('theme', e.target.value)}>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="sepia">复古</option>
                <option value="pink">粉色</option>
              </select>
            </label>
          </div>
          <div className="config-actions">
            <button onClick={resetConfig}>重置</button>
            <button onClick={exportConfig}>导出配置</button>
            <button onClick={importConfig}>导入配置</button>
            <button onClick={exportImages} disabled={isRendering || isExporting} className="export-btn">
              {isExporting ? '导出中...' : '导出图片'}
            </button>
          </div>
        </div>
        <div className="editor-panel">
          <h3>Markdown 编辑器</h3>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="输入 Markdown 内容..."
          />
        </div>
      </div>
      <div className="preview-panel">
        <h3>分页预览 {isRendering && <span className="loading">渲染中...</span>}</h3>
        <div className="preview-container">
          <iframe ref={iframeRef} title="preview" />
        </div>
      </div>
    </div>
  )
}

export default App
