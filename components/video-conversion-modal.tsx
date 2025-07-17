"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Download, FileVideo, Loader2, ExternalLink, Info } from "lucide-react"

interface VideoConversionModalProps {
  isOpen: boolean
  onClose: () => void
  onConversionComplete: (convertedFile: File) => void
  aviFile: File | null
}

export default function VideoConversionModal({
  isOpen,
  onClose,
  onConversionComplete,
  aviFile,
}: VideoConversionModalProps) {
  const [ffmpeg, setFFmpeg] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Ready to convert")
  const [error, setError] = useState<string | null>(null)
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load FFmpeg when modal opens
  useEffect(() => {
    if (isOpen && !ffmpeg && !showFallback) {
      loadFFmpeg()
    }
  }, [isOpen, ffmpeg, showFallback])

  const loadFFmpeg = async () => {
    try {
      setIsLoading(true)
      setStatus("Loading FFmpeg...")
      setError(null)

      // Try multiple CDN sources for better compatibility
      const cdnSources = [
        {
          name: "jsDelivr",
          baseURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
        },
        {
          name: "unpkg",
          baseURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
        },
      ]

      let ffmpegInstance = null
      let lastError = null

      for (const source of cdnSources) {
        try {
          setStatus(`Loading FFmpeg from ${source.name}...`)

          // Dynamic import to avoid SSR issues
          const { FFmpeg } = await import("@ffmpeg/ffmpeg")
          const { toBlobURL } = await import("@ffmpeg/util")

          ffmpegInstance = new FFmpeg()

          // Set up progress handler
          ffmpegInstance.on("progress", ({ progress }) => {
            if (progress > 0 && progress <= 1) {
              setProgress(Math.round(progress * 100))
            }
          })

          // Try to load from current CDN source
          await ffmpegInstance.load({
            coreURL: await toBlobURL(`${source.baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${source.baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          })

          // If we get here, loading was successful
          break
        } catch (err) {
          console.warn(`Failed to load FFmpeg from ${source.name}:`, err)
          lastError = err
          ffmpegInstance = null
        }
      }

      if (!ffmpegInstance) {
        throw lastError || new Error("All CDN sources failed")
      }

      setFFmpeg(ffmpegInstance)
      setIsFFmpegLoaded(true)
      setStatus("FFmpeg loaded successfully!")
    } catch (err) {
      console.error("Failed to load FFmpeg:", err)

      // Check if this is a CORS or environment-specific error
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin") || errorMessage.includes("Worker")) {
        setShowFallback(true)
        setError("Video conversion is not available in this environment due to security restrictions.")
      } else {
        setError("Failed to load video converter. Please try refreshing the page.")
      }
      setStatus("Error loading FFmpeg")
    } finally {
      setIsLoading(false)
    }
  }

  const convertAviToMp4 = async () => {
    if (!ffmpeg || !aviFile) return

    try {
      setIsConverting(true)
      setProgress(0)
      setStatus("Preparing conversion...")
      setError(null)

      // Import fetchFile dynamically
      const { fetchFile } = await import("@ffmpeg/util")

      // Write input file
      setStatus("Reading input file...")
      await ffmpeg.writeFile("input.avi", await fetchFile(aviFile))

      setStatus("Converting AVI to MP4...")

      // Start progress simulation
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 2
          return prev
        })
      }, 200)

      // Convert with optimized settings for web playback
      await ffmpeg.exec([
        "-i",
        "input.avi",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "output.mp4",
      ])

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setProgress(100)
      setStatus("Reading converted file...")

      // Read the converted file
      const data = await ffmpeg.readFile("output.mp4")
      const blob = new Blob([data], { type: "video/mp4" })
      setConvertedBlob(blob)

      setStatus("Conversion complete!")

      // Clean up FFmpeg filesystem
      try {
        await ffmpeg.deleteFile("input.avi")
        await ffmpeg.deleteFile("output.mp4")
      } catch (cleanupError) {
        console.warn("Cleanup warning:", cleanupError)
      }
    } catch (err) {
      console.error("Conversion failed:", err)
      setError("Conversion failed. Please try again or use a different file.")
      setStatus("Conversion failed")

      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    } finally {
      setIsConverting(false)
    }
  }

  const handleUseConverted = () => {
    if (convertedBlob && aviFile) {
      const convertedFile = new File([convertedBlob], aviFile.name.replace(/\.avi$/i, ".mp4"), {
        type: "video/mp4",
      })
      onConversionComplete(convertedFile)
      onClose()
    }
  }

  const handleDownload = () => {
    if (convertedBlob && aviFile) {
      const url = URL.createObjectURL(convertedBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = aviFile.name.replace(/\.avi$/i, ".mp4")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    onClose()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5 text-blue-600" />
            Convert AVI to MP4
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Info */}
          {aviFile && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileVideo className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{aviFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(aviFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isLoading || isConverting ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : error ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : convertedBlob ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : showFallback ? (
                <Info className="h-5 w-5 text-amber-600" />
              ) : (
                <FileVideo className="h-5 w-5 text-gray-600" />
              )}
              <span
                className={`font-medium ${
                  error
                    ? "text-red-600"
                    : convertedBlob
                      ? "text-green-600"
                      : isLoading || isConverting
                        ? "text-blue-600"
                        : showFallback
                          ? "text-amber-600"
                          : "text-gray-600"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Progress Bar */}
            {(isLoading || isConverting) && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">{progress}%</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Fallback Instructions */}
          {showFallback && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 text-sm">
                    Browser Conversion Not Available
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                    Due to security restrictions in this environment, we can't convert AVI files directly in the
                    browser. Please convert your AVI file to MP4 using one of these methods:
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 mb-4">
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("https://www.videolan.org/vlc/", "_blank")}
                      className="text-xs h-7 px-2 bg-transparent"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get VLC
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("https://handbrake.fr/", "_blank")}
                      className="text-xs h-7 px-2 bg-transparent"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get HandBrake
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box - only show if not in fallback mode */}
          {!showFallback && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">About AVI Conversion</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Converts AVI files to web-compatible MP4 format</li>
                <li>• Uses H.264 video codec for best browser support</li>
                <li>• Processing happens entirely in your browser</li>
                <li>• Large files may take several minutes to convert</li>
                <li>• Converted file can be downloaded for future use</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {showFallback ? (
              <Button onClick={handleClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Got it, I'll convert externally
              </Button>
            ) : !convertedBlob ? (
              <>
                <Button
                  onClick={convertAviToMp4}
                  disabled={!isFFmpegLoaded || isLoading || isConverting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to MP4"
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose} className="bg-transparent">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleUseConverted} className="flex-1 bg-green-600 hover:bg-green-700">
                  Use Converted Video
                </Button>
                <Button variant="outline" onClick={handleDownload} className="bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>

          {/* Performance Warning */}
          {aviFile && aviFile.size > 100 * 1024 * 1024 && !showFallback && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Large File Warning:</strong> Files over 100MB may take a long time to convert and could cause
                browser performance issues. Consider using a desktop converter for very large files.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
