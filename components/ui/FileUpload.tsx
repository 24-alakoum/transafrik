'use client'

import * as React from 'react'
import { UploadCloud, X, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants'

interface FileUploadProps {
  onUploadComplete: (url: string, size: number) => void
  onError?: (error: string) => void
  disabled?: boolean
  bucket?: string
}

export function FileUpload({ onUploadComplete, onError, disabled, bucket = 'receipts' }: FileUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const validateFile = (file: File) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      const err = "Format non supporté (PDF, JPEG, PNG ou WEBP uniquement)"
      onError?.(err); toast.error(err); return false
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const err = `La taille doit être inférieure à ${MAX_FILE_SIZE_MB}MB`
      onError?.(err); toast.error(err); return false
    }
    return true
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  const processFile = async (selectedFile: File) => {
    if (disabled || isUploading) return
    if (!validateFile(selectedFile)) return
    
    setFile(selectedFile)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('bucket', bucket)

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Erreur d'upload")

      onUploadComplete(data.url, selectedFile.size)
      toast.success('Fichier téléversé avec succès')
    } catch (err: any) {
      onError?.(err.message)
      toast.error(err.message)
      setFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    if (isUploading) return
    setFile(null)
    // L'URL parente devra être réinitialisée si nécessaire par le parent
  }

  return (
    <div className="w-full">
      {!file ? (
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors text-center cursor-pointer",
            dragActive ? "border-accent bg-accent/5" : "border-border-base bg-bg-surface hover:bg-bg-raised",
            disabled && "opacity-50 cursor-not-allowed hover:bg-bg-surface"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleChange}
            accept=".pdf,image/jpeg,image/png,image/webp"
            disabled={disabled || isUploading}
          />
          <UploadCloud className="w-8 h-8 text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">
            {isUploading ? 'Téléversement en cours...' : 'Cliquez ou glissez un fichier'}
          </p>
          <p className="text-xs text-text-secondary">
            PDF, PNG, JPG jusqu'à {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-base rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={removeFile}
            disabled={isUploading || disabled}
            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
