"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Check, RotateCcw } from "lucide-react"

interface Intersection {
  id: string
  x: number
  y: number
  label: string
  color: string
}

interface VideoOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isVideoLoaded: boolean
  lastPressed: { key: string; direction: string } | null
  onIntersectionsSet: (intersections: Intersection[]) => void
}

const intersectionConfig = [
  { label: "North Intersection", color: "#3b82f6", bgColor: "bg-blue-500", textColor: "text-blue-600" },
  { label: "East Intersection", color: "#10b981", bgColor: "bg-emerald-500", textColor: "text-emerald-600" },
  { label: "South Intersection", color: "#ef4444", bgColor: "bg-red-500", textColor: "text-red-600" },
  { label: "West Intersection", color: "#f59e0b", bgColor: "bg-amber-500", textColor: "text-amber-600" },
]

export default function VideoOverlay({ videoRef, isVideoLoaded, lastPressed, onIntersectionsSet }: VideoOverlayProps) {
  const [intersections, setIntersections] = useState<Intersection[]>([])
  const [isLabeling, setIsLabeling] = useState(false)
  const [labelingStep, setLabelingStep] = useState(0)
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)
  const [redoingIndex, setRedoingIndex] = useState<number | null>(null)
  const [hoveredIntersection, setHoveredIntersection] = useState<string | null>(null)
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null)
  const [animationTimeouts, setAnimationTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    if (isVideoLoaded && intersections.length === 0 && !isLabeling && !showFinalConfirmation) {
      const timer = setTimeout(startLabeling, 500)
      return () => clearTimeout(timer)
    }
  }, [isVideoLoaded, intersections.length, isLabeling, showFinalConfirmation])

  const clearAnimationTimeout = useCallback((intersectionId: string) => {
    setAnimationTimeouts((prev) => {
      const newMap = new Map(prev)
      const existingTimeout = newMap.get(intersectionId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        newMap.delete(intersectionId)
      }
      return newMap
    })
  }, [])

  const setAnimationTimeout = useCallback((intersectionId: string, timeout: NodeJS.Timeout) => {
    setAnimationTimeouts((prev) => {
      const newMap = new Map(prev)
      newMap.set(intersectionId, timeout)
      return newMap
    })
  }, [])

  useEffect(() => {
    if (lastPressed && intersections.length === 4) {
      const intersection = getIntersectionForKey(lastPressed.key)
      if (intersection) {
        const intersectionId = intersection.id

        clearAnimationTimeout(intersectionId)
        setActiveAnimation(intersectionId)

        const newTimeout = setTimeout(() => {
          setActiveAnimation(null)
          clearAnimationTimeout(intersectionId)
        }, 4000)

        setAnimationTimeout(intersectionId, newTimeout)
      }
    }
  }, [lastPressed, intersections.length, clearAnimationTimeout, setAnimationTimeout])

  useEffect(() => {
    return () => {
      animationTimeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLabeling || !videoRef.current || showFinalConfirmation) return

    const videoRect = videoRef.current.getBoundingClientRect()
    const x = ((e.clientX - videoRect.left) / videoRect.width) * 100
    const y = ((e.clientY - videoRect.top) / videoRect.height) * 100

    const config = intersectionConfig[labelingStep]
    const newIntersection: Intersection = {
      id: `intersection-${labelingStep}`,
      x,
      y,
      label: config.label,
      color: config.color,
    }

    let updatedIntersections: Intersection[]

    if (redoingIndex !== null) {
      updatedIntersections = [...intersections]
      updatedIntersections[redoingIndex] = newIntersection
      setRedoingIndex(null)
      setIsLabeling(false)
      setShowFinalConfirmation(true)
    } else {
      updatedIntersections = [...intersections, newIntersection]
      if (labelingStep < 3) {
        setLabelingStep(labelingStep + 1)
      } else {
        setIsLabeling(false)
        setShowFinalConfirmation(true)
      }
    }

    setIntersections(updatedIntersections)
  }

  const handleIntersectionRedo = (index: number) => {
    if (!showFinalConfirmation) return
    setRedoingIndex(index)
    setLabelingStep(index)
    setIsLabeling(true)
    setShowFinalConfirmation(false)
  }

  const confirmAllPoints = () => {
    setShowFinalConfirmation(false)
    setLabelingStep(0)
    setRedoingIndex(null)
    setActiveAnimation(null)
    onIntersectionsSet(intersections)
  }

  const startLabeling = () => {
    setIntersections([])
    setIsLabeling(true)
    setLabelingStep(0)
    setShowFinalConfirmation(false)
    setRedoingIndex(null)
    setActiveAnimation(null)
    onIntersectionsSet([])
  }

  const getIntersectionForKey = (key: string) => {
    const keyToIntersectionIndex: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 2,
      "4": 2,
      "5": 1,
      "6": 1,
      "7": 3,
      "8": 3,
    }
    const index = keyToIntersectionIndex[key]
    return intersections[index]
  }

  const currentConfig = intersectionConfig[labelingStep]

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {isVideoLoaded && (
        <div
          className="absolute top-4 left-4 pointer-events-auto z-30"
          onMouseEnter={() => setHoveredIntersection("label-button")}
          onMouseLeave={() => setHoveredIntersection(null)}
        >
          <Button
            data-label-intersections
            onClick={startLabeling}
            className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl ${
              !isLabeling && !showFinalConfirmation && intersections.length === 4
                ? hoveredIntersection === "label-button"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
                : !isLabeling && !showFinalConfirmation
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Label Intersections
          </Button>
        </div>
      )}

      {isLabeling && !showFinalConfirmation && (
        <div
          className="absolute inset-0 cursor-crosshair pointer-events-auto bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={handleVideoClick}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-white/20 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${currentConfig.bgColor} shadow-sm animate-pulse`} />
                <h3 className="text-lg font-semibold text-gray-800">
                  {redoingIndex !== null ? `Redo ${currentConfig.label}` : `Step ${labelingStep + 1} of 4`}
                </h3>
              </div>
              <p className={`text-base font-medium ${currentConfig.textColor} mb-2`}>
                Click to {redoingIndex !== null ? "replace" : "mark"}: {currentConfig.label}
              </p>
              <p className="text-sm text-gray-600">Click anywhere on the video to place the marker</p>
            </div>
          </div>
        </div>
      )}

      {showFinalConfirmation && (
        <div className="absolute inset-0 pointer-events-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-800">Review Intersection Points</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                All 4 intersections have been marked. Click the redo button next to any point to adjust it, or confirm
                to continue.
              </p>

              <div className="space-y-3 mb-6">
                {intersections.map((intersection, index) => {
                  const config = intersectionConfig[index]
                  return (
                    <div
                      key={intersection.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 animate-in slide-in-from-left duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${config.bgColor} shadow-sm flex-shrink-0`} />
                        <span className="font-medium text-gray-700 truncate">{intersection.label}</span>
                      </div>
                      <Button
                        onClick={() => handleIntersectionRedo(index)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 flex-shrink-0 ml-3 h-8 px-3 hover:scale-105 transition-transform duration-200"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span className="text-xs">Redo</span>
                      </Button>
                    </div>
                  )
                })}
              </div>

              <Button
                onClick={confirmAllPoints}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-12 hover:scale-105 transition-all duration-200"
              >
                <Check className="h-4 w-4" />
                Confirm All Points
              </Button>
            </div>
          </div>
        </div>
      )}

      {intersections.map((intersection, index) => {
        const config = intersectionConfig[index]
        const isHovered = hoveredIntersection === intersection.id
        const isLabelingMode = isLabeling || showFinalConfirmation
        const isAnimating = activeAnimation === intersection.id

        return (
          <div
            key={intersection.id}
            className={`absolute ${
              isLabelingMode ? "pointer-events-none z-20" : "pointer-events-auto group cursor-pointer z-20"
            }`}
            style={{
              left: `${intersection.x}%`,
              top: `${intersection.y}%`,
              animation: `fadeInScale 0.6s ease-out ${index * 150}ms both`,
            }}
            onMouseEnter={() => !isLabelingMode && setHoveredIntersection(intersection.id)}
            onMouseLeave={() => !isLabelingMode && setHoveredIntersection(null)}
          >
            {isAnimating && (
              <div
                className="absolute w-12 h-12 rounded-full pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  backgroundColor: config.color,
                  transform: "translate(-50%, -50%)",
                  animation: "breatheGlowContinuous 1.2s ease-in-out infinite",
                  opacity: 0.6,
                }}
              />
            )}

            <div
              className="absolute w-8 h-8 rounded-full transition-all duration-300 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) scale(${isHovered || isAnimating ? 1.25 : 1})`,
                backgroundColor: config.color,
                opacity: isHovered || isAnimating ? 0.5 : 0.3,
              }}
            />

            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) scale(${isHovered || isAnimating ? 1.25 : 1})`,
                backgroundColor: config.color,
              }}
            />

            <div
              className={`absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out ${
                isLabelingMode || isHovered || isAnimating
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-2 scale-95"
              }`}
            >
              <div className="bg-black/90 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg backdrop-blur-sm">
                {intersection.label.split(" ")[0]}
              </div>
            </div>
          </div>
        )
      })}

      {intersections.length > 0 && intersections.length < 4 && !showFinalConfirmation && redoingIndex === null && (
        <div
          className="absolute bottom-4 left-4 pointer-events-none z-20"
          style={{ animation: "slideInUp 0.5s ease-out" }}
        >
          <div className="bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm border border-white/10">
            <div className="text-sm font-medium mb-2">Progress: {intersections.length}/4 intersections marked</div>
            <div className="flex gap-2">
              {intersectionConfig.map((config, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full border border-white/30 transition-all duration-500 ease-out ${
                    index < intersections.length ? config.bgColor : "bg-gray-600"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transform: index < intersections.length ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
