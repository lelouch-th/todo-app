import React, { useState } from 'react'

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0]

export default function Toolbar({
  fileId,
  pdfInfo,
  currentPage,
  totalPages,
  scale,
  activeTool,
  isDark,
  onPageChange,
  onScaleChange,
  onRotate,
  onDeletePage,
  onExtractText,
  onDownload,
  onOpenMerge,
  onOpenSplit,
  onToolChange,
  onToggleDark,
  onOpenFile,
}) {
  const [pageInput, setPageInput] = useState('')
  const [showExtractModal, setShowExtractModal] = useState(false)

  const handlePageJump = (e) => {
    e.preventDefault()
    const n = parseInt(pageInput)
    if (n >= 1 && n <= totalPages) {
      onPageChange(n)
    }
    setPageInput('')
  }

  const zoomIn = () => {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= scale)
    const nextIdx = Math.min(idx + 1, ZOOM_LEVELS.length - 1)
    onScaleChange(ZOOM_LEVELS[nextIdx])
  }

  const zoomOut = () => {
    const idx = ZOOM_LEVELS.findLastIndex((z) => z <= scale)
    const prevIdx = Math.max(idx - 1, 0)
    onScaleChange(ZOOM_LEVELS[prevIdx])
  }

  const zoomPercent = Math.round(scale * 100)

  return (
    <>
      <div className="h-14 flex items-center gap-1 px-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0 overflow-x-auto">

        {/* ファイルを開く */}
        <button onClick={onOpenFile} className="btn-secondary flex items-center gap-1" title="ファイルを開く">
          <span>📂</span>
          <span className="hidden sm:inline text-xs">開く</span>
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* ページナビゲーション */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-secondary px-2"
          title="前のページ (←)"
        >
          ‹
        </button>

        <form onSubmit={handlePageJump} className="flex items-center gap-1">
          <input
            type="number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder={String(currentPage)}
            className="input w-14 text-center"
            min={1}
            max={totalPages}
          />
        </form>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-secondary px-2"
          title="次のページ (→)"
        >
          ›
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* ズーム */}
        <button onClick={zoomOut} className="btn-secondary px-2" title="縮小 (-)">
          −
        </button>
        <select
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="input w-20 text-center"
        >
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>
        <button onClick={zoomIn} className="btn-secondary px-2" title="拡大 (+)">
          ＋
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* 回転 */}
        <button
          onClick={() => onRotate(-90)}
          className="btn-secondary"
          title="左に90°回転"
        >
          ↺
        </button>
        <button
          onClick={() => onRotate(90)}
          className="btn-secondary"
          title="右に90°回転"
        >
          ↻
        </button>

        {/* ページ削除 */}
        <button
          onClick={onDeletePage}
          className="btn-danger"
          title="現在のページを削除"
          disabled={totalPages <= 1}
        >
          🗑️
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* 注釈ツール */}
        <button
          onClick={() => onToolChange(activeTool === 'text' ? null : 'text')}
          className={activeTool === 'text' ? 'btn-primary' : 'btn-secondary'}
          title="テキスト注釈"
        >
          ✏️
        </button>
        <button
          onClick={() => onToolChange(activeTool === 'highlight' ? null : 'highlight')}
          className={activeTool === 'highlight' ? 'btn-primary' : 'btn-secondary'}
          title="ハイライト"
        >
          🖊️
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* テキスト抽出 */}
        <button
          onClick={() => setShowExtractModal(true)}
          className="btn-secondary"
          title="テキスト抽出"
        >
          📋
        </button>

        {/* PDF結合 */}
        <button
          onClick={onOpenMerge}
          className="btn-secondary"
          title="PDF結合"
        >
          🔗
        </button>

        {/* PDF分割 */}
        <button
          onClick={onOpenSplit}
          className="btn-secondary"
          title="PDF分割"
        >
          ✂️
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* ダウンロード */}
        <button
          onClick={onDownload}
          className="btn-primary"
          title="ダウンロード (Ctrl+S)"
        >
          💾
        </button>

        {/* スペーサー */}
        <div className="flex-1" />

        {/* ダークモードトグル */}
        <button
          onClick={onToggleDark}
          className="btn-secondary"
          title="ダークモード切替"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* テキスト抽出モーダル */}
      {showExtractModal && (
        <ExtractModal
          currentPage={currentPage}
          totalPages={totalPages}
          onExtract={async (pages) => {
            await onExtractText(pages)
            setShowExtractModal(false)
          }}
          onClose={() => setShowExtractModal(false)}
        />
      )}
    </>
  )
}

function ExtractModal({ currentPage, totalPages, onExtract, onClose }) {
  const [mode, setMode] = useState('current') // 'current' | 'all' | 'range'
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(totalPages)

  const handleExtract = () => {
    if (mode === 'current') {
      onExtract([currentPage])
    } else if (mode === 'all') {
      onExtract(null) // null = 全ページ
    } else {
      const pages = []
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
      onExtract(pages)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">テキスト抽出</h2>

        <div className="space-y-3 mb-6">
          {[
            { value: 'current', label: `現在のページ（P.${currentPage}）` },
            { value: 'all', label: '全ページ' },
            { value: 'range', label: 'ページ範囲を指定' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-200">{label}</span>
            </label>
          ))}
        </div>

        {mode === 'range' && (
          <div className="flex items-center gap-3 mb-6">
            <input
              type="number"
              value={rangeStart}
              onChange={(e) => setRangeStart(Number(e.target.value))}
              min={1}
              max={totalPages}
              className="input w-20"
            />
            <span className="text-gray-500">〜</span>
            <input
              type="number"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(Number(e.target.value))}
              min={1}
              max={totalPages}
              className="input w-20"
            />
            <span className="text-gray-500 text-sm">/ {totalPages}ページ</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button onClick={handleExtract} className="btn-primary">抽出する</button>
        </div>
      </div>
    </div>
  )
}
