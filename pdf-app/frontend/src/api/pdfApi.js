/**
 * バックエンドAPIクライアント
 */
import axios from 'axios'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

// エラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'エラーが発生しました'
    return Promise.reject(new Error(message))
  }
)

/**
 * PDFをアップロード
 */
export async function uploadPdf(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * PDF情報を取得
 */
export async function getPdfInfo(fileId) {
  const res = await api.get(`/pdf/${fileId}/info`)
  return res.data
}

/**
 * ページ画像URLを取得（直接URL）
 */
export function getPageImageUrl(fileId, pageNum, scale = 1.5) {
  return `${BASE_URL}/pdf/${fileId}/page/${pageNum}?scale=${scale}`
}

/**
 * サムネイルURLを取得
 */
export function getThumbnailUrl(fileId, pageNum) {
  return `${BASE_URL}/pdf/${fileId}/thumbnail/${pageNum}`
}

/**
 * テキスト抽出
 */
export async function extractText(fileId, pages = null) {
  const body = pages ? { pages } : {}
  const res = await api.post(`/pdf/${fileId}/extract-text`, body)
  return res.data
}

/**
 * ページ回転
 */
export async function rotatePage(fileId, page, degrees) {
  const res = await api.post(`/pdf/${fileId}/rotate`, { page, degrees })
  return res.data
}

/**
 * ページ削除
 */
export async function deletePage(fileId, pageNumber) {
  const res = await api.post(`/pdf/${fileId}/delete-page`, { page_number: pageNumber })
  return res.data
}

/**
 * PDFを結合
 */
export async function mergePdfs(files) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const res = await api.post('/merge', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * PDFを分割
 */
export async function splitPdf(fileId, ranges) {
  const res = await api.post(`/pdf/${fileId}/split`, { ranges })
  return res.data
}

/**
 * PDFをダウンロード
 */
export async function downloadPdf(fileId, filename = 'edited.pdf') {
  const res = await api.get(`/pdf/${fileId}/download`, {
    params: { filename },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
