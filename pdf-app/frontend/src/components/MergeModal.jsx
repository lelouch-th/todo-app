import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { mergePdfs } from '../api/pdfApi'

export default function MergeModal({ onClose, onMerged }) {
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 100 * 1024 * 1024,
  })

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moveUp = (index) => {
    if (index === 0) return
    setFiles((prev) => {
      const newFiles = [...prev]
      ;[newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]]
      return newFiles
    })
  }

  const moveDown = (index) => {
    if (index === files.length - 1) return
    setFiles((prev) => {
      const newFiles = [...prev]
      ;[newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]]
      return newFiles
    })
  }

  const handleMerge = async () => {
    if (files.length < 2) return
    setIsLoading(true)
    try {
      const result = await mergePdfs(files)
      onMerged(result)
    } catch (err) {
      alert(`結合に失敗しました: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">PDF結合</h2>

        {/* ドロップゾーン */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
          `}
        >
          <input {...getInputProps()} />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            PDFをドロップまたはクリックして追加
          </p>
        </div>

        {/* ファイルリスト */}
        {files.length > 0 && (
          <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
              >
                <span className="text-gray-500 dark:text-gray-400 text-xs w-5">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button onClick={() => moveUp(i)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs px-1" disabled={i === 0}>▲</button>
                <button onClick={() => moveDown(i)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs px-1" disabled={i === files.length - 1}>▼</button>
                <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {files.length}個のファイル（2個以上必要）
        </p>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button
            onClick={handleMerge}
            className="btn-primary"
            disabled={files.length < 2 || isLoading}
          >
            {isLoading ? '結合中...' : '結合する'}
          </button>
        </div>
      </div>
    </div>
  )
}
