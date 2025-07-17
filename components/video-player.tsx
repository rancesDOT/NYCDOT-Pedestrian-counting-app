"use client"

import type React from "react"

import { useRef, useEffect, useCallback } from "react"

interface VideoPlayerProps {
  videoSrc: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  isPlaying: boolean
  playbackRate: number
  onLoadedMetadata: () => void
  onTimeUpdate: () => void
  onEnded: () => void
  onVideoSelect: (file: File | null) => void
}

export default function VideoPlayer({
  videoSrc,
  videoRef,
  isPlaying,
  playbackRate,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onVideoSelect,
}: VideoPlayerProps) {
  const localFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate, videoRef])

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((e) => console.error("Error playing video:", e))
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying, videoRef])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null
      onVideoSelect(file)
      // Reset the input value to allow selecting the same file again
      if (localFileInputRef.current) {
        localFileInputRef.current.value = ""
      }
    },
    [onVideoSelect],
  )

  return (
    <>
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          className="w-full h-full object-contain"
          controls={false} // We use custom controls
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {/* This div acts as a placeholder when no video is loaded.
              The actual file input is handled by the parent component (PedestrianCounterPage)
              and triggered by a button there. */}
        </div>
      )}
      {/* Hidden input for direct file selection, if needed, though parent handles it */}
      <input
        type="file"
        ref={localFileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/mp4,video/webm,video/ogg,video/x-msvideo,.avi"
      />
    </>
  )
}
