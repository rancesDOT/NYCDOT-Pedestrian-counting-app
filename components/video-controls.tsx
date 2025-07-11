"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Rewind, FastForward, HelpCircle } from "lucide-react"
import ControlsPanel from "./controls-panel"

interface VideoControlsProps {
  isPlaying: boolean
  playbackRate: number
  onTogglePlay: () => void
  onChangePlaybackRate: (rate: number) => void
  isVideoLoaded: boolean
  onUndo: () => void
  onFinish: () => void
  onClearVideo: () => void
  canUndo: boolean
  canFinish: boolean
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  onShowHelp?: () => void
  lastPressed: { key: string; direction: string } | null
  intersectionsSet: boolean
  totalCount: number
  lastDirectionCount: number
}

export default function VideoControls({
  isPlaying,
  playbackRate,
  onTogglePlay,
  onChangePlaybackRate,
  isVideoLoaded,
  onUndo,
  onFinish,
  onClearVideo,
  canUndo,
  canFinish,
  currentTime,
  duration,
  onSeek,
  onShowHelp,
  lastPressed,
  intersectionsSet,
  totalCount,
  lastDirectionCount,
}: VideoControlsProps) {
  const [isScrubbing, setIsScrubbing] = useState(false)
  const scrubBarRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)

  const handleSlowDown = () => {
    const newRate = Math.max(0.25, playbackRate - 0.25)
    onChangePlaybackRate(newRate)
  }

  const handleSpeedUp = () => {
    const newRate = Math.min(4, playbackRate + 0.25)
    onChangePlaybackRate(newRate)
  }

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00"
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleScrub = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!scrubBarRef.current || !isVideoLoaded || duration === 0) return

      const rect = scrubBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, clickX / rect.width))
      const newTime = percentage * duration
      onSeek(newTime)
    },
    [isVideoLoaded, duration, onSeek],
  )

  const handleScrubStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isVideoLoaded) return
      e.preventDefault()
      e.stopPropagation()
      setIsScrubbing(true)
      handleScrub(e)
    },
    [isVideoLoaded, handleScrub],
  )

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        handleScrub(e)
      }
    }
    const handleMouseUp = () => {
      if (isScrubbing) {
        handleScrubEnd()
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isScrubbing, handleScrub, handleScrubEnd])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className="shadow-lg rounded-t-none rounded-b-lg border-t-0">
      <CardContent className="p-4 flex flex-col gap-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
        <div
          className="relative w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-full cursor-pointer group transition-all duration-200 hover:h-3"
          ref={scrubBarRef}
          onMouseDown={handleScrubStart}
        >
          <div
            className="absolute h-full bg-primary rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md transition-all duration-200 group-hover:scale-125 group-hover:shadow-lg"
            style={{
              left: `${progressPercentage}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              boxShadow: isScrubbing ? "0 0 12px rgba(59, 130, 246, 0.5)" : undefined,
            }}
          />
        </div>

        <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSlowDown}
              disabled={!isVideoLoaded || playbackRate <= 0.25}
              className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
              title="Slow down (←)"
            >
              <Rewind className="h-5 w-5 transition-transform duration-200" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onTogglePlay}
              disabled={!isVideoLoaded}
              className="flex-1 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-accent transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 font-semibold text-base hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-5 w-5 mr-3 transition-transform duration-200" />
                  <span className="leading-none">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-3 transition-transform duration-200" />
                  <span className="leading-none">Play</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSpeedUp}
              disabled={!isVideoLoaded || playbackRate >= 4}
              className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
              title="Speed up (→)"
            >
              <FastForward className="h-5 w-5 transition-transform duration-200" />
            </Button>

            <div className="min-w-[120px] text-center bg-white dark:bg-slate-700 rounded-lg px-3 py-3 border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:shadow-md">
              <div className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300 leading-none">
                {playbackRate.toFixed(2)}x
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Speed</div>
            </div>

            <Button
              ref={helpButtonRef}
              variant="outline"
              size="icon"
              onClick={onShowHelp}
              data-help-trigger
              className="w-12 h-12 flex items-center justify-center hover:bg-accent bg-white dark:bg-slate-700 transition-all duration-200 shadow-sm border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg"
              title="Help (?)"
            >
              <HelpCircle className="h-5 w-5 transition-transform duration-200" />
            </Button>
          </div>

          <div className="flex items-center flex-1 justify-end">
            <ControlsPanel
              onUndo={onUndo}
              onFinish={onFinish}
              onClearVideo={onClearVideo}
              canUndo={canUndo}
              canFinish={canFinish}
              lastPressed={lastPressed}
              showArrowIndicator={isVideoLoaded && intersectionsSet}
              totalCount={totalCount}
              lastDirectionCount={lastDirectionCount}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
