import React, { useState } from 'react'
import { splitPdf, downloadPdf } from '../api/pdfApi'

export default function SplitModal({ fileId, totalPages, onClose, onToast }) {
  const [ranges, setRanges] = useState([{ start: 1, end: totalPages }])
  const [isLoading, setIsLoading] = useState(false)
  const [splitResult, setSplitResult] = useState(null)

  const addRange = () => {
    setRanges((prev) => [...prev, { start: 1, end: totalPages }])
  }

  const removeRange = (index) => {
    setRanges((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRange = (index, key, value) => {
    setRanges((prev) => {
      const newRanges = [...prev]
      newRanges[index] = { ...newRanges[index], [key]: Number(value) }
      return newRanges
    })
  }

  const handleSplit = async () => {
    setIsLoading(true)
    try {
      const result = await splitPdf(fileId, ranges)
      setSplitResult(result)
      onToast('分割が完了しました', 'success')
    } catch (err) {
      onToast(`分割に失敗しました: ${err.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadSplit = async (splitFileId, index) => {
    try {
      await downloadPdf(splitFileId, `split_${index + 1}.pdf`)
    } catch (err) {
      onToast('ダウンロードに失敗しました', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">PDF分割</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          合計 {totalPages} ページ · 分割するページ範囲を指定してください
        </p>

        {!splitResult ? (
          <>
            {/* 範囲リスト */}
            <div className="space-y-3 mb-4">
              {ranges.map((range, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 w-14">範囲 {i + 1}</span>
                  <input
                    type="number"
                    value={range.start}
                    onChange={(e) => updateRange(i, 'start', e.target.value)}
                    min={1}
                    max={totalPages}
                    className="input w-16 text-center"
                  />
                  <span className="text-gray-400">〜</span>
                  <input
                    type="number"
                    value={range.end}
                    onChange={(e) => updateRange(i, 'end', e.target.value)}
                    min={1}
                    max={totalPages}
                    className="input w-16 text-center"
                  />
                  <span className="text-xs text-gray-400">ページ</span>
                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(i)}
                      className="text-red-400 hover:text-red-600 ml-auto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addRange}
              className="btn-secondary w-full mb-4 text-sm"
            >
              ＋ 範囲を追加
            </button>

            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-secondary">キャンセル</button>
              <button
                onClick={handleSplit}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? '分割中...' : '分割する'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 分割結果 */}
            <div className="space-y-2 mb-4">
              {splitResult.files.map((file, i) => (
                <div key={file.file_id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                    分割 {i + 1} ({file.range}, {file.page_count}ページ)
                  </span>
                  <button
                    onClick={() => handleDownloadSplit(file.file_id, i)}
                    className="btn-primary text-xs px-2 py-1"
                  >
                    💾 DL
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-secondary">閉じる</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
