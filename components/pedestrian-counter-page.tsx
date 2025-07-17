"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import VideoPlayer from "@/components/video-player"
import VideoOverlay, { type IntersectionPoint } from "@/components/video-overlay"
import HelpMenu from "@/components/help-menu"
import HelpPopupCenter from "@/components/help-popup-center"
import HelpSidebar from "@/components/help-sidebar"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import VideoEndPrompt from "@/components/video-end-prompt"
import ExportProgressModal from "@/components/export-progress-modal"
import VideoConversionModal from "@/components/video-conversion-modal"
import VideoControls from "@/components/video-controls" // Ensure this is imported
import { saveAs } from "file-saver"
import { format } from "date-fns"
import { UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button" // Ensure Button is imported

interface PedestrianCount {
  timestamp: number
  direction: string
  intersection: string
  videoTime: number
}

export default function PedestrianCounterPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [pedestrianCounts, setPedestrianCounts] = useState<PedestrianCount[]>([])
  const [intersections, setIntersections] = useState<IntersectionPoint[]>([])
  const [isLabelingMode, setIsLabelingMode] = useState(false)
  const [showHelpCenter, setShowHelpCenter] = useState(false)
  const [showHelpSidebar, setShowHelpSidebar] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null)
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)
  const [showExportProgress, setShowExportProgress] = useState(false)
  const [lastPressed, setLastPressed] = useState<{ key: string; direction: string } | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [lastDirectionCount, setLastDirectionCount] = useState(0)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [aviFileToConvert, setAviFileToConvert] = useState<File | null>(null)

  const isVideoLoaded = videoSrc !== null

  const handleVideoFileSelect = useCallback((file: File | null) => {
    if (file) {
      setVideoFile(file)
      // Check if it's an AVI file
      if (file.type === "video/x-msvideo" || file.name.toLowerCase().endsWith(".avi")) {
        setAviFileToConvert(file)
        setShowConversionModal(true)
      } else {
        setVideoSrc(URL.createObjectURL(file))
        setAviFileToConvert(null)
        setShowConversionModal(false)
      }
    } else {
      setVideoFile(null)
      setVideoSrc(null)
      setAviFileToConvert(null)
      setShowConversionModal(false)
    }
  }, [])

  const handleConversionComplete = useCallback((convertedFile: File) => {
    setVideoFile(convertedFile)
    setVideoSrc(URL.createObjectURL(convertedFile))
    setShowConversionModal(false)
    setAviFileToConvert(null)
  }, [])

  const handleLoadVideoClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsPlaying(false)
      setPlaybackRate(1)
      setCurrentTime(0)
      setIntersections([]) // Reset intersections for new video
      setPedestrianCounts([]) // Reset counts for new video
      setTotalCount(0)
      setLastDirectionCount(0)
      setLastPressed(null)
      setShowTimeInput(true) // Prompt for video recording time
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setShowVideoEndPrompt(true)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handleTogglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const handleChangePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }, [])

  const handleCount = useCallback(
    (key: string) => {
      if (!videoRef.current || intersections.length === 0) return

      const now = videoStartTime
        ? new Date(videoStartTime.getTime() + videoRef.current.currentTime * 1000)
        : new Date(Date.now()) // Fallback to current time if not set

      const intersectionMap: { [key: string]: IntersectionPoint } = {}
      intersections.forEach((p) => {
        if (p.direction) {
          intersectionMap[p.direction] = p
        }
      })

      let direction = ""
      let intersection = ""

      switch (key) {
        case "1":
          direction = "Eastbound"
          intersection = "North"
          break
        case "2":
          direction = "Westbound"
          intersection = "North"
          break
        case "3":
          direction = "Eastbound"
          intersection = "South"
          break
        case "4":
          direction = "Westbound"
          intersection = "South"
          break
        case "5":
          direction = "Northbound"
          intersection = "East"
          break
        case "6":
          direction = "Southbound"
          intersection = "East"
          break
        case "7":
          direction = "Northbound"
          intersection = "West"
          break
        case "8":
          direction = "Southbound"
          intersection = "West"
          break
        default:
          return
      }

      const newCount: PedestrianCount = {
        timestamp: now.getTime(),
        direction,
        intersection,
        videoTime: videoRef.current.currentTime,
      }

      setPedestrianCounts((prev) => [...prev, newCount])
      setTotalCount((prev) => prev + 1)
      setLastDirectionCount((prev) => prev + 1)
      setLastPressed({ key, direction })

      // Reset lastPressed after a short delay for visual feedback
      setTimeout(() => setLastPressed(null), 500)
    },
    [intersections, videoStartTime],
  )

  const handleUndo = useCallback(() => {
    setPedestrianCounts((prev) => {
      const newCounts = prev.slice(0, prev.length - 1)
      setTotalCount(newCounts.length)
      // Recalculate lastDirectionCount if needed, or simplify if not critical
      setLastDirectionCount(0) // Simplistic reset, could be improved
      return newCounts
    })
  }, [])

  const handleFinish = useCallback(() => {
    setShowExportProgress(true)
  }, [])

  const handleExportComplete = useCallback(() => {
    setShowExportProgress(false)
    // Optionally clear counts or prompt for new video
  }, [])

  const handleClearVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setVideoSrc(null)
      setVideoFile(null)
      setIsPlaying(false)
      setPlaybackRate(1)
      setCurrentTime(0)
      setDuration(0)
      setPedestrianCounts([])
      setIntersections([])
      setIsLabelingMode(false)
      setShowHelpCenter(false)
      setShowHelpSidebar(false)
      setShowTimeInput(false)
      setVideoStartTime(null)
      setShowVideoEndPrompt(false)
      setShowExportProgress(false)
      setLastPressed(null)
      setTotalCount(0)
      setLastDirectionCount(0)
      setAviFileToConvert(null)
      setShowConversionModal(false)
    }
  }, [])

  const handleExportData = useCallback(() => {
    if (pedestrianCounts.length === 0) {
      alert("No data to export!")
      return
    }

    setShowExportProgress(true)

    // Group counts by 15-second intervals
    const groupedCounts: { [key: string]: { [direction: string]: number } } = {}
    const intervalSeconds = 15

    pedestrianCounts.forEach((count) => {
      const baseTime = videoStartTime ? videoStartTime.getTime() : 0
      const eventAbsoluteTime = baseTime + count.videoTime * 1000
      const intervalStartMs = Math.floor(eventAbsoluteTime / (intervalSeconds * 1000)) * (intervalSeconds * 1000)
      const intervalKey = format(new Date(intervalStartMs), "yyyy-MM-dd HH:mm:ss")

      if (!groupedCounts[intervalKey]) {
        groupedCounts[intervalKey] = {
          "North-Eastbound": 0,
          "North-Westbound": 0,
          "South-Eastbound": 0,
          "South-Westbound": 0,
          "East-Northbound": 0,
          "East-Southbound": 0,
          "West-Northbound": 0,
          "West-Southbound": 0,
        }
      }
      const key = `${count.intersection}-${count.direction}`
      if (groupedCounts[intervalKey][key] !== undefined) {
        groupedCounts[intervalKey][key]++
      }
    })

    let csvContent =
      "Timestamp,North-Eastbound,North-Westbound,South-Eastbound,South-Westbound,East-Northbound,East-Southbound,West-Northbound,West-Southbound\n"

    const sortedIntervalKeys = Object.keys(groupedCounts).sort()

    sortedIntervalKeys.forEach((intervalKey) => {
      const counts = groupedCounts[intervalKey]
      csvContent += `${intervalKey},`
      csvContent += `${counts["North-Eastbound"]},`
      csvContent += `${counts["North-Westbound"]},`
      csvContent += `${counts["South-Eastbound"]},`
      csvContent += `${counts["South-Westbound"]},`
      csvContent += `${counts["East-Northbound"]},`
      csvContent += `${counts["East-Southbound"]},`
      csvContent += `${counts["West-Northbound"]},`
      csvContent += `${counts["West-Southbound"]}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, `pedestrian_counts_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)

    // This will be handled by the modal's internal progress
    // setTimeout(() => setShowExportProgress(false), 2000);
  }, [pedestrianCounts, videoStartTime])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isLabelingMode) return

      if (event.key === " ") {
        event.preventDefault()
        handleTogglePlay()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        handleChangePlaybackRate(Math.max(0.25, playbackRate - 0.25))
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        handleChangePlaybackRate(Math.min(4, playbackRate + 0.25))
      } else if (event.key === "z" || event.key === "Z") {
        event.preventDefault()
        handleUndo()
      } else if (event.key === "?") {
        event.preventDefault()
        setShowHelpSidebar((prev) => !prev)
      } else if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(event.key)) {
        event.preventDefault()
        handleCount(event.key)
      }
    },
    [isLabelingMode, handleTogglePlay, handleChangePlaybackRate, playbackRate, handleUndo, handleCount],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const handleSetVideoTime = useCallback((startTime: Date) => {
    setVideoStartTime(startTime)
    setShowTimeInput(false)
  }, [])

  const handleSkipVideoTime = useCallback(() => {
    setVideoStartTime(null) // Indicate no specific start time
    setShowTimeInput(false)
  }, [])

  const handleCloseVideoEndPrompt = useCallback(() => {
    setShowVideoEndPrompt(false)
  }, [])

  const handleUploadNewVideoFromPrompt = useCallback(() => {
    setShowVideoEndPrompt(false)
    handleClearVideo() // Clear current video and counts
    handleLoadVideoClick() // Trigger file input
  }, [handleClearVideo, handleLoadVideoClick])

  const groupedEntryCount = Object.keys(
    pedestrianCounts.reduce(
      (acc, count) => {
        const baseTime = videoStartTime ? videoStartTime.getTime() : 0
        const eventAbsoluteTime = baseTime + count.videoTime * 1000
        const intervalSeconds = 15
        const intervalStartMs = Math.floor(eventAbsoluteTime / (intervalSeconds * 1000)) * (intervalSeconds * 1000)
        const intervalKey = format(new Date(intervalStartMs), "yyyy-MM-dd HH:mm:ss")
        acc[intervalKey] = true
        return acc
      },
      {} as { [key: string]: boolean },
    ),
  ).length

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pedestrian Counter</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsLabelingMode((prev) => !prev)}
            variant={isLabelingMode ? "default" : "outline"}
            className={isLabelingMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            disabled={!isVideoLoaded}
          >
            {isLabelingMode ? "Exit Labeling" : "Label Intersections"}
          </Button>
          <HelpMenu
            onShowHelpCenter={() => setShowHelpCenter(true)}
            onShowHelpSidebar={() => setShowHelpSidebar((prev) => !prev)}
            onExportData={handleExportData}
            onClearVideo={handleClearVideo}
            onShowTimeInput={() => setShowTimeInput(true)}
            onLoadVideo={handleLoadVideoClick}
            isVideoLoaded={isVideoLoaded}
            isCountingActive={pedestrianCounts.length > 0}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        <Card className="w-full max-w-5xl overflow-hidden shadow-xl">
          <CardContent className="p-0">
            <div className="relative bg-black flex items-center justify-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <UploadCloud className="w-16 h-16 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-lg font-semibold mb-2">Upload a video to get started</p>
                  <p className="text-sm mb-4">Supported formats: MP4, WebM, OGG, AVI</p>
                  <Button onClick={handleLoadVideoClick} size="lg">
                    Load Video
                  </Button>
                </div>
              )}
              <VideoPlayer
                videoSrc={videoSrc}
                videoRef={videoRef}
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onVideoSelect={handleVideoFileSelect}
              />
              {isVideoLoaded && (
                <VideoOverlay
                  videoRef={videoRef}
                  onIntersectionsSet={(points) => {
                    setIntersections(points)
                    setIsLabelingMode(false)
                  }}
                  onCancelLabeling={() => setIsLabelingMode(false)}
                  isLabelingMode={isLabelingMode}
                  initialIntersections={intersections}
                />
              )}
            </div>
          </CardContent>
        </Card>
        {isVideoLoaded && (
          <VideoControls
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            onTogglePlay={handleTogglePlay}
            onChangePlaybackRate={handleChangePlaybackRate}
            isVideoLoaded={isVideoLoaded}
            onUndo={handleUndo}
            onFinish={handleFinish}
            onClearVideo={handleClearVideo}
            canUndo={pedestrianCounts.length > 0}
            canFinish={pedestrianCounts.length > 0}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onShowHelp={() => setShowHelpCenter(true)}
            lastPressed={lastPressed}
            intersectionsSet={intersections.length === 4 && intersections.every((p) => p.direction !== null)}
            totalCount={totalCount}
            lastDirectionCount={lastDirectionCount}
          />
        )}
      </main>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleVideoFileSelect(e.target.files ? e.target.files[0] : null)}
        className="hidden"
        accept="video/mp4,video/webm,video/ogg,video/x-msvideo,.avi"
      />

      <HelpPopupCenter isOpen={showHelpCenter} onClose={() => setShowHelpCenter(false)} />
      <HelpSidebar
        isOpen={showHelpSidebar}
        onClose={() => setShowHelpSidebar(false)}
        onCount={handleCount}
        onUndo={handleUndo}
        intersectionsSet={intersections.length === 4 && intersections.every((p) => p.direction !== null)}
        canUndo={pedestrianCounts.length > 0}
      />
      <VideoTimeInputDialog isOpen={showTimeInput} onConfirm={handleSetVideoTime} onSkip={handleSkipVideoTime} />
      <VideoEndPrompt
        isOpen={showVideoEndPrompt}
        onClose={handleCloseVideoEndPrompt}
        onUploadNewVideo={handleUploadNewVideoFromPrompt}
        onExportData={handleExportData}
        totalCounts={pedestrianCounts.length}
      />
      <ExportProgressModal
        isOpen={showExportProgress}
        onComplete={handleExportComplete}
        totalEntries={pedestrianCounts.length}
        groupedEntries={groupedEntryCount}
      />
      <VideoConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        videoFile={aviFileToConvert}
        onConversionComplete={handleConversionComplete}
      />
    </div>
  )
}
