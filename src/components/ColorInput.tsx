import { useState, useRef, useEffect } from 'react'

interface ColorInputProps {
  value: string
  onChange: (value: string) => void
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
}

function getBrightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (r + g + b) / 3
}

function adjustBrightness(hex: string, targetBrightness: number): string {
  const [r, g, b] = hexToRgb(hex)
  const currentBrightness = (r + g + b) / 3
  if (currentBrightness === 0) {
    const v = Math.round(targetBrightness)
    return rgbToHex(v, v, v)
  }
  const scale = targetBrightness / currentBrightness
  return rgbToHex(
    Math.min(255, Math.max(0, r * scale)),
    Math.min(255, Math.max(0, g * scale)),
    Math.min(255, Math.max(0, b * scale))
  )
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const swatchRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const brightness = getBrightness(value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
          swatchRef.current && !swatchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleOpen = () => {
    if (swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.right - 200,
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="color-input-wrapper">
      <div
        ref={swatchRef}
        className="color-swatch"
        style={{ backgroundColor: value }}
        onClick={handleOpen}
      />
      {isOpen && (
        <div
          ref={popupRef}
          className="color-picker-popup"
          style={{ top: position.top, left: position.left }}
        >
          <div className="brightness-row">
            <span>☀</span>
            <input
              type="range"
              min={1}
              max={255}
              value={brightness}
              onChange={(e) => onChange(adjustBrightness(value, +e.target.value))}
              className="brightness-slider"
            />
            <span className="brightness-value">{Math.round(brightness)}</span>
          </div>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </div>
  )
}
