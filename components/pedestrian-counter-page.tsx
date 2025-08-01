"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import ExportProgressModal from "@/components/export-progress-modal"
import HelpSidebar from "@/components/help-sidebar"
import VideoRestorePrompt from "@/components/video-restore-prompt"
import VideoTimeInputDialog from "@/components/video-time-input-dialog"
import VideoEndPrompt from "@/components/video-end-prompt"
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
  videoIndex: number // Track which video this count came from
}

interface GroupedEntry {
  interval: string
  startTime: number
  endTime: number
  directions: Record<string, number>
  totalCount: number
  actualStartTime?: Date
  actualEndTime?: Date
  videoIndex?: number
}

interface VideoMetadata {
  recordingStartTime: Date | null
  intersections: Intersection[]
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
  videoCount: number
  currentVideoIndex: number
  videoMetadata: Record<number, VideoMetadata> // Store metadata per video
}

const initialCounts = directions.reduce((acc, dir) => ({ ...acc, [dir.name]: 0 }), {})

const STORAGE_KEY = "pedestrian-counter-data"
const AUTO_SAVE_INTERVAL = 5000

// Configuration constants for easy modification
const DATA_GROUPING_CONFIG = {
  INTERVAL_SIZE_SECONDS: 60, //900
} as const

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
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)
  const [videoCount, setVideoCount] = useState(1)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<Record<number, VideoMetadata>>({})
  const [isExporting, setIsExporting] = useState(false) // State to prevent duplicate exports

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Formats time interval for display
   * @param startSeconds - Start time in seconds
   * @param endSeconds - End time in seconds
   * @param intervalSize - Size of interval in seconds
   * @returns Formatted time string
   */
  const formatTimeInterval = useCallback((startSeconds: number, endSeconds: number, intervalSize: number): string => {
    if (intervalSize >= 60) {
      // For intervals >= 1 minute, show in MM:SS format
      const startMinutes = Math.floor(startSeconds / 60)
      const startSecondsRemainder = Math.floor(startSeconds % 60)
      const endMinutes = Math.floor(endSeconds / 60)
      const endSecondsRemainder = Math.floor(endSeconds % 60)
      return `${startMinutes}:${startSecondsRemainder.toString().padStart(2, "0")}-${endMinutes}:${endSecondsRemainder.toString().padStart(2, "0")}`
    } else {
      // For intervals < 1 minute, show in seconds
      return `${startSeconds}s-${endSeconds}s`
    }
  }, [])

  /**
   * Formats actual time (wall clock time) for display
   * @param startTime - Start Date object
   * @param endTime - End Date object
   * @returns Formatted time string
   */
  const formatActualTimeInterval = useCallback((startTime: Date, endTime: Date): string => {
    const startTimeStr = startTime.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    const endTimeStr = endTime.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${startTimeStr} - ${endTimeStr}`
  }, [])

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
        videoCount,
        currentVideoIndex,
        videoMetadata,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      console.log("Data saved to localStorage")
    } catch (error) {
      console.error("Failed to save data to localStorage:", error)
    }
  }, [
    counts,
    log,
    videoSrc,
    intersections,
    playbackRate,
    currentTime,
    duration,
    recordingStartTime,
    videoCount,
    currentVideoIndex,
    videoMetadata,
  ])

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedData: SavedState = JSON.parse(savedData)

        const maxAge = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - parsedData.lastSaved > maxAge) {
          console.log("Saved data is too old, starting fresh")
          localStorage.removeItem(STORAGE_KEY)
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
          setVideoCount(parsedData.videoCount || 1)
          setCurrentVideoIndex(parsedData.currentVideoIndex || 0)
          setVideoMetadata(parsedData.videoMetadata || {})

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
        setVideoCount(parsedData.videoCount || 1)
        setCurrentVideoIndex(parsedData.currentVideoIndex || 0)
        setVideoMetadata(parsedData.videoMetadata || {})

        console.log("Data loaded from localStorage")
        return true
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
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
  }, [
    counts,
    log,
    videoSrc,
    intersections,
    playbackRate,
    saveToStorage,
    isDataLoaded,
    recordingStartTime,
    videoCount,
    currentVideoIndex,
    videoMetadata,
    isExporting, // Added isExporting to dependencies to ensure saveToStorage reacts to its changes
  ])

  useEffect(() => {
    if (!isDataLoaded) return

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
  }, [saveToStorage, isDataLoaded])

  // Handle video end detection
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnd = () => {
      setIsPlaying(false)
      setShowVideoEndPrompt(true)
    }

    video.addEventListener("ended", handleVideoEnd)
    return () => {
      video.removeEventListener("ended", handleVideoEnd)
    }
  }, [videoSrc])

  /**
   * Groups log entries by configurable time intervals
   * @param logEntries - Array of log entries to group
   * @param intervalSize - Size of interval in seconds (defaults to config value)
   * @returns Array of grouped entries
   */
  const groupDataByInterval = useCallback(
      (logEntries: LogEntry[], intervalSize: number = DATA_GROUPING_CONFIG.INTERVAL_SIZE_SECONDS): GroupedEntry[] => {
        if (logEntries.length === 0) return []

        console.log(`Grouping data by ${intervalSize}s intervals`)

        const groups: Record<string, GroupedEntry> = {}

        // Group by video index first, then by time intervals
        const videoGroups: Record<number, LogEntry[]> = {}
        logEntries.forEach((entry) => {
          if (!videoGroups[entry.videoIndex]) {
            videoGroups[entry.videoIndex] = []
          }
          videoGroups[entry.videoIndex].push(entry)
        })

        // Process each video's data
        Object.entries(videoGroups).forEach(([videoIndexStr, videoEntries]) => {
          const videoIndex = Number.parseInt(videoIndexStr)
          const timestamps = videoEntries.map((entry) => entry.timestamp)
          const minTime = Math.min(...timestamps)
          const maxTime = Math.max(...timestamps)

          const startInterval = Math.floor(minTime / intervalSize) * intervalSize
          const endInterval = Math.floor(maxTime / intervalSize) * intervalSize

          // Get the recording start time for this specific video
          const videoRecordingStartTime = videoMetadata[videoIndex]?.recordingStartTime

          // Create all intervals for this video
          for (let intervalStart = startInterval; intervalStart <= endInterval; intervalStart += intervalSize) {
            const intervalEnd = intervalStart + intervalSize
            const groupKey = `${videoIndex}-${intervalStart}`

            let intervalLabel: string
            let actualStartTime: Date | undefined
            let actualEndTime: Date | undefined

            if (videoRecordingStartTime) {
              actualStartTime = new Date(videoRecordingStartTime.getTime() + intervalStart * 1000)
              actualEndTime = new Date(videoRecordingStartTime.getTime() + intervalEnd * 1000)
              intervalLabel = `Video ${videoIndex + 1}: ${formatActualTimeInterval(actualStartTime, actualEndTime)}`
            } else {
              intervalLabel = `Video ${videoIndex + 1}: ${formatTimeInterval(intervalStart, intervalEnd, intervalSize)}`
            }

            groups[groupKey] = {
              interval: intervalLabel,
              startTime: intervalStart,
              endTime: intervalEnd,
              directions: directions.reduce((acc, dir) => ({ ...acc, [dir.name]: 0 }), {}),
              totalCount: 0,
              actualStartTime,
              actualEndTime,
              videoIndex,
            }
          }

          // Populate with actual data
          videoEntries.forEach((entry) => {
            const intervalStart = Math.floor(entry.timestamp / intervalSize) * intervalSize
            const groupKey = `${entry.videoIndex}-${intervalStart}`

            const direction = directions.find((d) => d.key === entry.key)
            if (direction && groups[groupKey]) {
              groups[groupKey].directions[direction.name]++
              groups[groupKey].totalCount++
            }
          })
        })

        return Object.values(groups).sort((a, b) => {
          if (a.videoIndex !== b.videoIndex) {
            return a.videoIndex! - b.videoIndex!
          }
          return a.startTime - b.startTime
        })
      },
      [videoMetadata, formatTimeInterval, formatActualTimeInterval],
  )

  const handleCount = useCallback(
      (key: string) => {
        const directionConfig = directions.find((d) => d.key === key)
        if (!directionConfig || !videoSrc || intersections.length !== 4) return

        const timestamp = videoRef.current?.currentTime ?? 0
        setLog((prev) => [...prev, { key, timestamp, videoIndex: currentVideoIndex }])

        const newCount = (counts[directionConfig.name] || 0) + 1
        setCounts((prev) => ({ ...prev, [directionConfig.name]: newCount }))

        setLastPressed({ key, direction: directionConfig.direction })
      },
      [counts, videoSrc, intersections.length, currentVideoIndex],
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
    setVideoCount(1)
    setCurrentVideoIndex(0)
    setVideoMetadata({})
    clearStorage()
  }, [clearStorage])

  const downloadCSV = useCallback((data: GroupedEntry[], filename: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log(`Starting CSV export with ${data.length} entries`)

        if (data.length === 0) {
          console.warn("No data to export")
          reject(new Error("No data to export"))
          return
        }

        const csvRows = data.map((entry) => {
          const keyCounts = [1, 2, 3, 4, 5, 6, 7, 8].map((keyNum) => {
            const direction = directions.find((d) => d.key === keyNum.toString())
            return direction ? entry.directions[direction.name] || 0 : 0
          })
          return [entry.interval, ...keyCounts].join(",")
        })

        const header = "Time interval,1,2,3,4,5,6,7,8"
        const csvContent = [header, ...csvRows].join("\n")

        console.log(`CSV content generated: ${csvContent.length} characters`)

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"

        document.body.appendChild(link)

        // Use requestAnimationFrame for better timing before click
        requestAnimationFrame(() => {
          try {
            link.click()
            console.log(`CSV download triggered: ${filename}`)

            // Clean up after a short delay to ensure download starts
            setTimeout(() => {
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              resolve()
            }, 100) // Small delay to ensure browser registers the click
          } catch (clickError) {
            console.error("Error clicking download link:", clickError)
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            reject(clickError)
          }
        })
      } catch (error) {
        console.error("Error creating CSV download:", error)
        reject(error)
      }
    })
  }, [])

  const handleFinish = useCallback(() => {
    if (log.length === 0) {
      console.warn("No log entries to export")
      return
    }

    if (isExporting) {
      console.log("Export already in progress")
      return
    }

    setIsExporting(true) // Set exporting state immediately
    console.log(`Processing ${log.length} log entries for export`)
    const grouped = groupDataByInterval(log)
    console.log(`Generated ${grouped.length} grouped entries`)

    setGroupedData(grouped)
    setShowExportModal(true)
  }, [log, groupDataByInterval, isExporting])

  const handleExportComplete = useCallback(async () => {
    console.log("Export complete triggered from modal")

    if (groupedData.length === 0) {
      console.error("No grouped data available for export")
      setIsExporting(false) // Reset exporting state
      setShowExportModal(false)
      return
    }

    try {
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, "-")
      const intervalMinutes = Math.floor(DATA_GROUPING_CONFIG.INTERVAL_SIZE_SECONDS / 60)
      const intervalLabel =
          intervalMinutes >= 1 ? `${intervalMinutes}min` : `${DATA_GROUPING_CONFIG.INTERVAL_SIZE_SECONDS}sec`

      let filename: string
      if (Object.keys(videoMetadata).length > 0) {
        const firstVideoStartTime = videoMetadata[0]?.recordingStartTime
        if (firstVideoStartTime) {
          const recordingDate = firstVideoStartTime.toISOString().slice(0, 10)
          filename = `pedestrian_counts_${recordingDate}_${timestamp}.csv`
        } else {
          filename = `pedestrian_counts_${timestamp}.csv`
        }
      } else {
        filename = `pedestrian_counts_${timestamp}.csv`
      }

      console.log(`Attempting to download CSV: ${filename}`)
      await downloadCSV(groupedData, filename)
      console.log("CSV download completed successfully")

      // Clear all data after successful export
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
      setVideoCount(1)
      setCurrentVideoIndex(0)
      setVideoMetadata({})
      setGroupedData([]) // Clear grouped data as well
      clearStorage()

      console.log("All data cleared after successful export")
    } catch (error) {
      console.error("Failed to export CSV:", error)
      // Don't close modal if export failed, let user try again
      setIsExporting(false) // Reset exporting state on error
      return
    }

    setIsExporting(false) // Reset exporting state
    setShowExportModal(false) // Close modal
  }, [groupedData, downloadCSV, videoMetadata, clearStorage])

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

  const handleVideoSelect = useCallback(
      (src: string | null) => {
        // Store current video's metadata before switching
        if (currentVideoIndex >= 0 && (intersections.length > 0 || recordingStartTime)) {
          setVideoMetadata((prev) => ({
            ...prev,
            [currentVideoIndex]: {
              recordingStartTime,
              intersections: [...intersections],
            },
          }))
        }

        setVideoSrc(src)

        if (src) {
          // Check if we have existing metadata for this video
          const existingMetadata = videoMetadata[currentVideoIndex]

          if (existingMetadata) {
            // Restore intersections and recording start time for this video
            setIntersections(existingMetadata.intersections)
            setRecordingStartTime(existingMetadata.recordingStartTime)
          } else {
            // For new videos, try to reuse intersections from the most recent video
            const mostRecentVideoIndex = Math.max(0, currentVideoIndex - 1)
            const mostRecentMetadata = videoMetadata[mostRecentVideoIndex]

            if (mostRecentMetadata && mostRecentMetadata.intersections.length === 4) {
              // Reuse intersections from previous video
              setIntersections(mostRecentMetadata.intersections)
              console.log(`Reusing intersections from video ${mostRecentVideoIndex}`)
            } else {
              // No previous intersections available, clear them
              setIntersections([])
            }

            // Always ask for new recording start time for new videos
            setRecordingStartTime(null)
            setShowTimeInputDialog(true)
          }

          // Reset video-specific playback state
          setIsPlaying(false)
          setPlaybackRate(1)
          setCurrentTime(0)
          setDuration(0)
          setLastPressed(null)
        }
      },
      [currentVideoIndex, intersections, recordingStartTime, videoMetadata],
  )

  const handleNewVideoUpload = useCallback(() => {
    setShowVideoEndPrompt(false)

    // Store current video's metadata
    if (currentVideoIndex >= 0) {
      setVideoMetadata((prev) => ({
        ...prev,
        [currentVideoIndex]: {
          recordingStartTime,
          intersections: [...intersections],
        },
      }))
    }

    setCurrentVideoIndex(videoCount)
    setVideoCount((prev) => prev + 1)

    // Trigger file upload
    const fileInput = document.getElementById("video-upload-hidden") as HTMLInputElement
    fileInput?.click()
  }, [videoCount, currentVideoIndex, recordingStartTime, intersections])

  const handleVideoEndExport = useCallback(() => {
    setShowVideoEndPrompt(false)
    handleFinish()
  }, [handleFinish])

  const handleReplayVideo = useCallback(() => {
    setShowVideoEndPrompt(false)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }, [])

  const handleTimeInputConfirm = useCallback(
      (startTime: Date) => {
        setRecordingStartTime(startTime)
        setShowTimeInputDialog(false)

        // Update metadata for current video
        setVideoMetadata((prev) => ({
          ...prev,
          [currentVideoIndex]: {
            recordingStartTime: startTime,
            intersections: [...intersections],
          },
        }))
      },
      [currentVideoIndex, intersections],
  )

  const handleTimeInputSkip = useCallback(() => {
    setRecordingStartTime(null)
    setShowTimeInputDialog(false)

    // Update metadata for current video
    setVideoMetadata((prev) => ({
      ...prev,
      [currentVideoIndex]: {
        recordingStartTime: null,
        intersections: [...intersections],
      },
    }))
  }, [currentVideoIndex, intersections])

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

  // Update intersections handler to save to metadata
  const handleIntersectionsSet = useCallback(
      (newIntersections: Intersection[]) => {
        setIntersections(newIntersections)

        // Update metadata for current video
        setVideoMetadata((prev) => ({
          ...prev,
          [currentVideoIndex]: {
            recordingStartTime,
            intersections: [...newIntersections],
          },
        }))
      },
      [currentVideoIndex, recordingStartTime],
  )

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
                onIntersectionsSet={handleIntersectionsSet}
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

        <VideoEndPrompt
            isOpen={showVideoEndPrompt}
            onUploadNew={handleNewVideoUpload}
            onExport={handleVideoEndExport}
            onReplay={handleReplayVideo}
            totalCounts={totalCounts}
            videoCount={videoCount}
        />

        <ExportProgressModal
            isOpen={showExportModal}
            onComplete={handleExportComplete} // This will now trigger the actual download and clear
            totalEntries={log.length}
            groupedEntries={groupedData.length}
        />

        <HelpSidebar
            isOpen={showHelpSidebar}
            onClose={() => setShowHelpSidebar(false)}
            onCount={handleCount}
            onUndo={handleUndo}
            intersectionsSet={intersections.length === 4}
            canUndo={log.length > 0}
        />

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
        <input
            type="file"
            id="video-upload-hidden"
            accept="video/mp4, video/webm, video/ogg"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                const url = URL.createObjectURL(file)
                handleVideoSelect(url)
              }
              // Reset the input value
              e.target.value = ""
            }}
        />
      </>
  )
}
