"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, Info, Download, Upload, Video } from "lucide-react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

interface VideoConversionModalProps {
  isOpen: boolean
  onClose: () => void
  videoFile: File | null
  onConversionComplete: (convertedFile: File) => void
}

export default function VideoConversionModal({
  isOpen,
  onClose,
  videoFile,
  onConversionComplete,
}: VideoConversionModalProps) {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Initializing...")
  const [error, setError] = useState<string | null>(null)
  const [convertedBlobUrl, setConvertedBlobUrl] = useState<string | null>(null)

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) {
      setReady(true)
      return
    }

    setStatus("Loading FFmpeg...")
    setError(null)
    setProgress(0)

    try {
      const baseURLs = [
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
      ]
      let loaded = false
      for (const baseURL of baseURLs) {
        try {
          const ffmpeg = new FFmpeg()
          ffmpeg.on("log", ({ message }) => {
            console.log("[FFmpeg log]", message)
            setStatus(message)
          })
          ffmpeg.on("progress", ({ progress: p, time }) => {
            setProgress(Math.round(p * 100))
            setStatus(`Converting: ${Math.round(p * 100)}%`)
          })

          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
          })
          ffmpegRef.current = ffmpeg
          setReady(true)
          setStatus("FFmpeg loaded. Ready to convert.")
          loaded = true
          break
        } catch (e) {
          console.warn(`Failed to load FFmpeg from ${baseURL}:`, e)
          if (e instanceof DOMException && e.name === "SecurityError") {
            setError(
              "FFmpeg could not be loaded due to browser security restrictions (CORS/Worker issues). " +
                "Please try converting your video using an external tool like VLC or HandBrake, then upload the MP4 file.",
            )
            break // Stop trying other URLs if it's a security error
          }
          setError(`Failed to load FFmpeg from ${baseURL}. Trying next URL...`)
        }
      }
      if (!loaded) {
        setError(
          "Failed to load FFmpeg from all available sources. " +
            "This might be due to network issues or browser restrictions. " +
            "Please try converting your video using an external tool like VLC or HandBrake, then upload the MP4 file.",
        )
      }
    } catch (e) {
      console.error("Error loading FFmpeg:", e)
      setError(
        "An unexpected error occurred while loading FFmpeg. " +
          "Please try converting your video using an external tool like VLC or HandBrake, then upload the MP4 file.",
      )
    }
  }, [])

  useEffect(() => {
    if (isOpen && !ready && !error) {
      loadFFmpeg()
    }
  }, [isOpen, ready, error, loadFFmpeg])

  const convertToMp4 = useCallback(async () => {
    if (!ffmpegRef.current || !videoFile) {
      setError("FFmpeg not ready or no file selected.")
      return
    }

    setStatus("Converting...")
    setProgress(0)
    setError(null)
    setConvertedBlobUrl(null)

    try {
      const ffmpeg = ffmpegRef.current
      await ffmpeg.writeFile("input.avi", new Uint8Array(await videoFile.arrayBuffer()))
      await ffmpeg.exec(["-i", "input.avi", "output.mp4"])
      const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array

      const blob = new Blob([data.buffer], { type: "video/mp4" })
      const url = URL.createObjectURL(blob)
      setConvertedBlobUrl(url)
      setStatus("Conversion complete!")
      setProgress(100)
    } catch (e) {
      console.error("Error during conversion:", e)
      setError(
        `Conversion failed: ${e instanceof Error ? e.message : String(e)}. ` +
          "Please ensure the AVI file is valid or try an external converter.",
      )
      setStatus("Conversion failed.")
      setProgress(0)
    } finally {
      // Clean up file system
      try {
        if (ffmpegRef.current) {
          await ffmpegRef.current.rm("input.avi")
          await ffmpegRef.current.rm("output.mp4")
        }
      } catch (cleanupError) {
        console.warn("Failed to clean up FFmpeg file system:", cleanupError)
      }
    }
  }, [videoFile])

  const handleUseConvertedVideo = useCallback(() => {
    if (convertedBlobUrl && videoFile) {
      // Create a new File object with the converted blob and original name (but .mp4 extension)
      const convertedFile = new File([convertedBlobUrl], videoFile.name.replace(/\.avi$/i, ".mp4"), {
        type: "video/mp4",
      })
      onConversionComplete(convertedFile)
      setConvertedBlobUrl(null)
      onClose()
    }
  }, [convertedBlobUrl, videoFile, onConversionComplete, onClose])

  const handleDownloadConvertedVideo = useCallback(() => {
    if (convertedBlobUrl && videoFile) {
      const a = document.createElement("a")
      a.href = convertedBlobUrl
      a.download = videoFile.name.replace(/\.avi$/i, ".mp4")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [convertedBlobUrl, videoFile])

  const handleCloseModal = useCallback(() => {
    setReady(false)
    setProgress(0)
    setStatus("Initializing...")
    setError(null)
    setConvertedBlobUrl(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  const CurrentIcon = error ? XCircle : convertedBlobUrl ? CheckCircle : Loader2

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <Video className="h-6 w-6 text-blue-600" />
            Convert AVI to MP4
          </DialogTitle>
          <DialogDescription className="text-center">
            Your video is in AVI format. It needs to be converted to MP4 for playback.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center p-6 space-y-6">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                error ? "bg-red-500" : convertedBlobUrl ? "bg-green-500" : "bg-blue-500 animate-pulse"
              }`}
            >
              <CurrentIcon className="h-10 w-10 text-white transition-transform duration-300 ease-out" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{status}</h3>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {!error && (
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{progress}%</span>
                <span>{progress < 100 ? "Processing..." : "Complete!"}</span>
              </div>
            </div>
          )}

          <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Original File:</span>
              <span className="font-medium text-gray-800 dark:text-white">{videoFile?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Target Format:</span>
              <span className="font-medium text-gray-800 dark:text-white">MP4</span>
            </div>
          </div>

          {error ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                External Conversion Recommended
              </h4>
              <p>If in-browser conversion fails, you can use free external tools to convert your AVI to MP4:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <a
                    href="https://www.videolan.org/vlc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    VLC Media Player
                  </a>{" "}
                  (File &gt; Convert/Stream)
                </li>
                <li>
                  <a
                    href="https://handbrake.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    HandBrake
                  </a>{" "}
                  (Open Source Video Transcoder)
                </li>
              </ul>
              <p>After converting, upload the new MP4 file directly.</p>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              {!convertedBlobUrl ? (
                <Button
                  onClick={convertToMp4}
                  disabled={!ready || !videoFile || progress > 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Convert Video
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleUseConvertedVideo}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Use Converted
                  </Button>
                  <Button
                    onClick={handleDownloadConvertedVideo}
                    variant="outline"
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download MP4
                  </Button>
                </>
              )}
            </div>
          )}
          <Button onClick={handleCloseModal} variant="ghost" className="w-full">
            {error ? "Close" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
