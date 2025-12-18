import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import './App.css'
import exampleMarkdown from './example.md?raw'

interface PageConfig {
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMargin: number
  pageWidth: number
  pageHeight: number
  theme: 'light' | 'cream' | 'paper' | 'dark' | 'midnight' | 'sepia' | 'pink' | 'mint' | 'ocean' | 'lavender'
  textColor: string
  bgColor: string
  showPageNumber: boolean
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'bottom-left'
  showPageLines: boolean
  coverFontFamily: string
  coverFontSize: number
  coverColor: string
  headingColor: string
  boldColor: string
  exportScale: number
  exportFormat: 'png' | 'jpeg' | 'webp'
}

const defaultConfig: PageConfig = {
  fontFamily: 'PingFang SC',
  fontSize: 16,
  lineHeight: 1.8,
  pageMargin: 40,
  pageWidth: 400,
  pageHeight: 600,
  theme: 'light',
  textColor: '#333333',
  bgColor: '#ffffff',
  showPageNumber: false,
  pageNumberPosition: 'bottom-center',
  showPageLines: false,
  coverFontFamily: 'Source Han Serif SC VF',
  coverFontSize: 36,
  coverColor: '#e74c3c',
  headingColor: '#e74c3c',
  boldColor: '#d35400',
  exportScale: 2,
  exportFormat: 'png',
}

const themes = {
  light: { bg: '#ffffff', text: '#333333', accent: '#e74c3c', quote: '#666666', headingColor: '#e74c3c', boldColor: '#d35400', codeBg: '#f5f5f5' },
  cream: { bg: '#FFFEF5', text: '#1a1a1a', accent: '#e74c3c', quote: '#666666', headingColor: '#c0392b', boldColor: '#e67e22', codeBg: '#f5f0e6' },
  paper: { bg: '#F9F6F2', text: '#2d2d2d', accent: '#d35400', quote: '#777777', headingColor: '#c0392b', boldColor: '#e74c3c', codeBg: '#efe9e1' },
  dark: { bg: '#1a1a2e', text: '#eaeaea', accent: '#ff6b6b', quote: '#aaaaaa', headingColor: '#ff6b6b', boldColor: '#ffa502', codeBg: '#2d2d44' },
  midnight: { bg: '#0d1117', text: '#c9d1d9', accent: '#58a6ff', quote: '#8b949e', headingColor: '#58a6ff', boldColor: '#7ee787', codeBg: '#161b22' },
  sepia: { bg: '#f4ecd8', text: '#5c4b37', accent: '#8b4513', quote: '#7a6a5a', headingColor: '#8b4513', boldColor: '#a0522d', codeBg: '#e8dcc8' },
  pink: { bg: '#fff0f5', text: '#4a4a4a', accent: '#ff69b4', quote: '#888888', headingColor: '#ff69b4', boldColor: '#db7093', codeBg: '#ffe4ec' },
  mint: { bg: '#f0fff4', text: '#2d3748', accent: '#38a169', quote: '#718096', headingColor: '#276749', boldColor: '#2f855a', codeBg: '#e0f5e8' },
  ocean: { bg: '#f0f9ff', text: '#1e3a5f', accent: '#0077b6', quote: '#64748b', headingColor: '#0077b6', boldColor: '#00b4d8', codeBg: '#e0f0fa' },
  lavender: { bg: '#faf5ff', text: '#44337a', accent: '#805ad5', quote: '#718096', headingColor: '#6b46c1', boldColor: '#9f7aea', codeBg: '#f0e8fa' },
}

const fontOptions = [
  'PingFang SC',
  'Microsoft YaHei',
  'Smiley Sans',
  'Source Han Serif SC VF',
  'Helvetica Neue',
  'Arial',
  'Georgia',
  'Times New Roman',
]

const STORAGE_KEY = 'md-paged-config'

function App() {
  const [markdown, setMarkdown] = useState(exampleMarkdown)
  const [config, setConfig] = useState<PageConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig
  })
  const [isRendering, setIsRendering] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [configCollapsed, setConfigCollapsed] = useState(false)
  const [configWidth, setConfigWidth] = useState(280)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const generateStyles = useCallback((cfg: PageConfig) => {
    const theme = themes[cfg.theme]
    
    const pageNumberContent = `counter(page) " / " counter(pages)`
    const pageNumberStyle = cfg.showPageNumber ? `
      @${cfg.pageNumberPosition} {
        content: ${pageNumberContent};
        font-size: ${cfg.fontSize * 0.75}px;
        color: ${theme.quote};
      }` : ''
    


    return `
@page {
  size: ${cfg.pageWidth}px ${cfg.pageHeight}px;
  margin: ${cfg.pageMargin}px;
  ${pageNumberStyle}
}
body {
  font-family: "${cfg.fontFamily}", "Source Han Serif SC VF", "PingFang SC", sans-serif;
  font-size: ${cfg.fontSize}px;
  line-height: ${cfg.lineHeight};
  color: ${cfg.textColor};
  background: ${cfg.bgColor};
}
/* Cover page - use named page */
.cover {
  page: cover;
  break-after: page;
}
@page cover {
  size: ${cfg.pageWidth}px ${cfg.pageHeight}px;
  margin: 0;
  @top-center { content: none; }
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}
.cover {
  position: relative;
  height: ${cfg.pageHeight}px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover::before {
  content: '';
  position: absolute;
  top: 20%;
  left: ${cfg.pageMargin}px;
  right: ${cfg.pageMargin}px;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${cfg.coverColor}80, transparent);
}
.cover::after {
  content: '';
  position: absolute;
  top: 80%;
  left: ${cfg.pageMargin}px;
  right: ${cfg.pageMargin}px;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${cfg.coverColor}80, transparent);
}
.cover h1 {
  font-family: "${cfg.coverFontFamily}", "Source Han Serif SC VF", "PingFang SC", sans-serif;
  font-size: ${cfg.coverFontSize}px;
  font-weight: bold;
  color: ${cfg.coverColor};
  line-height: 1.4;
  text-align: center;
  margin: 0;
  padding: ${cfg.pageMargin * 1.5}px ${cfg.pageMargin}px;
}
.cover .quote-left {
  position: absolute;
  top: 25%;
  left: 8%;
  font-size: ${cfg.coverFontSize * 1.5}px;
  color: ${cfg.coverColor};
  opacity: 0.2;
}
.cover .quote-right {
  position: absolute;
  bottom: 25%;
  right: 8%;
  font-size: ${cfg.coverFontSize * 1.5}px;
  color: ${cfg.coverColor};
  opacity: 0.2;
}
h1 { font-size: ${cfg.fontSize * 1.75}px; color: ${cfg.headingColor}; break-after: avoid; margin-top: 0; }
h2 { font-size: ${cfg.fontSize * 1.375}px; color: ${cfg.headingColor}; break-after: avoid; margin-top: 1.5em; }
h3 { font-size: ${cfg.fontSize * 1.125}px; color: ${cfg.headingColor}; break-after: avoid; }
strong, b { color: ${cfg.boldColor}; }
p { margin-bottom: 1em; text-align: justify; widows: 2; orphans: 2; }
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
  background: ${theme.codeBg};
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  break-inside: avoid;
  font-size: ${cfg.fontSize * 0.875}px;
}
code {
  font-family: 'Monaco', 'Menlo', monospace;
  background: ${theme.codeBg};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: ${cfg.fontSize * 0.875}px;
}
pre code { background: none; padding: 0; }
.page-break { break-after: page; }
${cfg.showPageLines ? `
.pagedjs_page:not(.pagedjs_first_page) .pagedjs_pagebox::before,
.pagedjs_page:not(.pagedjs_first_page) .pagedjs_pagebox::after {
  content: '';
  position: absolute;
  left: ${cfg.pageMargin}px;
  right: ${cfg.pageMargin}px;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${cfg.headingColor}60, transparent);
}
.pagedjs_page:not(.pagedjs_first_page) .pagedjs_pagebox::before {
  top: ${cfg.pageMargin * 0.7}px;
}
.pagedjs_page:not(.pagedjs_first_page) .pagedjs_pagebox::after {
  bottom: ${cfg.pageMargin}px;
}` : ''}
`
  }, [])

  useEffect(() => {
    if (!markdown) return

    const renderPaged = async () => {
      setIsRendering(true)
      
      let htmlContent = marked.parse(markdown) as string
      // Wrap first h1 in a cover section
      htmlContent = htmlContent.replace(/<h1>(.*?)<\/h1>/, '<section class="cover"><span class="quote-left">「</span><h1>$1</h1><span class="quote-right">」</span></section>')
      // Convert <hr> to page break
      htmlContent = htmlContent.replace(/<hr\s*\/?>/g, '<div class="page-break"></div>')
      // Wrap remaining content for drop cap styling
      const coverEnd = htmlContent.indexOf('</section>') + 10
      htmlContent = htmlContent.slice(0, coverEnd) + '<div class="content">' + htmlContent.slice(coverEnd) + '</div>'
      const oldIframe = iframeRef.current
      if (!oldIframe?.parentNode) return

      // Create new iframe to avoid state pollution
      const newIframe = document.createElement('iframe')
      newIframe.title = 'preview'
      oldIframe.parentNode.replaceChild(newIframe, oldIframe)
      iframeRef.current = newIframe

      const iframeDoc = newIframe.contentDocument || newIframe.contentWindow?.document
      if (!iframeDoc) return

      const styles = generateStyles(config)



      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${styles}</style>
          <style>
            .pagedjs_pages {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: center;
            }
            .pagedjs_page {
              background: ${config.bgColor};
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

  const updateConfig = (key: keyof PageConfig, value: string | number | boolean) => {
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
          scale: config.exportScale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        })
        
        const mimeType = `image/${config.exportFormat}`
        const quality = config.exportFormat === 'png' ? undefined : 0.92
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob((b) => resolve(b!), mimeType, quality)
        )
        
        const fileName = `page-${String(i + 1).padStart(2, '0')}.${config.exportFormat}`
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

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return
      const deltaX = e.clientX - dragStateRef.current.startX
      const newWidth = Math.max(200, Math.min(400, dragStateRef.current.startWidth + deltaX))
      setConfigWidth(newWidth)
    }

    const onMouseUp = () => {
      if (dragStateRef.current) {
        dragStateRef.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const handleConfigResize = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStateRef.current = { startX: e.clientX, startWidth: configWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="app">
      {/* Config Panel */}
      <div className={`config-panel ${configCollapsed ? 'collapsed' : ''}`} style={{ width: configCollapsed ? 48 : configWidth }}>
        <div className="panel-header">
          <button className="collapse-btn" onClick={() => setConfigCollapsed(!configCollapsed)}>
            {configCollapsed ? '▶' : '◀'}
          </button>
          {!configCollapsed && <span>配置</span>}
        </div>
        {!configCollapsed && (
          <div className="config-content">
            <div className="config-section">
              <h4>封面标题</h4>
              <div className="config-row">
                <label>
                  字体
                  <select value={config.coverFontFamily} onChange={e => updateConfig('coverFontFamily', e.target.value)}>
                    {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label>
                  字号
                  <input type="number" value={config.coverFontSize} min={20} max={72} 
                    onChange={e => updateConfig('coverFontSize', +e.target.value)} />
                </label>
                <label>
                  颜色
                  <input type="color" value={config.coverColor} 
                    onChange={e => updateConfig('coverColor', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="config-section">
              <h4>正文样式</h4>
              <div className="config-row">
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
              </div>
              <div className="config-row">
                <label>
                  行高
                  <input type="number" value={config.lineHeight} min={1.2} max={2.5} step={0.1}
                    onChange={e => updateConfig('lineHeight', +e.target.value)} />
                </label>
                <label>
                  主题
                  <select value={config.theme} onChange={e => {
                    const newTheme = e.target.value as PageConfig['theme']
                    const themeColors = themes[newTheme]
                    setConfig(prev => ({
                      ...prev,
                      theme: newTheme,
                      textColor: themeColors.text,
                      bgColor: themeColors.bg,
                      headingColor: themeColors.headingColor,
                      boldColor: themeColors.boldColor,
                      coverColor: themeColors.headingColor,
                    }))
                  }}>
                    <option value="light">浅色</option>
                    <option value="cream">象牙</option>
                    <option value="paper">纸张</option>
                    <option value="dark">深色</option>
                    <option value="midnight">午夜</option>
                    <option value="sepia">复古</option>
                    <option value="pink">粉色</option>
                    <option value="mint">薄荷</option>
                    <option value="ocean">海洋</option>
                    <option value="lavender">薰衣草</option>
                  </select>
                </label>
              </div>
              <div className="config-row">
                <label>
                  字体色
                  <input type="color" value={config.textColor} 
                    onChange={e => updateConfig('textColor', e.target.value)} />
                </label>
                <label>
                  背景色
                  <input type="color" value={config.bgColor} 
                    onChange={e => updateConfig('bgColor', e.target.value)} />
                </label>
              </div>
              <div className="config-row">
                <label>
                  标题色
                  <input type="color" value={config.headingColor} 
                    onChange={e => updateConfig('headingColor', e.target.value)} />
                </label>
                <label>
                  加粗色
                  <input type="color" value={config.boldColor} 
                    onChange={e => updateConfig('boldColor', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="config-section">
              <h4>页面尺寸</h4>
              <div className="config-row">
                <label>
                  宽度
                  <input type="number" value={config.pageWidth} min={300} max={800}
                    onChange={e => updateConfig('pageWidth', +e.target.value)} />
                </label>
                <label>
                  高度
                  <input type="number" value={config.pageHeight} min={400} max={1000}
                    onChange={e => updateConfig('pageHeight', +e.target.value)} />
                </label>
                <label>
                  边距
                  <input type="number" value={config.pageMargin} min={20} max={80}
                    onChange={e => updateConfig('pageMargin', +e.target.value)} />
                </label>
              </div>
            </div>

            <div className="config-section">
              <h4>排版选项</h4>
              <div className="config-checkboxes">
                <label className="checkbox-label">
                  <input type="checkbox" checked={config.showPageNumber} 
                    onChange={e => updateConfig('showPageNumber', e.target.checked)} />
                  页码
                  {config.showPageNumber && (
                    <select value={config.pageNumberPosition} onChange={e => updateConfig('pageNumberPosition', e.target.value)} className="inline-select">
                      <option value="bottom-center">居中</option>
                      <option value="bottom-right">右下</option>
                      <option value="bottom-left">左下</option>
                    </select>
                  )}
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={config.showPageLines} onChange={e => updateConfig('showPageLines', e.target.checked)} />
                  页面线条
                </label>
              </div>
            </div>

            <div className="config-actions">
              <div className="action-row">
                <button onClick={resetConfig}>重置</button>
                <button onClick={exportConfig}>导出配置</button>
                <button onClick={importConfig}>导入配置</button>
              </div>
              <div className="export-row">
                <button onClick={exportImages} disabled={isRendering || isExporting} className="export-btn">
                  {isExporting ? '导出中...' : '📷 导出图片'}
                </button>
                <select 
                  value={config.exportScale} 
                  onChange={e => updateConfig('exportScale', +e.target.value)}
                  className="scale-select"
                  title="导出倍率"
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                </select>
                <select
                  value={config.exportFormat}
                  onChange={e => updateConfig('exportFormat', e.target.value)}
                  className="scale-select"
                  title="导出格式"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!configCollapsed && <div className="resizer" onMouseDown={handleConfigResize} />}

      {/* Main Content - Editor and Preview split 50/50 */}
      <div className="main-content">
        <div className="editor-panel">
          <div className="panel-header">
            <span>Markdown</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="输入 Markdown 内容..."
          />
        </div>

        <div className="preview-panel">
          <div className="panel-header">
            <span>预览</span>
            {isRendering && <span className="loading">渲染中...</span>}
          </div>
          <div className="preview-container">
            <iframe ref={iframeRef} title="preview" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
