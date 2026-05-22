import React, { useState } from 'react'
import { getThumbnailUrl } from '../api/pdfApi'

export default function ThumbnailPanel({
  fileId,
  pageCount,
  currentPage,
  onPageSelect,
}) {
  const [errors, setErrors] = useState({})

  const handleError = (pageNum) => {
    setErrors((prev) => ({ ...prev, [pageNum]: true }))
  }

  return (
    <div className="w-44 flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 text-center uppercase tracking-wide">
          ページ一覧
        </p>
        <div className="space-y-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={`
                w-full flex flex-col items-center p-2 rounded-lg transition-all
                ${currentPage === pageNum
                  ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {/* サムネイル画像 */}
              <div className="w-24 h-32 bg-white dark:bg-gray-700 rounded shadow-sm overflow-hidden flex items-center justify-center">
                {errors[pageNum] ? (
                  <div className="text-gray-400 dark:text-gray-500 text-xs text-center p-2">
                    <div className="text-2xl mb-1">📄</div>
                    <div>P.{pageNum}</div>
                  </div>
                ) : (
                  <img
                    src={getThumbnailUrl(fileId, pageNum)}
                    alt={`ページ ${pageNum}`}
                    className="w-full h-full object-contain"
                    onError={() => handleError(pageNum)}
                    loading="lazy"
                  />
                )}
              </div>
              {/* ページ番号 */}
              <span
                className={`
                  mt-1 text-xs font-medium
                  ${currentPage === pageNum
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {pageNum}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
