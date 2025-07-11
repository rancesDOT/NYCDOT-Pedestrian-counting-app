"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X, Keyboard, Mouse, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"

interface HelpPopupProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

const keyboardShortcuts = [
  {
    category: "Counting Controls",
    shortcuts: [
      { keys: ["1"], description: "Count Eastbound (North)", color: "bg-blue-500", textColor: "text-blue-600" },
      { keys: ["2"], description: "Count Westbound (North)", color: "bg-blue-500", textColor: "text-blue-600" },
      { keys: ["3"], description: "Count Eastbound (South)", color: "bg-red-500", textColor: "text-red-600" },
      { keys: ["4"], description: "Count Westbound (South)", color: "bg-red-500", textColor: "text-red-600" },
      { keys: ["5"], description: "Count Northbound (East)", color: "bg-emerald-500", textColor: "text-emerald-600" },
      { keys: ["6"], description: "Count Southbound (East)", color: "bg-emerald-500", textColor: "text-emerald-600" },
      { keys: ["7"], description: "Count Northbound (West)", color: "bg-amber-500", textColor: "text-amber-600" },
      { keys: ["8"], description: "Count Southbound (West)", color: "bg-amber-500", textColor: "text-amber-600" },
    ],
  },
  {
    category: "Playback Controls",
    shortcuts: [
      { keys: ["Space"], description: "Play/Pause video", color: "bg-gray-500", textColor: "text-gray-600" },
      { keys: ["←", "→"], description: "Slow down / Speed up", color: "bg-gray-500", textColor: "text-gray-600" },
    ],
  },
  {
    category: "Action Controls",
    shortcuts: [
      { keys: ["Z"], description: "Undo last count", color: "bg-orange-500", textColor: "text-orange-600" },
      { keys: ["?"], description: "Show this help", color: "bg-purple-500", textColor: "text-purple-600" },
    ],
  },
]

const intersectionColors = [
  { name: "North Intersection", color: "bg-blue-500", textColor: "text-blue-600", keys: ["1", "2"] },
  { name: "East Intersection", color: "bg-emerald-500", textColor: "text-emerald-600", keys: ["5", "6"] },
  { name: "South Intersection", color: "bg-red-500", textColor: "text-red-600", keys: ["3", "4"] },
  { name: "West Intersection", color: "bg-amber-500", textColor: "text-amber-600", keys: ["7", "8"] },
]

const directionIcons = {
  Eastbound: <ArrowRight className="h-4 w-4" />,
  Westbound: <ArrowLeft className="h-4 w-4" />,
  Northbound: <ArrowUp className="h-4 w-4" />,
  Southbound: <ArrowDown className="h-4 w-4" />,
}

export default function HelpPopup({ isOpen, onClose, triggerRef }: HelpPopupProps) {
  const [activeTab, setActiveTab] = useState<"controls" | "intersections">("controls")
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current && popupRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const popupRect = popupRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let top = triggerRect.top - popupRect.height - 10
      let left = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2

      // Adjust if popup goes off screen
      if (top < 10) {
        top = triggerRect.bottom + 10
      }
      if (left < 10) {
        left = 10
      }
      if (left + popupRect.width > viewportWidth - 10) {
        left = viewportWidth - popupRect.width - 10
      }

      setPosition({ top, left })
    }
  }, [isOpen, triggerRef])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200" />

      {/* Popup */}
      <div
        ref={popupRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: position.top,
          left: position.left,
          maxWidth: "min(90vw, 900px)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Help & Controls</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab("controls")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "controls"
                  ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-700"
                  : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              <Keyboard className="h-4 w-4 inline mr-2" />
              Keyboard Controls
            </button>
            <button
              onClick={() => setActiveTab("intersections")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "intersections"
                  ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-700"
                  : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              <Mouse className="h-4 w-4 inline mr-2" />
              Intersection Guide
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Controls Tab */}
            {activeTab === "controls" && (
              <div className="space-y-6">
                {keyboardShortcuts.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1">
                      {category.category}
                    </h3>
                    <div className="grid gap-2">
                      {category.shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <kbd
                                  key={keyIndex}
                                  className={`px-2 py-1 text-xs font-mono ${shortcut.color} text-white rounded shadow-sm min-w-[1.5rem] text-center`}
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                              {shortcut.description}
                            </span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {shortcut.description.includes("Eastbound") && directionIcons["Eastbound"]}
                            {shortcut.description.includes("Westbound") && directionIcons["Westbound"]}
                            {shortcut.description.includes("Northbound") && directionIcons["Northbound"]}
                            {shortcut.description.includes("Southbound") && directionIcons["Southbound"]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Quick Reference */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">Quick Reference</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Press number keys 1-8 (or numpad) to count pedestrians in different directions</li>
                    <li>• Use Space to play/pause video playback</li>
                    <li>• Press Z to undo the last count</li>
                    <li>• Press ? to show/hide this help popup</li>
                    <li>• Use arrow keys ← → to adjust playback speed</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Intersections Tab */}
            {activeTab === "intersections" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
                    Intersection Color Guide
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Each intersection is color-coded to help you identify the correct counting keys
                  </p>
                </div>

                {/* Visual Intersection Map */}
                <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mx-auto max-w-xs aspect-square">
                  <div className="absolute inset-3 border-2 border-gray-400 dark:border-gray-500 rounded-lg"></div>

                  {/* Intersection Points */}
                  {intersectionColors.map((intersection, index) => {
                    const positions = [
                      { top: "10%", left: "50%", transform: "translate(-50%, -50%)" }, // North
                      { top: "50%", right: "10%", transform: "translate(50%, -50%)" }, // East
                      { bottom: "10%", left: "50%", transform: "translate(-50%, 50%)" }, // South
                      { top: "50%", left: "10%", transform: "translate(-50%, -50%)" }, // West
                    ]

                    return (
                      <div key={index} className="absolute" style={positions[index]}>
                        <div
                          className={`w-4 h-4 ${intersection.color} rounded-full border border-white shadow-sm`}
                        ></div>
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {intersection.name.split(" ")[0]}
                        </div>
                      </div>
                    )
                  })}

                  {/* Direction Labels */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    North
                  </div>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    East
                  </div>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    South
                  </div>
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    West
                  </div>
                </div>

                {/* Intersection Details */}
                <div className="grid gap-2">
                  {intersectionColors.map((intersection, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 ${intersection.color} rounded-full border border-white shadow-sm`} />
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{intersection.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Keys: {intersection.keys.join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {intersection.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className={`px-2 py-1 text-xs font-mono ${intersection.color} text-white rounded shadow-sm min-w-[1.5rem] text-center`}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Usage Instructions */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm">How to Use</h4>
                  <ol className="text-xs text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                    <li>Load a video and click "Label Intersections"</li>
                    <li>Click on each intersection point in the video (North, East, South, West)</li>
                    <li>Use the corresponding number keys to count pedestrians</li>
                    <li>Watch for the colored glow animation when you press keys</li>
                    <li>Export your data when finished counting</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
