"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Undo2 } from "lucide-react"

interface HelpSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCount?: (key: string) => void
  onUndo?: () => void
  intersectionsSet?: boolean
  canUndo?: boolean
}

const keyboardShortcuts = [
  {
    keys: ["1"],
    description: "Count Eastbound (North)",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    direction: "Eastbound",
  },
  {
    keys: ["2"],
    description: "Count Westbound (North)",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    direction: "Westbound",
  },
  {
    keys: ["3"],
    description: "Count Eastbound (South)",
    color: "bg-red-500",
    textColor: "text-red-600",
    direction: "Eastbound",
  },
  {
    keys: ["4"],
    description: "Count Westbound (South)",
    color: "bg-red-500",
    textColor: "text-red-600",
    direction: "Westbound",
  },
  {
    keys: ["5"],
    description: "Count Northbound (East)",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    direction: "Northbound",
  },
  {
    keys: ["6"],
    description: "Count Southbound (East)",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    direction: "Southbound",
  },
  {
    keys: ["7"],
    description: "Count Northbound (West)",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    direction: "Northbound",
  },
  {
    keys: ["8"],
    description: "Count Southbound (West)",
    color: "bg-amber-500",
    textColor: "text-amber-600",
    direction: "Southbound",
  },
  {
    keys: ["Space"],
    description: "Play/Pause video",
    color: "bg-gray-500",
    textColor: "text-gray-600",
    direction: null,
  },
  {
    keys: ["←", "→"],
    description: "Slow down / Speed up",
    color: "bg-gray-500",
    textColor: "text-gray-600",
    direction: null,
  },
  // Removed "Z" from here as it's now a dedicated button
  {
    keys: ["?"],
    description: "Toggle this help",
    color: "bg-purple-500",
    textColor: "text-purple-600",
    direction: null,
  },
]

const directionIcons = {
  Eastbound: <ArrowRight className="h-4 w-4" />,
  Westbound: <ArrowLeft className="h-4 w-4" />,
  Northbound: <ArrowUp className="h-4 w-4" />,
  Southbound: <ArrowDown className="h-4 w-4" />,
}

export default function HelpSidebar({
  isOpen,
  onClose,
  onCount,
  onUndo,
  intersectionsSet = false,
  canUndo = false,
}: HelpSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const handleShortcutClick = (keys: string[]) => {
    if (onCount && intersectionsSet && keys.length > 0) {
      const key = keys[0]
      if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
        onCount(key)
      }
    }
  }

  const handleUndoClick = () => {
    if (onUndo && canUndo) {
      onUndo()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-12" : "w-80"
        } animate-in slide-in-from-right duration-300`}
      >
        {/* Side Arrow Button */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false)
              } else {
                onClose()
              }
            }}
            className="h-16 w-8 rounded-l-lg rounded-r-none bg-white dark:bg-gray-800 border border-r-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-all duration-200"
            title={isCollapsed ? "Expand sidebar" : "Close help"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>

        <div className="flex flex-col h-full">
          {/* Header */}
          

          {!isCollapsed && (
            <>
              {/* Undo Button */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <Button
                  onClick={handleUndoClick}
                  disabled={!canUndo}
                  className={`w-full flex items-center justify-center gap-3 h-12 transition-all duration-200 ${
                    canUndo
                      ? "bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-md"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  title={canUndo ? "Click to undo last count (Z)" : "No counts to undo"}
                >
                  <Undo2 className="h-5 w-5" />
                  <span className="font-semibold">Undo Last Count</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-black/20 text-white rounded">Z</kbd>
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {keyboardShortcuts.map((shortcut, index) => {
                    const isCountingKey = ["1", "2", "3", "4", "5", "6", "7", "8"].includes(shortcut.keys[0])
                    const isClickable = isCountingKey && intersectionsSet && onCount

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-600 ${
                          isClickable
                            ? "hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer hover:scale-105 hover:shadow-md"
                            : "hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => {
                          if (isCountingKey && isClickable) {
                            handleShortcutClick(shortcut.keys)
                          }
                        }}
                        title={isCountingKey && isClickable ? `Click to count ${shortcut.description}` : undefined}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex gap-2">
                            {shortcut.keys.map((key, keyIndex) => (
                              <kbd
                                key={keyIndex}
                                className={`px-3 py-2 text-sm font-mono ${shortcut.color} text-white rounded shadow-md min-w-[2rem] text-center font-bold transition-transform duration-200 ${
                                  isClickable ? "hover:scale-110" : ""
                                }`}
                              >
                                {key}
                              </kbd>
                            ))}
                            {/* Direction Arrow Box */}
                            {shortcut.direction && (
                              <div
                                className={`px-3 py-2 text-sm font-mono ${shortcut.color} text-white rounded shadow-md min-w-[2rem] text-center font-bold transition-transform duration-200 flex items-center justify-center ${
                                  isClickable ? "hover:scale-110" : ""
                                }`}
                              >
                                {directionIcons[shortcut.direction as keyof typeof directionIcons]}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                            {shortcut.description}
                          </span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3 flex items-center gap-2">
                          {isClickable && <div className="text-xs text-blue-600 dark:text-blue-400">✨</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Reference */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm">Quick Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li>• Press number keys 1-8 to count pedestrians</li>
                    <li>
                      •{" "}
                      {intersectionsSet
                        ? "Click on counting shortcuts above to count with mouse"
                        : "Set up intersections first to enable mouse counting"}
                    </li>
                    <li>• Use Space bar to play/pause video</li>
                    <li>• Press Z to undo the last count {canUndo ? "(or click the undo button above)" : ""}</li>
                    <li>• Press ? to toggle this help sidebar</li>
                    <li>• Use arrow keys ← → to adjust playback speed</li>
                    <li>• When video ends, you can upload another video to continue counting</li>
                    <li>• All data from multiple videos will be combined in the export</li>
                    <li>• Supported formats: MP4, WebM, OGG</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
