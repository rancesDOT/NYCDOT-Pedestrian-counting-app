"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Download, FileVideo, Loader2, Info } from "lucide-react"

interface VideoConversionModalProps {
  isOpen: boolean
  onClose: () => void
  onConversionComplete: (convertedFile: File) => void
  aviFile: File | null
}

// Define potential CDN base URLs for FFmpeg.wasm
const FFMPEG_BASE_URLS = [
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
]

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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load FFmpeg when modal opens
  useEffect(() => {
    if (isOpen && !ffmpeg && !isLoading && !isFFmpegLoaded) {
      loadFFmpeg()
    }
  }, [isOpen, ffmpeg, isLoading, isFFmpegLoaded])

  const loadFFmpeg = async () => {
    setIsLoading(true)
    setStatus("Loading video converter...")
    setError(null)

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg")
      const { toBlobURL } = await import("@ffmpeg/util")

      let loadedSuccessfully = false
      for (const baseURL of FFMPEG_BASE_URLS) {
        try {
          const ffmpegInstance = new FFmpeg()

          ffmpegInstance.on("progress", ({ progress }) => {
            if (progress > 0 && progress <= 1) {
              setProgress(Math.round(progress * 100))
            }
          })

          await ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          })

          setFFmpeg(ffmpegInstance)
          setIsFFmpegLoaded(true)
          setStatus("Video converter loaded successfully!")
          loadedSuccessfully = true
          break // Exit loop if loaded successfully
        } catch (cdnError) {
          console.warn(`Failed to load FFmpeg from ${baseURL}:`, cdnError)
          // Continue to next CDN
        }
      }

      if (!loadedSuccessfully) {
        throw new Error("All FFmpeg CDN sources failed to load.")
      }
    } catch (err: any) {
      console.error("Failed to load FFmpeg:", err)
      let errorMessage = "Failed to load video converter. Please try refreshing the page."
      if (err.message && (err.message.includes("Failed to construct 'Worker'") || err.message.includes("CORS"))) {
        errorMessage =
          "Failed to load video converter due to browser security restrictions (CORS). Please try converting your AVI file to MP4 using a desktop application like VLC or HandBrake, then upload the MP4 file."
      }
      setError(errorMessage)
      setStatus("Error loading converter")
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

      const { fetchFile } = await import("@ffmpeg/util")

      setStatus("Reading input file...")
      await ffmpeg.writeFile("input.avi", await fetchFile(aviFile))

      setStatus("Converting AVI to MP4...")

      // Start progress simulation if FFmpeg progress is not granular enough
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 2 // Simulate progress up to 90%
          return prev
        })
      }, 200)

      // Convert with optimized settings for web playback
      await ffmpeg.exec([
        "-i",
        "input.avi",
        "-c:v",
        "libx264", // Use H.264 codec
        "-preset",
        "fast", // Faster encoding
        "-crf",
        "23", // Good quality/size balance
        "-c:a",
        "aac", // AAC audio codec
        "-movflags",
        "+faststart", // Optimize for web streaming
        "output.mp4",
      ])

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setProgress(100)
      setStatus("Reading converted file...")

      const data = await ffmpeg.readFile("output.mp4")
      const blob = new Blob([data], { type: "video/mp4" })
      setConvertedBlob(blob)

      setStatus("Conversion complete!")

      // Clean up FFmpeg filesystem
      try {
        await ffmpeg.deleteFile("input.avi")
        await ffmpeg.deleteFile("output.mp4")
      } catch (cleanupError) {
        console.warn("FFmpeg cleanup warning:", cleanupError)
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

  const showConversionControls = !error || (error && !error.includes("browser security restrictions"))

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
                {error.includes("browser security restrictions") && (
                  <div className="mt-3 text-xs text-red-600 dark:text-red-400 space-y-2">
                    <p>You can convert your AVI file to MP4 using a desktop application:</p>
                    <ul className="list-disc list-inside">
                      <li>
                        <a
                          href="https://www.videolan.org/vlc/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          VLC Media Player
                        </a>{" "}
                        (Free, open-source)
                      </li>
                      <li>
                        <a href="https://handbrake.fr/" target="_blank" rel="noopener noreferrer" className="underline">
                          HandBrake
                        </a>{" "}
                        (Free, open-source)
                      </li>
                    </ul>
                    <p>Once converted, upload the MP4 file directly to the app.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm flex items-center gap-1">
              <Info className="h-4 w-4" /> About AVI Conversion
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Converts AVI files to web-compatible MP4 format</li>
              <li>• Uses H.264 video codec for best browser support</li>
              <li>• Processing happens entirely in your browser</li>
              <li>• Large files may take several minutes to convert</li>
              <li>• Converted file can be downloaded for future use</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!convertedBlob && showConversionControls ? (
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
                {convertedBlob && (
                  <Button onClick={handleUseConverted} className="flex-1 bg-green-600 hover:bg-green-700">
                    Use Converted Video
                  </Button>
                )}
                <Button variant="outline" onClick={handleDownload} className="bg-transparent" disabled={!convertedBlob}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {!convertedBlob && !showConversionControls && (
                  <Button onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Performance Warning */}
          {aviFile && aviFile.size > 100 * 1024 * 1024 && (
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
