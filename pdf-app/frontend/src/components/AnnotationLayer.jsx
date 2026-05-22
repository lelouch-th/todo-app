import React, { useState, useRef, useCallback } from 'react'

/**
 * 注釈レイヤーコンポーネント
 * テキスト注釈・ハイライト注釈の追加・表示
 */
export default function AnnotationLayer({
  pageNum,
  scale,
  annotations,
  activeTool,
  onAddAnnotation,
  onDeleteAnnotation,
}) {
  const layerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [currentRect, setCurrentRect] = useState(null)

  const getRelativePos = useCallback((e) => {
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }, [scale])

  const handleMouseDown = useCallback((e) => {
    if (!activeTool || activeTool === 'select') return
    e.preventDefault()
    const pos = getRelativePos(e)
    setIsDragging(true)
    setDragStart(pos)
    setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
  }, [activeTool, getRelativePos])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return
    const pos = getRelativePos(e)
    setCurrentRect({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      width: Math.abs(pos.x - dragStart.x),
      height: Math.abs(pos.y - dragStart.y),
    })
  }, [isDragging, dragStart, getRelativePos])

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || !currentRect) {
      setIsDragging(false)
      setDragStart(null)
      setCurrentRect(null)
      return
    }
    setIsDragging(false)
    setDragStart(null)

    const minSize = 20
    if (currentRect.width < minSize || currentRect.height < minSize) {
      // クリック: テキスト注釈をその位置に配置
      if (activeTool === 'text') {
        const pos = getRelativePos(e)
        onAddAnnotation({
          type: 'text',
          pageNum,
          x: pos.x,
          y: pos.y,
          width: 200,
          height: 80,
          text: '',
        })
      }
    } else {
      // ドラッグ: 選択範囲に注釈を配置
      onAddAnnotation({
        type: activeTool,
        pageNum,
        ...currentRect,
        text: activeTool === 'text' ? '' : undefined,
      })
    }
    setCurrentRect(null)
  }, [isDragging, currentRect, activeTool, pageNum, getRelativePos, onAddAnnotation])

  const pageAnnotations = annotations.filter((a) => a.pageNum === pageNum)

  return (
    <div
      ref={layerRef}
      className={`annotation-layer ${activeTool && activeTool !== 'select' ? 'editing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 既存の注釈 */}
      {pageAnnotations.map((ann) => (
        <AnnotationItem
          key={ann.id}
          annotation={ann}
          scale={scale}
          onDelete={() => onDeleteAnnotation(ann.id)}
        />
      ))}

      {/* ドラッグ中のプレビュー */}
      {isDragging && currentRect && currentRect.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: currentRect.x * scale,
            top: currentRect.y * scale,
            width: currentRect.width * scale,
            height: currentRect.height * scale,
            background:
              activeTool === 'highlight'
                ? 'rgba(255, 255, 0, 0.3)'
                : 'rgba(59, 130, 246, 0.1)',
            border:
              activeTool === 'highlight'
                ? '2px dashed #ca8a04'
                : '2px dashed #3b82f6',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

function AnnotationItem({ annotation, scale, onDelete }) {
  const [isHovered, setIsHovered] = useState(false)
  const [text, setText] = useState(annotation.text || '')

  const style = {
    position: 'absolute',
    left: annotation.x * scale,
    top: annotation.y * scale,
    width: annotation.width * scale,
    height: annotation.height * scale,
  }

  if (annotation.type === 'highlight') {
    return (
      <div
        className="highlight-annotation"
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <button
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center z-10"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            ×
          </button>
        )}
      </div>
    )
  }

  // テキスト注釈
  return (
    <div
      className="text-annotation"
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <button
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center z-10"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          ×
        </button>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="テキストを入力..."
        onClick={(e) => e.stopPropagation()}
        style={{ fontSize: `${14 * scale}px` }}
      />
    </div>
  )
}
