"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { HelpCircle, X, Keyboard, Mouse, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"

interface HelpMenuProps {
  isOpen: boolean
  onClose: () => void
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
    shortcuts: [{ keys: ["Z"], description: "Undo last count", color: "bg-orange-500", textColor: "text-orange-600" }],
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

export default function HelpMenu({ isOpen, onClose }: HelpMenuProps) {
  const [activeTab, setActiveTab] = useState<"controls" | "intersections">("controls")

  if (!isOpen) return null

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6" style={{ animation: "slideInUp 0.4s ease-out" }}>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-blue-600 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800">Help & Controls</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("controls")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "controls"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Keyboard className="h-4 w-4 inline mr-2" />
            Keyboard Controls
          </button>
          <button
            onClick={() => setActiveTab("intersections")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "intersections"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Mouse className="h-4 w-4 inline mr-2" />
            Intersection Guide
          </button>
        </div>

        {/* Controls Tab */}
        {activeTab === "controls" && (
          <div className="space-y-8">
            {keyboardShortcuts.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  {category.category}
                </h3>
                <div className="grid gap-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                      style={{ animation: `slideInUp 0.4s ease-out ${index * 50}ms both` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className={`px-3 py-1 text-sm font-mono ${shortcut.color} text-white rounded shadow-sm min-w-[2rem] text-center transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                        <span className="text-gray-700 font-medium">{shortcut.description}</span>
                      </div>
                      <div className="transition-transform duration-200 hover:scale-110">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Quick Reference</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Press number keys 1-8 (or numpad) to count pedestrians in different directions</li>
                <li>• Use Space to play/pause video playback</li>
                <li>• Press Z to undo the last count</li>
                <li>• Use arrow keys ← → to adjust playback speed</li>
                <li>• Click and drag on the scrub bar to seek through the video</li>
              </ul>
            </div>
          </div>
        )}

        {/* Intersections Tab */}
        {activeTab === "intersections" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intersection Color Guide</h3>
              <p className="text-gray-600 text-sm">
                Each intersection is color-coded to help you identify the correct counting keys
              </p>
            </div>

            {/* Visual Intersection Map */}
            <div className="relative bg-gray-100 rounded-lg p-8 mx-auto max-w-md aspect-square">
              <div className="absolute inset-4 border-2 border-gray-400 rounded-lg"></div>

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
                    <div className={`w-6 h-6 ${intersection.color} rounded-full border-2 border-white shadow-lg`}></div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                      {intersection.name.split(" ")[0]}
                    </div>
                  </div>
                )
              })}

              {/* Direction Labels */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                North
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                East
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                South
              </div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                West
              </div>
            </div>

            {/* Intersection Details */}
            <div className="grid gap-4">
              {intersectionColors.map((intersection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                  style={{ animation: `slideInUp 0.4s ease-out ${index * 100}ms both` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 ${intersection.color} rounded-full border-2 border-white shadow-sm transition-transform duration-200 hover:scale-110`}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">{intersection.name}</h4>
                      <p className="text-sm text-gray-600">Keys: {intersection.keys.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {intersection.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className={`px-3 py-1 text-sm font-mono ${intersection.color} text-white rounded shadow-sm min-w-[2rem] text-center transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">How to Use</h4>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>Load a video and click "Label Intersections"</li>
                <li>Click on each intersection point in the video (North, East, South, West)</li>
                <li>Use the corresponding number keys to count pedestrians</li>
                <li>Watch for the colored glow animation when you press keys</li>
                <li>Export your data when finished counting</li>
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
