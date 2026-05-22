import React, { useEffect } from 'react'

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="flex items-center gap-2">
        <span className="font-bold">{ICONS[toast.type]}</span>
        <span>{toast.message}</span>
        <button
          className="ml-auto opacity-70 hover:opacity-100"
          onClick={() => onRemove(toast.id)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
