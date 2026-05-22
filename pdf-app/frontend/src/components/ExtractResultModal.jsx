import React, { useState } from 'react'

export default function ExtractResultModal({ result, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.full_text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([result.full_text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'extracted_text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            テキスト抽出結果
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {result.extracted_pages.length}ページ抽出
          </span>
        </div>

        <textarea
          value={result.full_text}
          readOnly
          className="flex-1 input font-mono text-xs leading-relaxed resize-none mb-4"
          style={{ minHeight: '300px' }}
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">閉じる</button>
          <button onClick={handleDownload} className="btn-secondary">
            📥 TXTダウンロード
          </button>
          <button onClick={handleCopy} className="btn-primary">
            {copied ? '✓ コピー済み' : '📋 コピー'}
          </button>
        </div>
      </div>
    </div>
  )
}
