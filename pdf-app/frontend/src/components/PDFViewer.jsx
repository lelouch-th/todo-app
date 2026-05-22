import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import AnnotationLayer from './AnnotationLayer'

// PDF.jsのワーカー設定
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export default function PDFViewer({
  fileUrl,
  currentPage,
  scale,
  activeTool,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onPdfLoaded,
}) {
  const canvasRef = useRef(null)
  const pdfDocRef = useRef(null)
  const renderTaskRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // PDFドキュメントの読み込み
  useEffect(() => {
    if (!fileUrl) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const loadPdf = async () => {
      try {
        // 既存のPDFを破棄
        if (pdfDocRef.current) {
          pdfDocRef.current.destroy()
          pdfDocRef.current = null
        }

        const loadingTask = pdfjsLib.getDocument(fileUrl)
        const pdf = await loadingTask.promise

        if (cancelled) return

        pdfDocRef.current = pdf
        onPdfLoaded(pdf.numPages)
        setIsLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'PDFの読み込みに失敗しました')
          setIsLoading(false)
        }
      }
    }

    loadPdf()
    return () => {
      cancelled = true
    }
  }, [fileUrl])

  // ページレンダリング
  useEffect(() => {
    if (!pdfDocRef.current || isLoading) return

    let cancelled = false

    const renderPage = async () => {
      try {
        // 既存のレンダータスクをキャンセル
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        const page = await pdfDocRef.current.getPage(currentPage)
        if (cancelled) return

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        setCanvasSize({ width: viewport.width, height: viewport.height })

        const renderContext = {
          canvasContext: context,
          viewport,
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise

        page.cleanup()
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('ページレンダリングエラー:', err)
        }
      }
    }

    renderPage()
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfDocRef.current, currentPage, scale, isLoading])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-300 dark:bg-gray-700 flex justify-center items-start p-6">
      <div className="relative shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded z-10">
            <div className="spinner" />
          </div>
        )}
        <canvas ref={canvasRef} className="block rounded" />
        {!isLoading && (
          <AnnotationLayer
            pageNum={currentPage}
            scale={scale}
            annotations={annotations}
            activeTool={activeTool}
            onAddAnnotation={onAddAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
          />
        )}
      </div>
    </div>
  )
}
