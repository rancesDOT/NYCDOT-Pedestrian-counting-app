"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import ExportProgressModal from "@/components/export-progress-modal"
import HelpSidebar from "@/components/help-sidebar"
import VideoRestorePrompt from "@/components/video-restore-prompt"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import { directionsConfig as directions } from "@/lib/key-mappings"

interface Intersection {
  id: string
  x: number
  y: number
  label: string
}

interface LogEntry {
  key: string
  timestamp: number
}

interface GroupedEntry {
  interval: string
  startTime: number
  endTime: number
  directions: Record<string, number>
  totalCount: number
  actualStartTime?: Date
  actualEndTime?: Date
}

interface SavedState {
  counts: Record<string, number>
  log: LogEntry[]
  videoSrc: string | null
  intersections: Intersection[]
  playbackRate: number
  currentTime: number
  duration: number
  lastSaved: number
  videoFileName?: string
  recordingStartTime?: string // ISO string
}

const initialCounts = directions.reduce((acc, dir) => ({ ...acc, [dir.name]: 0 }), {})

const STORAGE_KEY = "pedestrian-counter-data"
const AUTO_SAVE_INTERVAL = 5000

export default function PedestrianCounterPage() {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
  const [log, setLog] = useState<LogEntry[]>([])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [lastPressed, setLastPressed] = useState<{ key: string; direction: string } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [intersections, setIntersections] = useState<Intersection[]>([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [groupedData, setGroupedData] = useState<GroupedEntry[]>([])
  const [showHelpSidebar, setShowHelpSidebar] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [showVideoRestorePrompt, setShowVideoRestorePrompt] = useState(false)
  const [savedStateForRestore, setSavedStateForRestore] = useState<SavedState | null>(null)
  const [pendingVideoRestore, setPendingVideoRestore] = useState(false)
  const [showTimeInputDialog, setShowTimeInputDialog] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const saveToStorage = useCallback(() => {
    try {
      const dataToSave: SavedState = {
        counts,
        log,
        videoSrc,
        intersections,
        playbackRate,
        currentTime: videoRef.current?.currentTime || currentTime,
        duration,
        lastSaved: Date.now(),
        recordingStartTime: recordingStartTime?.toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      console.log("Data saved to localStorage")
    } catch (error) {
      console.error("Failed to save data to localStorage:", error)
    }
  }, [counts, log, videoSrc, intersections, playbackRate, currentTime, duration, recordingStartTime])

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData: SavedState = JSON.parse(savedData)

        const maxAge = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - parsedData.lastSaved > maxAge) {
          console.log("Saved data is too old, starting fresh")
          return false
        }

        if (parsedData.videoSrc && (parsedData.log.length > 0 || parsedData.intersections.length > 0)) {
          setSavedStateForRestore(parsedData)
          setShowVideoRestorePrompt(true)

          setCounts(parsedData.counts || initialCounts)
          setLog(parsedData.log || [])
          setIntersections(parsedData.intersections || [])
          setPlaybackRate(parsedData.playbackRate || 1)
          setCurrentTime(parsedData.currentTime || 0)
          setDuration(parsedData.duration || 0)
          setRecordingStartTime(parsedData.recordingStartTime ? new Date(parsedData.recordingStartTime) : null)

          return true
        }

        setCounts(parsedData.counts || initialCounts)
        setLog(parsedData.log || [])
        setVideoSrc(parsedData.videoSrc || null)
        setIntersections(parsedData.intersections || [])
        setPlaybackRate(parsedData.playbackRate || 1)
        setCurrentTime(parsedData.currentTime || 0)
        setDuration(parsedData.duration || 0)
        setRecordingStartTime(parsedData.recordingStartTime ? new Date(parsedData.recordingStartTime) : null)

        console.log("Data loaded from localStorage")
        return true
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }
    return false
  }, [])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log("Saved data cleared")
    } catch (error) {
      console.error("Failed to clear saved data:", error)
    }
  }, [])

  const handleVideoRestore = useCallback(
    (file: File) => {
      if (!savedStateForRestore) return

      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      setPendingVideoRestore(true)
      setShowVideoRestorePrompt(false)
    },
    [savedStateForRestore],
  )

  const handleRestorePromptDismiss = useCallback(() => {
    setShowVideoRestorePrompt(false)
    setSavedStateForRestore(null)
    clearStorage()
  }, [clearStorage])

  useEffect(() => {
    const dataLoaded = loadFromStorage()
    setIsDataLoaded(true)
  }, [loadFromStorage])

  useEffect(() => {
    if (!isDataLoaded) return

    saveToStorage()

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }

    autoSaveIntervalRef.current = setInterval(saveToStorage, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [counts, log, videoSrc, intersections, playbackRate, saveToStorage, isDataLoaded, recordingStartTime])

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToStorage()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveToStorage()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [saveToStorage])

  const formatActualTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const groupDataBy15Seconds = useCallback(
    (logEntries: LogEntry[]): GroupedEntry[] => {
      if (logEntries.length === 0) return []

      const intervalSize = 15
      const groups: Record<number, GroupedEntry> = {}

      // Find the range of intervals we need to cover
      const timestamps = logEntries.map((entry) => entry.timestamp)
      const minTime = Math.min(...timestamps)
      const maxTime = Math.max(...timestamps)

      const startInterval = Math.floor(minTime / intervalSize) * intervalSize
      const endInterval = Math.floor(maxTime / intervalSize) * intervalSize

      // Create all intervals from start to end, even if empty
      for (let intervalStart = startInterval; intervalStart <= endInterval; intervalStart += intervalSize) {
        const intervalEnd = intervalStart + intervalSize

        let intervalLabel: string
        let actualStartTime: Date | undefined
        let actualEndTime: Date | undefined

        if (recordingStartTime) {
          // Calculate actual times
          actualStartTime = new Date(recordingStartTime.getTime() + intervalStart * 1000)
          actualEndTime = new Date(recordingStartTime.getTime() + intervalEnd * 1000)
          // Only show time, not date
          const startTimeStr = actualStartTime.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          const endTimeStr = actualEndTime.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          intervalLabel = `${startTimeStr} - ${endTimeStr}`
        } else {
          // Use video timestamps
          const startMinutes = Math.floor(intervalStart / 60)
          const startSeconds = Math.floor(intervalStart % 60)
          const endMinutes = Math.floor(intervalEnd / 60)
          const endSeconds = Math.floor(intervalEnd % 60)
          intervalLabel = `${startMinutes}:${startSeconds.toString().padStart(2, "0")}-${endMinutes}:${endSeconds.toString().padStart(2, "0")}`
        }

        groups[intervalStart] = {
          interval: intervalLabel,
          startTime: intervalStart,
          endTime: intervalEnd,
          directions: directions.reduce((acc, dir) => ({ ...acc, [dir.name]: 0 }), {}),
          totalCount: 0,
          actualStartTime,
          actualEndTime,
        }
      }

      // Now populate with actual data
      logEntries.forEach((entry) => {
        const intervalStart = Math.floor(entry.timestamp / intervalSize) * intervalSize

        const direction = directions.find((d) => d.key === entry.key)
        if (direction && groups[intervalStart]) {
          groups[intervalStart].directions[direction.name]++
          groups[intervalStart].totalCount++
        }
      })

      return Object.values(groups).sort((a, b) => a.startTime - b.startTime)
    },
    [recordingStartTime],
  )

  const handleCount = useCallback(
    (key: string) => {
      const directionConfig = directions.find((d) => d.key === key)
      if (!directionConfig || !videoSrc || intersections.length !== 4) return

      const timestamp = videoRef.current?.currentTime ?? 0
      setLog((prev) => [...prev, { key, timestamp }])

      const newCount = (counts[directionConfig.name] || 0) + 1
      setCounts((prev) => ({ ...prev, [directionConfig.name]: newCount }))

      setLastPressed({ key, direction: directionConfig.direction })
    },
    [counts, videoSrc, intersections.length],
  )

  const handleUndo = useCallback(() => {
    if (log.length === 0) {
      setLastPressed(null)
      return
    }

    const lastEntry = log[log.length - 1]
    const directionConfig = directions.find((d) => d.key === lastEntry.key)

    if (directionConfig) {
      setCounts((prev) => ({ ...prev, [directionConfig.name]: Math.max(0, prev[directionConfig.name] - 1) }))
    }

    const newLog = log.slice(0, -1)
    setLog(newLog)

    if (newLog.length > 0) {
      const newLastEntry = newLog[newLog.length - 1]
      const newLastDirectionConfig = directions.find((d) => d.key === newLastEntry.key)
      if (newLastDirectionConfig) {
        setLastPressed({ key: newLastEntry.key, direction: newLastDirectionConfig.direction })
      } else {
        setLastPressed(null)
      }
    } else {
      setLastPressed(null)
    }
  }, [log])

  const handleClearVideo = useCallback(() => {
    setVideoSrc(null)
    setIntersections([])
    setCounts(initialCounts)
    setLog([])
    setIsPlaying(false)
    setPlaybackRate(1)
    setLastPressed(null)
    setCurrentTime(0)
    setDuration(0)
    setRecordingStartTime(null)
    clearStorage()
  }, [clearStorage])

  const downloadCSV = useCallback(
    (data: GroupedEntry[], filename: string) => {
      try {
        const csvRows = data.map((entry) => {
          const keyCounts = [1, 2, 3, 4, 5, 6, 7, 8].map((keyNum) => {
            const direction = directions.find((d) => d.key === keyNum.toString())
            return direction ? entry.directions[direction.name] || 0 : 0
          })
          return [entry.interval, ...keyCounts].join(",")
        })

        const header = "Time interval,1,2,3,4,5,6,7,8"
        const csvContent = [header, ...csvRows].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Error downloading CSV:", error)
      }
    },
    [recordingStartTime],
  )

  const handleFinish = useCallback(() => {
    if (log.length === 0) return
    const grouped = groupDataBy15Seconds(log)
    setGroupedData(grouped)
    setShowExportModal(true)
  }, [log, groupDataBy15Seconds])

  const handleExportComplete = useCallback(() => {
    setShowExportModal(false)
    if (groupedData.length > 0) {
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, "-")

      let filename: string
      if (recordingStartTime) {
        const recordingDate = recordingStartTime.toISOString().slice(0, 10) // YYYY-MM-DD
        filename = `pedestrian_counts_${recordingDate}_${timestamp}.csv`
      } else {
        filename = `pedestrian_counts_video_time_${timestamp}.csv`
      }

      downloadCSV(groupedData, filename)
    }
  }, [groupedData, downloadCSV, recordingStartTime])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    try {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    } catch (error) {
      console.error("Error toggling video playback:", error)
    }
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return
    try {
      const newRate = Math.max(0.25, Math.min(4, rate))
      videoRef.current.playbackRate = newRate
      setPlaybackRate(newRate)
    } catch (error) {
      console.error("Error changing playback rate:", error)
    }
  }, [])

  const handleVideoSelect = useCallback((src: string | null) => {
    setVideoSrc(src)
    setIntersections([])
    if (src) {
      setIsPlaying(false)
      setPlaybackRate(1)
      setCurrentTime(0)
      setDuration(0)
      // Show time input dialog when new video is selected
      setShowTimeInputDialog(true)
    }
  }, [])

  const handleTimeInputConfirm = useCallback((startTime: Date) => {
    setRecordingStartTime(startTime)
    setShowTimeInputDialog(false)
  }, [])

  const handleTimeInputSkip = useCallback(() => {
    setRecordingStartTime(null)
    setShowTimeInputDialog(false)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)

      if (pendingVideoRestore && savedStateForRestore) {
        const timeToRestore = savedStateForRestore.currentTime
        if (timeToRestore && timeToRestore > 0) {
          videoRef.current.currentTime = timeToRestore
          setCurrentTime(timeToRestore)
          console.log(`Video restored to time: ${timeToRestore}s`)
        }
        setPendingVideoRestore(false)
        setSavedStateForRestore(null)
      } else {
        const savedData = localStorage.getItem(STORAGE_KEY)
        if (savedData) {
          try {
            const parsedData: SavedState = JSON.parse(savedData)
            if (parsedData.currentTime && parsedData.currentTime > 0 && !parsedData.videoSrc) {
              videoRef.current.currentTime = parsedData.currentTime
              setCurrentTime(parsedData.currentTime)
            }
          } catch (error) {
            console.error("Failed to restore video time on fresh load:", error)
          }
        }
      }
    }
  }, [pendingVideoRestore, savedStateForRestore])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handleShowHelp = useCallback(() => {
    setShowHelpSidebar(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as Element)?.closest("input, textarea, select, [contenteditable]")
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const numericKey = event.key.replace("numpad", "")

      if (directions.some((d) => d.key === numericKey) && intersections.length === 4) {
        event.preventDefault()
        event.stopPropagation()
        handleCount(numericKey)
      } else if (key === "z") {
        event.preventDefault()
        event.stopPropagation()
        handleUndo()
      } else if (key === " " && videoSrc) {
        event.preventDefault()
        event.stopPropagation()
        togglePlay()
      } else if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault()
        event.stopPropagation()
        setShowHelpSidebar((prev) => !prev)
      } else if (key === "arrowleft" && videoSrc) {
        event.preventDefault()
        event.stopPropagation()
        const newRate = Math.max(0.25, playbackRate - 0.25)
        changePlaybackRate(newRate)
      } else if (key === "arrowright" && videoSrc) {
        event.preventDefault()
        event.stopPropagation()
        const newRate = Math.min(4, playbackRate + 0.25)
        changePlaybackRate(newRate)
      }
    }

    document.addEventListener("keydown", handleKeyDown, { capture: false })
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: false })
    }
  }, [handleCount, handleUndo, videoSrc, togglePlay, intersections.length, playbackRate, changePlaybackRate])

  if (!isDataLoaded) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading saved data...</p>
        </div>
      </div>
    )
  }

  const totalCounts = Object.values(counts).reduce((sum, count) => sum + count, 0)

  // Calculate last direction count
  const lastDirectionCount = lastPressed
    ? (() => {
        const directionConfig = directions.find((d) => d.key === lastPressed.key)
        return directionConfig ? counts[directionConfig.name] || 0 : 0
      })()
    : 0

  return (
    <>
      <main
        className={`h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col p-4 gap-0 overflow-hidden transition-all duration-300 ${showHelpSidebar ? "pr-84" : ""}`}
      >
        <div className="flex-grow h-full min-h-0">
          <VideoPlayer
            ref={videoRef}
            videoSrc={videoSrc}
            onVideoSelect={handleVideoSelect}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            lastPressed={lastPressed}
            onIntersectionsSet={setIntersections}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
        </div>
        <div className="flex-shrink-0">
          <VideoControls
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            onTogglePlay={togglePlay}
            onChangePlaybackRate={changePlaybackRate}
            isVideoLoaded={!!videoSrc}
            onUndo={handleUndo}
            onFinish={handleFinish}
            onClearVideo={handleClearVideo}
            canUndo={log.length > 0}
            canFinish={log.length > 0}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onShowHelp={handleShowHelp}
            lastPressed={lastPressed}
            intersectionsSet={intersections.length === 4}
            totalCount={totalCounts}
            lastDirectionCount={lastDirectionCount}
          />
        </div>
      </main>

      <VideoTimeInputDialog
        isOpen={showTimeInputDialog}
        onConfirm={handleTimeInputConfirm}
        onSkip={handleTimeInputSkip}
      />

      <ExportProgressModal
        isOpen={showExportModal}
        onComplete={handleExportComplete}
        totalEntries={log.length}
        groupedEntries={groupedData.length}
      />
      <HelpSidebar isOpen={showHelpSidebar} onClose={() => setShowHelpSidebar(false)} />

      {showVideoRestorePrompt && savedStateForRestore && (
        <VideoRestorePrompt
          isOpen={showVideoRestorePrompt}
          onVideoRestore={handleVideoRestore}
          onDismiss={handleRestorePromptDismiss}
          savedData={{
            currentTime: savedStateForRestore.currentTime,
            duration: savedStateForRestore.duration,
            totalCounts: totalCounts,
            intersectionCount: savedStateForRestore.intersections.length,
            lastSaved: savedStateForRestore.lastSaved,
          }}
        />
      )}
    </>
  )
}
