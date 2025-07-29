"use client"

import React, { useState, useImperativeHandle, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UploadCloud, RotateCcw, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import VideoOverlay from "./video-overlay"

interface Intersection {
  id: string
  x: number
  y: number
  label: string
}

interface VideoPlayerProps {
  videoSrc: string | null
  onVideoSelect: (src: string | null) => void
  onPlay: () => void
  onPause: () => void
  lastPressed: { key: string; direction: string } | null
  onIntersectionsSet: (intersections: Intersection[]) => void
  onTimeUpdate: () => void
  onLoadedMetadata: () => void
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
    (
        { videoSrc, onVideoSelect, onPlay, onPause, lastPressed, onIntersectionsSet, onTimeUpdate, onLoadedMetadata },
        ref,
    ) => {
      const [isDragging, setIsDragging] = useState(false)
      const [dragCounter, setDragCounter] = useState(0)
      const [showRestoreNotification, setShowRestoreNotification] = useState(false)
      const internalRef = React.useRef<HTMLVideoElement>(null)
      const [videoError, setVideoError] = useState<string | null>(null)
      const [showFormatInfo, setShowFormatInfo] = useState(false)

      useImperativeHandle(ref, () => internalRef.current as HTMLVideoElement)

      React.useEffect(() => {
        if (videoSrc) {
          try {
            const savedData = localStorage.getItem("pedestrian-counter-data")
            if (savedData) {
              const parsedData = JSON.parse(savedData)
              if (
                  parsedData.videoSrc === videoSrc &&
                  (parsedData.log?.length > 0 || parsedData.intersections?.length > 0)
              ) {
                setShowRestoreNotification(true)
                setTimeout(() => setShowRestoreNotification(false), 10000)
              }
            }
          } catch (error) {
            console.error("Error checking saved data:", error)
          }
        }
      }, [videoSrc])

      const isAviFile = useCallback((file: File): boolean => {
        return file.type === "video/x-msvideo" || file.name.toLowerCase().endsWith(".avi")
      }, [])

      const validateVideoFormat = useCallback((file: File): boolean => {
        const supportedTypes = ["video/mp4", "video/webm", "video/ogg"]

        // Check MIME type first
        if (supportedTypes.includes(file.type)) {
          return true
        }

        // Check file extension as fallback
        const extension = file.name.toLowerCase().split(".").pop()
        const supportedExtensions = ["mp4", "webm", "ogg"]

        return supportedExtensions.includes(extension || "")
      }, [])

      const handleFileSelect = useCallback(
          (file: File | null) => {
            setVideoError(null)
            setShowFormatInfo(false)

            if (file && file.type.startsWith("video/")) {
              // Check if it's an AVI file
              if (isAviFile(file)) {
                setVideoError(
                    "AVI files are not supported in this environment. Please convert your AVI file to MP4 using a tool like VLC Media Player, HandBrake, or an online converter, then upload the MP4 file.",
                )
                setShowFormatInfo(true)
                return
              }

              // Validate format for other video types
              if (!validateVideoFormat(file)) {
                setVideoError(
                    `Unsupported video format: ${file.name}. Please use MP4, WebM, or OGG format. For best compatibility, we recommend MP4.`,
                )
                setShowFormatInfo(true)
                return
              }

              const url = URL.createObjectURL(file)

              // Clear any existing saved data before setting new video
              try {
                localStorage.removeItem("pedestrian-counter-data")
              } catch (error) {
                console.error("Error clearing saved data:", error)
              }

              onVideoSelect(url)
              setTimeout(() => {
                const labelButton = document.querySelector("[data-label-intersections]") as HTMLButtonElement
                labelButton?.click()
              }, 100)
            }
          },
          [onVideoSelect, validateVideoFormat, isAviFile],
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
            // Reset the input value so the same file can be selected again
            e.target.value = ""
          },
          [handleFileSelect],
      )

      const clearSavedData = useCallback(() => {
        try {
          localStorage.removeItem("pedestrian-counter-data")
          setShowRestoreNotification(false)
          window.location.reload()
        } catch (error) {
          console.error("Error clearing saved data:", error)
        }
      }, [])

      const handleVideoError = useCallback(() => {
        setVideoError("Unable to load video. Please try a different file or check that the video file is not corrupted.")
        onVideoSelect(null)
      }, [onVideoSelect])

      const handleTryAgain = useCallback(() => {
        setVideoError(null)
        setShowFormatInfo(false)
        document.getElementById("video-upload-hidden")?.click()
      }, [])

      return (
          <>
            <Card className="h-full w-full flex flex-col shadow-lg rounded-b-none rounded-t-lg relative">
              {showRestoreNotification && (
                  <div className="absolute top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-top duration-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Previous Session Restored</h4>
                        <p className="text-xs text-blue-700 mb-3">
                          Your counting data and intersections have been automatically restored from your last session.
                        </p>
                        <div className="flex gap-2">
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowRestoreNotification(false)}
                              className="text-xs h-7 px-2"
                          >
                            Got it
                          </Button>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={clearSavedData}
                              className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                          >
                            Start Fresh
                          </Button>
                        </div>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowRestoreNotification(false)}
                          className="h-6 w-6 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
              )}

              <CardContent className="p-4 flex-grow flex flex-col min-h-0">
                <div
                    className={`relative flex-grow rounded-lg flex items-center justify-center border-2 border-dashed transition-all duration-300 overflow-hidden ${
                        !videoSrc ? "cursor-pointer" : ""
                    } ${
                        isDragging
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : "bg-slate-200 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700" +
                            (!videoSrc ? " hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]" : "")
                    }`}
                    {...(!videoSrc && {
                      onDragEnter: handleDragEnter,
                      onDragLeave: handleDragLeave,
                      onDragOver: handleDragOver,
                      onDrop: handleDrop,
                      onClick: () => document.getElementById("video-upload-hidden")?.click(),
                    })}
                >
                  {videoError ? (
                      <div className="text-center p-8 select-none flex flex-col items-center justify-center w-full h-full max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-lg font-semibold mb-3 leading-tight text-red-700 dark:text-red-300">
                          Video Format Issue
                        </p>
                        <p className="text-sm mb-6 leading-relaxed max-w-md text-red-600 dark:text-red-400">{videoError}</p>

                        {showFormatInfo && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg max-w-md">
                              <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                    How to Convert AVI to MP4:
                                  </h4>
                                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>
                                      • <strong>VLC Media Player:</strong> Media → Convert/Save → Add file → Convert
                                    </li>
                                    <li>
                                      • <strong>HandBrake:</strong> Free, open-source video converter
                                    </li>
                                    <li>
                                      • <strong>Online:</strong> CloudConvert, Online-Convert, or similar
                                    </li>
                                    <li>
                                      • <strong>Windows:</strong> Use built-in Photos app or Movies & TV
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                          <Button onClick={handleTryAgain} className="bg-blue-600 hover:bg-blue-700">
                            Choose Different File
                          </Button>
                          <Button
                              variant="outline"
                              onClick={() => {
                                setVideoError(null)
                                setShowFormatInfo(false)
                              }}
                              className="bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-tight">
                          Supported formats: <strong>MP4</strong> (recommended), WebM, OGG
                        </p>
                      </div>
                  ) : videoSrc ? (
                      <div className="relative w-full h-full">
                        <video
                            ref={internalRef}
                            src={videoSrc}
                            className="w-full h-full object-contain rounded-md"
                            onPlay={onPlay}
                            onPause={onPause}
                            onError={handleVideoError}
                            controls={false}
                            preload="metadata"
                            onTimeUpdate={onTimeUpdate}
                            onLoadedMetadata={onLoadedMetadata}
                        />
                        <VideoOverlay
                            videoRef={internalRef}
                            isVideoLoaded={!!videoSrc}
                            lastPressed={lastPressed}
                            onIntersectionsSet={onIntersectionsSet}
                        />
                      </div>
                  ) : (
                      <div
                          className="text-center text-muted-foreground p-8 select-none flex flex-col items-center justify-center w-full h-full">
                        <UploadCloud
                            className="h-16 w-16 text-slate-400 mb-4 transition-transform duration-300 hover:scale-110"/>
                        <p className="text-lg font-semibold mb-2 leading-tight">Drag & drop video here</p>
                        <p className="text-sm mb-4 leading-tight">or click anywhere to select a file</p>

                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-6 py-5 mb-6 max-w-md relative">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium">
                            <strong>Supported formats:</strong>
                          </p>
                          <div className="flex flex-wrap gap-3 justify-center">
   <span
      className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2.5 rounded text-base font-semibold">
      MP4
    </span>
    <span
      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded text-base font-semibold">
      WebM
    </span>
    <span
      className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2.5 rounded text-base font-semibold">
      OGG
    </span>
                          </div>

                          <div
                              className="bg-slate-100 dark:bg-slate-700 rounded-lg px-6 py-5 mt-5 max-w-md relative"
                              onClick={(e) => e.stopPropagation()}
                              onDragEnter={(e) => e.stopPropagation()}
                              onDragOver={(e) => e.stopPropagation()}
                              onDrop={(e) => e.stopPropagation()}
                          >

                            <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(
                                      "https://avi-converter-dot.streamlit.app/",
                                      "aviConverter",
                                      "width=800,height=600"
                                  )
                                }}
                                className="mt-4 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all font-semibold"
                            >
                              Convert AVI files
                            </button>
                          </div>
                        </div>
                      </div>
                  )}
                  <Input
                      id="video-upload-hidden"
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
              </CardContent>
            </Card>
          </>
      )
    },
)

VideoPlayer.displayName = "VideoPlayer"
export default VideoPlayer
