"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, GripVertical, Trash2 } from "lucide-react"

interface VideoOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>
  onIntersectionsSet: (intersections: IntersectionPoint[]) => void
  onCancelLabeling: () => void
  isLabelingMode: boolean
  initialIntersections?: IntersectionPoint[]
}

export interface IntersectionPoint {
  id: string
  x: number
  y: number
  direction: "North" | "East" | "South" | "West" | null
}

const INTERSECTION_COLORS: { [key: string]: string } = {
  North: "bg-blue-500",
  East: "bg-emerald-500",
  South: "bg-red-500",
  West: "bg-amber-500",
}

export default function VideoOverlay({
  videoRef,
  onIntersectionsSet,
  onCancelLabeling,
  isLabelingMode,
  initialIntersections = [],
}: VideoOverlayProps) {
  const [intersections, setIntersections] = useState<IntersectionPoint[]>(initialIntersections)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIntersections(initialIntersections)
  }, [initialIntersections])

  const getRelativeCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!overlayRef.current) return { x: 0, y: 0 }
    const rect = overlayRef.current.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x, y }
  }, [])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isLabelingMode || draggingId) return

      const { x, y } = getRelativeCoordinates(e.clientX, e.clientY)

      if (intersections.length < 4) {
        const newId = `point-${Date.now()}`
        setIntersections((prev) => [...prev, { id: newId, x, y, direction: null }])
      }
    },
    [isLabelingMode, draggingId, intersections.length, getRelativeCoordinates],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (!isLabelingMode) return
      e.stopPropagation()
      const { clientX, clientY } = e
      const point = intersections.find((p) => p.id === id)
      if (point && overlayRef.current) {
        const rect = overlayRef.current.getBoundingClientRect()
        setOffset({
          x: clientX - (point.x * rect.width + rect.left),
          y: clientY - (point.y * rect.height + rect.top),
        })
        setDraggingId(id)
      }
    },
    [isLabelingMode, intersections],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !isLabelingMode) return
      const { x, y } = getRelativeCoordinates(e.clientX - offset.x, e.clientY - offset.y)
      setIntersections((prev) =>
        prev.map((p) =>
          p.id === draggingId ? { ...p, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } : p,
        ),
      )
    },
    [draggingId, isLabelingMode, offset, getRelativeCoordinates],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  useEffect(() => {
    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingId, handleMouseMove, handleMouseUp])

  const assignDirection = useCallback((id: string, direction: IntersectionPoint["direction"]) => {
    setIntersections((prev) =>
      prev.map((p) => (p.id === id ? { ...p, direction: p.direction === direction ? null : direction } : p)),
    )
  }, [])

  const handleDelete = useCallback((id: string) => {
    setIntersections((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleConfirm = useCallback(() => {
    const assignedIntersections = intersections.filter((p) => p.direction !== null)
    if (assignedIntersections.length === 4) {
      onIntersectionsSet(assignedIntersections)
    } else {
      alert("Please assign a unique direction (North, East, South, West) to all 4 points.")
    }
  }, [intersections, onIntersectionsSet])

  const handleCancel = useCallback(() => {
    setIntersections(initialIntersections) // Revert to initial state
    onCancelLabeling()
  }, [initialIntersections, onCancelLabeling])

  const directionsAvailable = ["North", "East", "South", "West"] as const
  const assignedDirections = new Set(intersections.map((p) => p.direction).filter(Boolean))

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 z-10 ${isLabelingMode ? "cursor-crosshair" : "pointer-events-none"}`}
      onClick={handleOverlayClick}
    >
      {intersections.map((point) => (
        <div
          key={point.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        >
          <div
            className={`relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors duration-200 ${
              point.direction ? INTERSECTION_COLORS[point.direction] : "bg-gray-400"
            } ${isLabelingMode ? "cursor-grab active:cursor-grabbing" : ""}`}
            onMouseDown={isLabelingMode ? (e) => handleMouseDown(e, point.id) : undefined}
          >
            {isLabelingMode && (
              <GripVertical className="h-4 w-4 text-white absolute -top-5 left-1/2 -translate-x-1/2" />
            )}
            {point.direction && <span className="text-white text-xs font-bold">{point.direction.charAt(0)}</span>}
            {isLabelingMode && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 text-red-500 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(point.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isLabelingMode && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-wrap gap-1 p-1 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
              {directionsAvailable.map((dir) => (
                <Button
                  key={dir}
                  variant={point.direction === dir ? "default" : "outline"}
                  size="sm"
                  className={`h-7 text-xs ${point.direction === dir ? INTERSECTION_COLORS[dir] : ""} ${
                    assignedDirections.has(dir) && point.direction !== dir ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!(assignedDirections.has(dir) && point.direction !== dir)) {
                      assignDirection(point.id, dir)
                    }
                  }}
                  disabled={assignedDirections.has(dir) && point.direction !== dir}
                >
                  {dir.charAt(0)}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}

      {isLabelingMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleConfirm}
            disabled={intersections.filter((p) => p.direction !== null).length !== 4}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Check className="h-5 w-5 mr-2" />
            Confirm
          </Button>
          <Button onClick={handleCancel} variant="outline" className="bg-red-500 hover:bg-red-600 text-white">
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
