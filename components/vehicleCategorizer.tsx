"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoPlayer from "@/components/video-player"
import VideoControls from "@/components/video-controls"
import ExportProgressModal from "@/components/export-progress-modal"
import VehicleCategorizerSidebar from "@/components/vehicle-categorizer-sidebar"
import { vehicleClassifications } from "@/lib/vehicle-classifications"

interface Intersection {
  id: string
  x: number
  y: number
  label: string
}

interface VehicleLogEntry {
  timestamp: number
  videoIndex: number
  mainClass: number
  subClass: string
  direction: string
  intersectionId?: string
}

interface GroupedVehicleEntry {
  interval: string
  startTime: number
  endTime: number
  vehicles: Record<string, Record<string, Record<string, number>>> // mainClass -> subClass -> direction -> count
  totalCount: number
  actualStartTime?: Date
  actualEndTime?: Date
  videoIndex?: number
}

interface VideoMetadata {
  recordingStartTime: Date | null
  intersections: Intersection[]
}

interface SavedVehicleState {
  counts: Record<string, Record<string, Record<string, number>>>
  log: VehicleLogEntry[]
  videoSrc: string | null
  intersections: Intersection[]
  playbackRate: number
  currentTime: number
  duration: number
  lastSaved: number
  videoFileName?: string
  recordingStartTime?: string
  videoCount: number
  currentVideoIndex: number
  videoMetadata: Record<number, VideoMetadata>
}

const STORAGE_KEY = "vehicle-categorizer-data"
const AUTO_SAVE_INTERVAL = 5000
const DATA_GROUPING_CONFIG = {
  INTERVAL_SIZE_SECONDS: 60,
} as const

export default function VehicleCategorizePage() {
  const [counts, setCounts] = useState<Record<string, Record<string, Record<string, number>>>>({})
  const [log, setLog] = useState<VehicleLogEntry[]>([])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [lastPressed, setLastPressed] = useState<{ mainClass: number; subClass: string; direction: string } | null>(
    null,
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [intersections, setIntersections] = useState<Intersection[]>([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [groupedData, setGroupedData] = useState<GroupedVehicleEntry[]>([])
  const [showVehicleSidebar, setShowVehicleSidebar] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [showVideoRestorePrompt, setShowVideoRestorePrompt] = useState(false)
  const [savedStateForRestore, setSavedStateForRestore] = useState<SavedVehicleState | null>(null)
  const [pendingVideoRestore, setPendingVideoRestore] = useState(false)
  const [showTimeInputDialog, setShowTimeInputDialog] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [showVideoEndPrompt, setShowVideoEndPrompt] = useState(false)
  const [videoCount, setVideoCount] = useState(1)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<Record<number, VideoMetadata>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize counts structure
  useEffect(() => {
    const initialCounts: Record<string, Record<string, Record<string, number>>> = {}
    vehicleClassifications.forEach((mainClass) => {
      initialCounts[mainClass.id.toString()] = {}
      mainClass.subClasses.forEach((subClass) => {
        initialCounts[mainClass.id.toString()][subClass.name] = {
          North: 0,
          South: 0,
          East: 0,
          West: 0,
        }
      })
    })
    setCounts(initialCounts)
  }, [])

  const formatTimeInterval = useCallback((startSeconds: number, endSeconds: number, intervalSize: number): string => {
    if (intervalSize >= 60) {
      const startMinutes = Math.floor(startSeconds / 60)
      const startSecondsRemainder = Math.floor(startSeconds % 60)
      const endMinutes = Math.floor(endSeconds / 60)
      const endSecondsRemainder = Math.floor(endSeconds % 60)
      return `${startMinutes}:${startSecondsRemainder.toString().padStart(2, "0")}-${endMinutes}:${endSecondsRemainder.toString().padStart(2, "0")}`
    } else {
      return `${startSeconds}s-${endSeconds}s`
    }
  }, [])

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
      const dataToSave: SavedVehicleState = {
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
      console.log("Vehicle categorizer data saved to localStorage")
    } catch (error) {
      console.error("Failed to save vehicle categorizer data to localStorage:", error)
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
        const parsedData: SavedVehicleState = JSON.parse(savedData)

        const maxAge = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - parsedData.lastSaved > maxAge) {
          console.log("Saved vehicle data is too old, starting fresh")
          localStorage.removeItem(STORAGE_KEY)
          return false
        }

        if (parsedData.videoSrc && (parsedData.log.length > 0 || parsedData.intersections.length > 0)) {
          setSavedStateForRestore(parsedData)
          setShowVideoRestorePrompt(true)

          setCounts(parsedData.counts || {})
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

        setCounts(parsedData.counts || {})
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

        console.log("Vehicle categorizer data loaded from localStorage")
        return true
      }
    } catch (error) {
      console.error("Failed to load vehicle categorizer data from localStorage:", error)
      localStorage.removeItem(STORAGE_KEY)
    }
    return false
  }, [])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log("Vehicle categorizer saved data cleared")
    } catch (error) {
      console.error("Failed to clear vehicle categorizer saved data:", error)
    }
  }, [])

  const handleVehicleCount = useCallback(
    (mainClass: number, subClass: string, direction: string) => {
      if (!videoSrc || intersections.length !== 4) return

      const timestamp = videoRef.current?.currentTime ?? 0
      setLog((prev) => [
        ...prev,
        {
          timestamp,
          videoIndex: currentVideoIndex,
          mainClass,
          subClass,
          direction,
        },
      ])

      setCounts((prev) => {
        const newCounts = { ...prev }
        if (!newCounts[mainClass.toString()]) {
          newCounts[mainClass.toString()] = {}
        }
        if (!newCounts[mainClass.toString()][subClass]) {
          newCounts[mainClass.toString()][subClass] = {
            North: 0,
            South: 0,
            East: 0,
            West: 0,
          }
        }
        newCounts[mainClass.toString()][subClass][direction] =
          (newCounts[mainClass.toString()][subClass][direction] || 0) + 1
        return newCounts
      })

      setLastPressed({ mainClass, subClass, direction })
      setTimeout(() => setLastPressed(null), 1000)
    },
    [videoSrc, intersections.length, currentVideoIndex],
  )

  const handleUndo = useCallback(() => {
    if (log.length === 0) {
      setLastPressed(null)
      return
    }

    const lastEntry = log[log.length - 1]

    setCounts((prev) => {
      const newCounts = { ...prev }
      if (newCounts[lastEntry.mainClass.toString()] && newCounts[lastEntry.mainClass.toString()][lastEntry.subClass]) {
        newCounts[lastEntry.mainClass.toString()][lastEntry.subClass][lastEntry.direction] = Math.max(
          0,
          newCounts[lastEntry.mainClass.toString()][lastEntry.subClass][lastEntry.direction] - 1,
        )
      }
      return newCounts
    })

    const newLog = log.slice(0, -1)
    setLog(newLog)

    if (newLog.length > 0) {
      const newLastEntry = newLog[newLog.length - 1]
      setLastPressed({
        mainClass: newLastEntry.mainClass,
        subClass: newLastEntry.subClass,
        direction: newLastEntry.direction,
      })
    } else {
      setLastPressed(null)
    }
  }, [log])

  const handleClearVideo = useCallback(() => {
    setVideoSrc(null)
    setIntersections([])
    setCounts({})
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

  const groupDataByInterval = useCallback(
    (
      logEntries: VehicleLogEntry[],
      intervalSize: number = DATA_GROUPING_CONFIG.INTERVAL_SIZE_SECONDS,
    ): GroupedVehicleEntry[] => {
      if (logEntries.length === 0) return []

      const groups: Record<string, GroupedVehicleEntry> = {}

      const videoGroups: Record<number, VehicleLogEntry[]> = {}
      logEntries.forEach((entry) => {
        if (!videoGroups[entry.videoIndex]) {
          videoGroups[entry.videoIndex] = []
        }
        videoGroups[entry.videoIndex].push(entry)
      })

      Object.entries(videoGroups).forEach(([videoIndexStr, videoEntries]) => {
        const videoIndex = Number.parseInt(videoIndexStr)
        const timestamps = videoEntries.map((entry) => entry.timestamp)
        const minTime = Math.min(...timestamps)
        const maxTime = Math.max(...timestamps)

        const startInterval = Math.floor(minTime / intervalSize) * intervalSize
        const endInterval = Math.floor(maxTime / intervalSize) * intervalSize

        const videoRecordingStartTime = videoMetadata[videoIndex]?.recordingStartTime

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

          const vehicles: Record<string, Record<string, Record<string, number>>> = {}
          vehicleClassifications.forEach((mainClass) => {
            vehicles[mainClass.id.toString()] = {}
            mainClass.subClasses.forEach((subClass) => {
              vehicles[mainClass.id.toString()][subClass.name] = {
                North: 0,
                South: 0,
                East: 0,
                West: 0,
              }
            })
          })

          groups[groupKey] = {
            interval: intervalLabel,
            startTime: intervalStart,
            endTime: intervalEnd,
            vehicles,
            totalCount: 0,
            actualStartTime,
            actualEndTime,
            videoIndex,
          }
        }

        videoEntries.forEach((entry) => {
          const intervalStart = Math.floor(entry.timestamp / intervalSize) * intervalSize
          const groupKey = `${entry.videoIndex}-${intervalStart}`

          if (groups[groupKey]) {
            if (!groups[groupKey].vehicles[entry.mainClass.toString()]) {
              groups[groupKey].vehicles[entry.mainClass.toString()] = {}
            }
            if (!groups[groupKey].vehicles[entry.mainClass.toString()][entry.subClass]) {
              groups[groupKey].vehicles[entry.mainClass.toString()][entry.subClass] = {
                North: 0,
                South: 0,
                East: 0,
                West: 0,
              }
            }
            groups[groupKey].vehicles[entry.mainClass.toString()][entry.subClass][entry.direction]++
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

  const downloadCSV = useCallback((data: GroupedVehicleEntry[], filename: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (data.length === 0) {
          reject(new Error("No data to export"))
          return
        }

        // Create headers
        const headers = ["Time Interval"]
        vehicleClassifications.forEach((mainClass) => {
          mainClass.subClasses.forEach((subClass) => {
            ;["North", "South", "East", "West"].forEach((direction) => {
              headers.push(`Class ${mainClass.id} ${subClass.name} ${direction}`)
            })
          })
        })

        const csvRows = data.map((entry) => {
          const row = [entry.interval]
          vehicleClassifications.forEach((mainClass) => {
            mainClass.subClasses.forEach((subClass) => {
              ;["North", "South", "East", "West"].forEach((direction) => {
                const count = entry.vehicles[mainClass.id.toString()]?.[subClass.name]?.[direction] || 0
                row.push(count.toString())
              })
            })
          })
          return row.join(",")
        })

        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"

        document.body.appendChild(link)

        requestAnimationFrame(() => {
          try {
            link.click()
            setTimeout(() => {
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              resolve()
            }, 100)
          } catch (clickError) {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            reject(clickError)
          }
        })
      } catch (error) {
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

    setIsExporting(true)
    const grouped = groupDataByInterval(log)
    setGroupedData(grouped)
    setShowExportModal(true)
  }, [log, groupDataByInterval, isExporting])

  const handleExportComplete = useCallback(async () => {
    if (groupedData.length === 0) {
      setIsExporting(false)
      setShowExportModal(false)
      return
    }

    try {
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/:/g, "-")

      let filename: string
      if (Object.keys(videoMetadata).length > 0) {
        const firstVideoStartTime = videoMetadata[0]?.recordingStartTime
        if (firstVideoStartTime) {
          const recordingDate = firstVideoStartTime.toISOString().slice(0, 10)
          filename = `vehicle_counts_${recordingDate}_${timestamp}.csv`
        } else {
          filename = `vehicle_counts_${timestamp}.csv`
        }
      } else {
        filename = `vehicle_counts_${timestamp}.csv`
      }

      await downloadCSV(groupedData, filename)

      // Clear all data after successful export
      setVideoSrc(null)
      setIntersections([])
      setCounts({})
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
      setGroupedData([])
      clearStorage()
    } catch (error) {
      console.error("Failed to export CSV:", error)
      setIsExporting(false)
      return
    }

    setIsExporting(false)
    setShowExportModal(false)
  }, [groupedData, downloadCSV, videoMetadata, clearStorage])

  // Load data on mount
  useEffect(() => {
    const dataLoaded = loadFromStorage()
    setIsDataLoaded(true)
  }, [loadFromStorage])

  // Auto-save functionality
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
    isExporting,
  ])

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
        const existingMetadata = videoMetadata[currentVideoIndex]

        if (existingMetadata) {
          setIntersections(existingMetadata.intersections)
          setRecordingStartTime(existingMetadata.recordingStartTime)
        } else {
          const mostRecentVideoIndex = Math.max(0, currentVideoIndex - 1)
          const mostRecentMetadata = videoMetadata[mostRecentVideoIndex]

          if (mostRecentMetadata && mostRecentMetadata.intersections.length === 4) {
            setIntersections(mostRecentMetadata.intersections)
          } else {
            setIntersections([])
          }

          setRecordingStartTime(null)
          setShowTimeInputDialog(true)
        }

        setIsPlaying(false)
        setPlaybackRate(1)
        setCurrentTime(0)
        setDuration(0)
        setLastPressed(null)
      }
    },
    [currentVideoIndex, intersections, recordingStartTime, videoMetadata],
  )

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handleShowHelp = useCallback(() => {
    setShowVehicleSidebar(true)
  }, [])

  const handleIntersectionsSet = useCallback(
    (newIntersections: Intersection[]) => {
      setIntersections(newIntersections)
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

  if (!isDataLoaded) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading vehicle categorizer data...</p>
        </div>
      </div>
    )
  }

  const totalCounts = Object.values(counts).reduce((total, mainClassCounts) => {
    return (
      total +
      Object.values(mainClassCounts).reduce((subTotal, subClassCounts) => {
        return subTotal + Object.values(subClassCounts).reduce((dirTotal, count) => dirTotal + count, 0)
      }, 0)
    )
  }, 0)

  return (
    <>
      <main
        className={`h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col p-4 gap-0 overflow-hidden transition-all duration-300 ${showVehicleSidebar ? "pr-96" : ""}`}
      >
        <div className="flex-grow h-full min-h-0">
          <VideoPlayer
            ref={videoRef}
            videoSrc={videoSrc}
            onVideoSelect={handleVideoSelect}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            lastPressed={
              lastPressed ? { key: lastPressed.mainClass.toString(), direction: lastPressed.direction } : null
            }
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
            lastPressed={
              lastPressed ? { key: lastPressed.mainClass.toString(), direction: lastPressed.direction } : null
            }
            intersectionsSet={intersections.length === 4}
            totalCount={totalCounts}
            lastDirectionCount={0}
          />
        </div>
      </main>

      <VehicleCategorizerSidebar
        isOpen={showVehicleSidebar}
        onClose={() => setShowVehicleSidebar(false)}
        onVehicleCount={handleVehicleCount}
        onUndo={handleUndo}
        intersectionsSet={intersections.length === 4}
        canUndo={log.length > 0}
        counts={counts}
        lastPressed={lastPressed}
      />

      <ExportProgressModal
        isOpen={showExportModal}
        onComplete={handleExportComplete}
        totalEntries={log.length}
        groupedEntries={groupedData.length}
      />
    </>
  )
}
