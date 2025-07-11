"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react"

interface HelpSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const keyboardShortcuts = [
  { keys: ["1"], description: "Count Eastbound (North)", color: "bg-blue-500", textColor: "text-blue-600" },
  { keys: ["2"], description: "Count Westbound (North)", color: "bg-blue-500", textColor: "text-blue-600" },
  { keys: ["3"], description: "Count Eastbound (South)", color: "bg-red-500", textColor: "text-red-600" },
  { keys: ["4"], description: "Count Westbound (South)", color: "bg-red-500", textColor: "text-red-600" },
  { keys: ["5"], description: "Count Northbound (East)", color: "bg-emerald-500", textColor: "text-emerald-600" },
  { keys: ["6"], description: "Count Southbound (East)", color: "bg-emerald-500", textColor: "text-emerald-600" },
  { keys: ["7"], description: "Count Northbound (West)", color: "bg-amber-500", textColor: "text-amber-600" },
  { keys: ["8"], description: "Count Southbound (West)", color: "bg-amber-500", textColor: "text-amber-600" },
  { keys: ["Space"], description: "Play/Pause video", color: "bg-gray-500", textColor: "text-gray-600" },
  { keys: ["←", "→"], description: "Slow down / Speed up", color: "bg-gray-500", textColor: "text-gray-600" },
  { keys: ["Z"], description: "Undo last count", color: "bg-orange-500", textColor: "text-orange-600" },
  { keys: ["?"], description: "Toggle this help", color: "bg-purple-500", textColor: "text-purple-600" },
]

const directionIcons = {
  Eastbound: <ArrowRight className="h-4 w-4" />,
  Westbound: <ArrowLeft className="h-4 w-4" />,
  Northbound: <ArrowUp className="h-4 w-4" />,
  Southbound: <ArrowDown className="h-4 w-4" />,
}

export default function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
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

  if (!isOpen) return null

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-12" : "w-80"
        } animate-in slide-in-from-right duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <Keyboard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Keyboard Controls</h2>
              </div>
            )}
            <div className="flex items-center gap-2">
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
                className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                title={isCollapsed ? "Expand sidebar" : "Close help"}
              >
                {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex gap-2">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className={`px-3 py-2 text-sm font-mono ${shortcut.color} text-white rounded shadow-md min-w-[2rem] text-center font-bold`}
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                          {shortcut.description}
                        </span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
                        {shortcut.description.includes("Eastbound") && directionIcons["Eastbound"]}
                        {shortcut.description.includes("Westbound") && directionIcons["Westbound"]}
                        {shortcut.description.includes("Northbound") && directionIcons["Northbound"]}
                        {shortcut.description.includes("Southbound") && directionIcons["Southbound"]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Reference */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm">Quick Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li>• Press number keys 1-8 to count pedestrians</li>
                    <li>• Use Space bar to play/pause video</li>
                    <li>• Press Z to undo the last count</li>
                    <li>• Press ? to toggle this help sidebar</li>
                    <li>• Use arrow keys ← → to adjust playback speed</li>
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
