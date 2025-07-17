"use client"

import type React from "react"

import { forwardRef, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Check, MoveHorizontal, MoveVertical } from "lucide-react"
import VideoOverlay from "@/components/video-overlay"
import FileVideo from "lucide-react" // Declared the FileVideo variable

interface VideoPlayerProps {
  videoSrc: string | null
  onVideoSelect: (file: File | null) => void // Changed to accept File object
  onPlay: () => void
  onPause: () => void
  lastPressed: { key: string; direction: string } | null
  onIntersectionsSet: (intersections: { id: string; x: number; y: number; label: string }[]) => void
  onTimeUpdate: () => void
  onLoadedMetadata: () => void
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    { videoSrc, onVideoSelect, onPlay, onPause, lastPressed, onIntersectionsSet, onTimeUpdate, onLoadedMetadata },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false)
    const [currentIntersection, setCurrentIntersection] = useState<{
      id: string
      x: number
      y: number
      label: string
    } | null>(null)
    const [intersections, setIntersections] = useState<{ id: string; x: number; y: number; label: string }[]>([])
    const videoContainerRef = useRef<HTMLDivElement>(null)

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
          onVideoSelect(file) // Pass the file object
          setIntersections([]) // Reset intersections for new video
        }
      },
      [onVideoSelect],
    )

    const handleMouseDown = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (intersections.length >= 4) return

        setIsDragging(true)
        const rect = videoContainerRef.current?.getBoundingClientRect()
        if (rect) {
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          const newId = `intersection-${intersections.length + 1}`
          const newLabel = `Point ${intersections.length + 1}`
          setCurrentIntersection({ id: newId, x, y, label: newLabel })
        }
      },
      [intersections.length],
    )

    const handleMouseMove = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !currentIntersection) return

        const rect = videoContainerRef.current?.getBoundingClientRect()
        if (rect) {
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          setCurrentIntersection((prev) => (prev ? { ...prev, x, y } : null))
        }
      },
      [isDragging, currentIntersection],
    )

    const handleMouseUp = useCallback(() => {
      if (isDragging && currentIntersection) {
        setIntersections((prev) => {
          const newIntersections = [...prev, currentIntersection]
          onIntersectionsSet(newIntersections)
          return newIntersections
        })
        setCurrentIntersection(null)
      }
      setIsDragging(false)
    }, [isDragging, currentIntersection, onIntersectionsSet])

    const handleClearIntersections = useCallback(() => {
      setIntersections([])
      onIntersectionsSet([])
    }, [onIntersectionsSet])

    const handleConfirmIntersections = useCallback(() => {
      // Logic to confirm intersections, perhaps close a setup mode
      // For now, just log and indicate they are set
      console.log("Intersections confirmed:", intersections)
    }, [intersections])

    const renderIntersectionPoint = (point: { id: string; x: number; y: number; label: string }) => (
      <div
        key={point.id}
        className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold"
        style={{ left: point.x - 8, top: point.y - 8 }}
        title={point.label}
      >
        {point.id.split("-")[1]}
      </div>
    )

    const renderLine = (p1: { x: number; y: number }, p2: { x: number; y: number }, label: string) => {
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
      const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2

      return (
        <div
          key={`${p1.id}-${p2.id}`}
          className="absolute bg-red-500 opacity-70"
          style={{
            left: p1.x,
            top: p1.y,
            width: length,
            height: "2px",
            transformOrigin: "0 0",
            transform: `rotate(${angle}deg)`,
          }}
        >
          <span
            className="absolute text-xs text-white bg-red-600 px-1 py-0.5 rounded"
            style={{
              left: length / 2 - 20, // Adjust to center label
              top: -15, // Position above the line
              transform: `rotate(${-angle}deg)`, // Counter-rotate label
            }}
          >
            {label}
          </span>
        </div>
      )
    }

    const renderDirectionArrow = (p1: { x: number; y: number }, p2: { x: number; y: number }, direction: string) => {
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2

      let arrowRotation = 0
      let arrowComponent = null

      // Determine arrow direction based on line orientation and label
      if (direction === "North" || direction === "South") {
        arrowComponent = <MoveVertical className="h-4 w-4" />
        if (direction === "North")
          arrowRotation = -90 // Arrow pointing up
        else arrowRotation = 90 // Arrow pointing down
      } else if (direction === "East" || direction === "West") {
        arrowComponent = <MoveHorizontal className="h-4 w-4" />
        if (direction === "East")
          arrowRotation = 0 // Arrow pointing right
        else arrowRotation = 180 // Arrow pointing left
      }

      return (
        <div
          key={`arrow-${p1.id}-${p2.id}`}
          className="absolute text-green-400"
          style={{
            left: midX - 10, // Center arrow
            top: midY - 10, // Center arrow
            transform: `rotate(${arrowRotation}deg)`,
          }}
        >
          {arrowComponent}
        </div>
      )
    }

    const isIntersectionsSet = intersections.length === 4

    return (
      <Card className="w-full h-full flex flex-col">
        <CardContent className="flex-grow p-0 relative overflow-hidden">
          {!videoSrc ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <FileVideo className="h-16 w-16 mb-4" />
              <p className="text-lg mb-4">No video loaded</p>
              <input
                id="video-upload"
                type="file"
                accept="video/mp4, video/webm, video/ogg, video/x-msvideo, .avi" // Added .avi
                className="hidden"
                onChange={handleFileChange}
              />
              <Button onClick={() => document.getElementById("video-upload")?.click()}>Select Video</Button>
            </div>
          ) : (
            <div
              ref={videoContainerRef}
              className="relative w-full h-full bg-black flex items-center justify-center"
              onMouseDown={isIntersectionsSet ? undefined : handleMouseDown}
              onMouseMove={isIntersectionsSet ? undefined : handleMouseMove}
              onMouseUp={isIntersectionsSet ? undefined : handleMouseUp}
              onMouseLeave={isIntersectionsSet ? undefined : handleMouseUp} // End drag if mouse leaves
            >
              <video
                ref={ref}
                src={videoSrc}
                className="max-w-full max-h-full object-contain"
                onPlay={onPlay}
                onPause={onPause}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                controls={false} // Controls are handled by VideoControls component
              />

              <VideoOverlay
                intersections={intersections}
                currentIntersection={currentIntersection}
                lastPressed={lastPressed}
              />

              {/* Intersection setup UI */}
              {!isIntersectionsSet && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                  <h3 className="text-xl font-semibold mb-2">Set up Intersection Points</h3>
                  <p className="text-sm text-center mb-4">
                    Click on the video to mark 4 points that define your intersection.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleClearIntersections} variant="destructive" size="sm">
                      <X className="h-4 w-4 mr-2" /> Clear Points
                    </Button>
                    <Button onClick={handleConfirmIntersections} disabled={intersections.length !== 4} size="sm">
                      <Check className="h-4 w-4 mr-2" /> Confirm Points
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

VideoPlayer.displayName = "VideoPlayer"

export default VideoPlayer
