import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function UploadZone({ onUpload, onMerge }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      if (acceptedFiles.length === 1) {
        onUpload(acceptedFiles[0])
      } else {
        onMerge(acceptedFiles)
      }
    },
    [onUpload, onMerge]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PDF閲覧・編集アプリ
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            PDFを開いて閲覧・編集・操作ができます
          </p>
        </div>

        {/* ドロップゾーン */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="text-5xl mb-4">{isDragActive ? '📂' : '📁'}</div>
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400 text-lg font-medium">
              ここにドロップしてください
            </p>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-2">
                PDFファイルをドラッグ＆ドロップ
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                または
              </p>
              <button className="btn-primary px-6 py-2 text-base">
                ファイルを選択
              </button>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-4">
                PDF形式 · 最大100MB · 複数ファイルで結合
              </p>
            </>
          )}
        </div>

        {/* 機能一覧 */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
          {[
            { icon: '🔍', label: 'ズームイン/アウト' },
            { icon: '🔄', label: 'ページ回転' },
            { icon: '📝', label: 'テキスト抽出' },
            { icon: '🗑️', label: 'ページ削除' },
            { icon: '🔗', label: 'PDF結合' },
            { icon: '✂️', label: 'PDF分割' },
            { icon: '✏️', label: 'テキスト注釈' },
            { icon: '💾', label: 'ダウンロード' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm"
            >
              <span>{icon}</span>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
