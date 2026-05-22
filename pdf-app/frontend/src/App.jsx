import React, { useState, useEffect, useCallback, useRef } from 'react'
import UploadZone from './components/UploadZone'
import PDFViewer from './components/PDFViewer'
import Toolbar from './components/Toolbar'
import ThumbnailPanel from './components/ThumbnailPanel'
import MergeModal from './components/MergeModal'
import SplitModal from './components/SplitModal'
import ExtractResultModal from './components/ExtractResultModal'
import { ToastContainer } from './components/Toast'
import {
  uploadPdf,
  getPdfInfo,
  getPageImageUrl,
  rotatePage,
  deletePage,
  extractText,
  downloadPdf,
  mergePdfs,
} from './api/pdfApi'

let toastCounter = 0

export default function App() {
  // ---- 状態 ----
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [pdfState, setPdfState] = useState(null) // { fileId, filename, totalPages, fileUrl }
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [activeTool, setActiveTool] = useState(null) // 'text' | 'highlight' | null
  const [annotations, setAnnotations] = useState([])
  const [toasts, setToasts] = useState([])
  const [showMerge, setShowMerge] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [extractResult, setExtractResult] = useState(null)
  const fileInputRef = useRef(null)

  // ダークモード
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // キーボードショートカット
  useEffect(() => {
    const handleKey = (e) => {
      if (!pdfState) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNextPage()
          break
        case '+':
        case '=':
          e.preventDefault()
          setScale((s) => Math.min(s * 1.25, 4.0))
          break
        case '-':
          e.preventDefault()
          setScale((s) => Math.max(s / 1.25, 0.25))
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleDownload()
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [pdfState, currentPage])

  // ---- トースト ----
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---- ファイル操作 ----
  const handleUpload = async (file) => {
    try {
      addToast('アップロード中...', 'info', 1500)
      const result = await uploadPdf(file)
      const fileUrl = URL.createObjectURL(file)
      setPdfState({
        fileId: result.file_id,
        filename: file.name,
        totalPages: result.page_count,
        fileUrl,
        file,
      })
      setCurrentPage(1)
      setAnnotations([])
      setActiveTool(null)
      addToast(`「${file.name}」を開きました（${result.page_count}ページ）`, 'success')
    } catch (err) {
      addToast(`アップロードに失敗しました: ${err.message}`, 'error')
    }
  }

  const handleMergeUpload = async (files) => {
    try {
      addToast('PDF結合中...', 'info', 2000)
      const result = await mergePdfs(files)
      // 結合結果を仮ファイルとして開く
      const res = await fetch(`/api/pdf/${result.file_id}/download`)
      const blob = await res.blob()
      const mergedFile = new File([blob], 'merged.pdf', { type: 'application/pdf' })
      const fileUrl = URL.createObjectURL(mergedFile)
      setPdfState({
        fileId: result.file_id,
        filename: 'merged.pdf',
        totalPages: result.page_count,
        fileUrl,
        file: mergedFile,
      })
      setCurrentPage(1)
      setAnnotations([])
      addToast(`${files.length}個のPDFを結合しました（${result.page_count}ページ）`, 'success')
    } catch (err) {
      addToast(`結合に失敗しました: ${err.message}`, 'error')
    }
  }

  const handleOpenFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 1) {
      handleUpload(files[0])
    } else if (files.length > 1) {
      handleMergeUpload(files)
    }
    e.target.value = ''
  }

  // ---- ページ操作 ----
  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    if (!pdfState) return
    setCurrentPage((p) => Math.min(p + 1, pdfState.totalPages))
  }, [pdfState])

  const handlePageChange = (page) => {
    if (!pdfState) return
    const p = Math.max(1, Math.min(page, pdfState.totalPages))
    setCurrentPage(p)
  }

  // ---- PDF操作 ----
  const handleRotate = async (degrees) => {
    if (!pdfState) return
    try {
      await rotatePage(pdfState.fileId, currentPage, degrees)
      // PDFを再読み込み
      const res = await fetch(`/api/pdf/${pdfState.fileId}/download`)
      const blob = await res.blob()
      const file = new File([blob], pdfState.filename, { type: 'application/pdf' })
      const fileUrl = URL.createObjectURL(file)
      setPdfState((prev) => ({ ...prev, fileUrl, file }))
      addToast(`ページ${currentPage}を${degrees > 0 ? '右' : '左'}に回転しました`, 'success')
    } catch (err) {
      addToast(`回転に失敗しました: ${err.message}`, 'error')
    }
  }

  const handleDeletePage = async () => {
    if (!pdfState || pdfState.totalPages <= 1) return
    if (!confirm(`ページ${currentPage}を削除しますか？この操作は取り消せません。`)) return
    try {
      const result = await deletePage(pdfState.fileId, currentPage)
      const res = await fetch(`/api/pdf/${pdfState.fileId}/download`)
      const blob = await res.blob()
      const file = new File([blob], pdfState.filename, { type: 'application/pdf' })
      const fileUrl = URL.createObjectURL(file)
      setPdfState((prev) => ({
        ...prev,
        totalPages: result.new_page_count,
        fileUrl,
        file,
      }))
      // ページ番号を調整
      if (currentPage > result.new_page_count) {
        setCurrentPage(result.new_page_count)
      }
      // 削除されたページの注釈を除去
      setAnnotations((prev) => prev.filter((a) => a.pageNum !== currentPage))
      addToast(`ページ${currentPage}を削除しました`, 'success')
    } catch (err) {
      addToast(`削除に失敗しました: ${err.message}`, 'error')
    }
  }

  const handleExtractText = async (pages) => {
    if (!pdfState) return
    try {
      addToast('テキストを抽出中...', 'info', 2000)
      const result = await extractText(pdfState.fileId, pages)
      setExtractResult(result)
    } catch (err) {
      addToast(`テキスト抽出に失敗しました: ${err.message}`, 'error')
    }
  }

  const handleDownload = async () => {
    if (!pdfState) return
    try {
      await downloadPdf(pdfState.fileId, pdfState.filename)
      addToast('ダウンロードを開始しました', 'success')
    } catch (err) {
      addToast(`ダウンロードに失敗しました: ${err.message}`, 'error')
    }
  }

  // ---- 注釈 ----
  const handleAddAnnotation = useCallback((ann) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setAnnotations((prev) => [...prev, { ...ann, id }])
  }, [])

  const handleDeleteAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // ---- マージモーダルから結果を開く ----
  const handleMergeResult = async (result) => {
    try {
      const res = await fetch(`/api/pdf/${result.file_id}/download`)
      const blob = await res.blob()
      const file = new File([blob], 'merged.pdf', { type: 'application/pdf' })
      const fileUrl = URL.createObjectURL(file)
      setPdfState({
        fileId: result.file_id,
        filename: 'merged.pdf',
        totalPages: result.page_count,
        fileUrl,
        file,
      })
      setCurrentPage(1)
      setAnnotations([])
      setShowMerge(false)
      addToast(`PDFを結合しました（${result.page_count}ページ）`, 'success')
    } catch (err) {
      addToast('結合結果の読み込みに失敗しました', 'error')
    }
  }

  // ---- PDFViewer コールバック ----
  const handlePdfLoaded = useCallback((numPages) => {
    // PDF.jsで読み込んだページ数でpdfStateを更新（念のため）
    setPdfState((prev) => prev ? { ...prev, totalPages: numPages } : prev)
  }, [])

  // ---- レンダリング ----
  if (!pdfState) {
    return (
      <>
        <UploadZone onUpload={handleUpload} onMerge={handleMergeUpload} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? 'dark' : ''}`}>
      {/* ツールバー */}
      <Toolbar
        fileId={pdfState.fileId}
        pdfInfo={pdfState}
        currentPage={currentPage}
        totalPages={pdfState.totalPages}
        scale={scale}
        activeTool={activeTool}
        isDark={isDark}
        onPageChange={handlePageChange}
        onScaleChange={setScale}
        onRotate={handleRotate}
        onDeletePage={handleDeletePage}
        onExtractText={handleExtractText}
        onDownload={handleDownload}
        onOpenMerge={() => setShowMerge(true)}
        onOpenSplit={() => setShowSplit(true)}
        onToolChange={setActiveTool}
        onToggleDark={() => setIsDark((d) => !d)}
        onOpenFile={handleOpenFile}
      />

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サムネイルパネル */}
        <ThumbnailPanel
          fileId={pdfState.fileId}
          pageCount={pdfState.totalPages}
          currentPage={currentPage}
          onPageSelect={handlePageChange}
        />

        {/* PDFビューア */}
        <PDFViewer
          fileUrl={pdfState.fileUrl}
          currentPage={currentPage}
          scale={scale}
          activeTool={activeTool}
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onPdfLoaded={handlePdfLoaded}
        />
      </div>

      {/* 非表示ファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* モーダル */}
      {showMerge && (
        <MergeModal
          onClose={() => setShowMerge(false)}
          onMerged={handleMergeResult}
        />
      )}

      {showSplit && (
        <SplitModal
          fileId={pdfState.fileId}
          totalPages={pdfState.totalPages}
          onClose={() => setShowSplit(false)}
          onToast={addToast}
        />
      )}

      {extractResult && (
        <ExtractResultModal
          result={extractResult}
          onClose={() => setExtractResult(null)}
        />
      )}

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
