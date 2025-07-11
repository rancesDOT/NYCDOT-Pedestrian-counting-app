"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Clock, Users, MapPin, X, FileVideo, Keyboard } from "lucide-react"

interface VideoRestorePromptProps {
  isOpen: boolean
  onVideoRestore: (file: File) => void
  onDismiss: () => void
  savedData: {
    currentTime: number
    duration: number
    totalCounts: number
    intersectionCount: number
    lastSaved: number
  }
}

export default function VideoRestorePrompt({ isOpen, onVideoRestore, onDismiss, savedData }: VideoRestorePromptProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadButtonRef = useRef<HTMLButtonElement>(null)
  const dismissButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00"
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const formatLastSaved = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (file && file.type.startsWith("video/")) {
        onVideoRestore(file)
      }
    },
    [onVideoRestore],
  )

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => {
      const newCounter = prev - 1
      if (newCounter === 0) setIsDragging(false)
      return newCounter
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setDragCounter(0)

      const files = e.dataTransfer.files
      if (files.length > 0) handleFileSelect(files[0])
    },
    [handleFileSelect],
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onDismiss()
        return
      }

      if ((e.key === "Enter" || e.key === " ") && e.target === modalRef.current) {
        e.preventDefault()
        handleUploadClick()
        return
      }

      if (e.key === "u" || e.key === "U") {
        e.preventDefault()
        handleUploadClick()
        return
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        onDismiss()
        return
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    setTimeout(() => {
      uploadButtonRef.current?.focus()
    }, 100)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onDismiss, handleUploadClick])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onDismiss}
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
        aria-describedby="restore-description"
      >
        <Card
          ref={modalRef}
          className="w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300 shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          tabIndex={-1}
        >
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 border-b border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileVideo className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 id="restore-title" className="text-xl font-bold text-gray-900 dark:text-white">
                      Resume Session
                    </h1>
                    <p id="restore-description" className="text-sm text-gray-600 dark:text-gray-300">
                      Continue from {formatTime(savedData.currentTime)} with {savedData.totalCounts} counts
                    </p>
                  </div>
                </div>
                <Button
                  ref={dismissButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  className="h-10 w-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                  aria-label="Close dialog and start new session"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(savedData.currentTime)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/ {formatTime(savedData.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{savedData.totalCounts} counts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {savedData.intersectionCount}/4 intersections
                    </span>
                  </div>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{formatLastSaved(savedData.lastSaved)}</span>
              </div>
            </div>

            <div className="p-8">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group ${
                  isDragging
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                } focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                role="button"
                tabIndex={0}
                aria-label="Upload video file area"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleUploadClick()
                  }
                }}
              >
                <div className="text-center">
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDragging
                        ? "bg-blue-100 dark:bg-blue-800 scale-110"
                        : "bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-800"
                    }`}
                  >
                    <Upload
                      className={`h-10 w-10 transition-all duration-300 ${
                        isDragging
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      }`}
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Upload Video to Continue</h2>

                  <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                    Drop your video file here or click to browse. We'll resume from{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatTime(savedData.currentTime)}
                    </span>{" "}
                    automatically.
                  </p>

                  <Button
                    ref={uploadButtonRef}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUploadClick()
                    }}
                  >
                    <Upload className="h-5 w-5 mr-3" />
                    Choose Video File
                  </Button>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Supports MP4, WebM, Ogg • Max 2GB</p>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleFileInputChange}
                  className="hidden"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Keyboard className="h-3 w-3" />
                    <span>Shortcuts:</span>
                  </div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">U</kbd>
                  <span>Upload</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">N</kbd>
                  <span>New session</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd>
                  <span>Close</span>
                </div>

                <Button
                  variant="outline"
                  onClick={onDismiss}
                  className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 bg-transparent"
                >
                  Start New Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
