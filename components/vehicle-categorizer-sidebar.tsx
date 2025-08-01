"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronRight, Undo2, X, Car, Truck, Bus } from "lucide-react"
import { vehicleClassifications, getVehicleClassById } from "@/lib/vehicle-classifications"

interface VehicleCategorizerSidebarProps {
  isOpen: boolean
  onClose: () => void
  onVehicleCount: (mainClass: number, subClass: string, direction: string) => void
  onUndo: () => void
  intersectionsSet: boolean
  canUndo: boolean
  counts: Record<string, Record<string, Record<string, number>>>
  lastPressed: { mainClass: number; subClass: string; direction: string } | null
}

type SelectionStep = "main" | "sub" | "direction"

const directionIcons = {
  North: <ArrowUp className="h-4 w-4" />,
  South: <ArrowDown className="h-4 w-4" />,
  East: <ArrowRight className="h-4 w-4" />,
  West: <ArrowLeft className="h-4 w-4" />,
}

const getClassIcon = (classId: number) => {
  switch (classId) {
    case 1:
      return <Car className="h-5 w-5" />
    case 2:
      return <Car className="h-5 w-5" />
    case 3:
      return <Truck className="h-5 w-5" />
    case 4:
      return <Bus className="h-5 w-5" />
    case 5:
      return <Truck className="h-5 w-5" />
    case 6:
      return <Truck className="h-5 w-5" />
    default:
      return <Car className="h-5 w-5" />
  }
}

export default function VehicleCategorizerSidebar({
  isOpen,
  onClose,
  onVehicleCount,
  onUndo,
  intersectionsSet,
  canUndo,
  counts,
  lastPressed,
}: VehicleCategorizerSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentStep, setCurrentStep] = useState<SelectionStep>("main")
  const [selectedMainClass, setSelectedMainClass] = useState<number | null>(null)
  const [selectedSubClass, setSelectedSubClass] = useState<string | null>(null)

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

  const handleMainClassSelect = (classId: number) => {
    setSelectedMainClass(classId)
    setCurrentStep("sub")
  }

  const handleSubClassSelect = (subClassName: string) => {
    setSelectedSubClass(subClassName)
    setCurrentStep("direction")
  }

  const handleDirectionSelect = (direction: string) => {
    if (selectedMainClass && selectedSubClass && intersectionsSet) {
      onVehicleCount(selectedMainClass, selectedSubClass, direction)
      // Reset to main class selection after counting
      setCurrentStep("main")
      setSelectedMainClass(null)
      setSelectedSubClass(null)
    }
  }

  const handleBack = () => {
    if (currentStep === "direction") {
      setCurrentStep("sub")
      setSelectedSubClass(null)
    } else if (currentStep === "sub") {
      setCurrentStep("main")
      setSelectedMainClass(null)
    }
  }

  const handleUndoClick = () => {
    if (onUndo && canUndo) {
      onUndo()
    }
  }

  const getTotalCountForClass = (classId: number): number => {
    const classData = counts[classId.toString()]
    if (!classData) return 0

    return Object.values(classData).reduce((total, subClassData) => {
      return total + Object.values(subClassData).reduce((subTotal, count) => subTotal + count, 0)
    }, 0)
  }

  const getTotalCountForSubClass = (classId: number, subClassName: string): number => {
    const subClassData = counts[classId.toString()]?.[subClassName]
    if (!subClassData) return 0

    return Object.values(subClassData).reduce((total, count) => total + count, 0)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-12" : "w-96"
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
            title={isCollapsed ? "Expand sidebar" : "Close vehicle categorizer"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>

        <div className="flex flex-col h-full">
          {!isCollapsed && (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Vehicle Categorizer</h2>
                  <div className="flex items-center gap-2">
                    {currentStep !== "main" && (
                      <Button
                        onClick={handleBack}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 bg-transparent"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back
                      </Button>
                    )}
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className={currentStep === "main" ? "text-blue-600 font-medium" : ""}>1. Class</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className={currentStep === "sub" ? "text-blue-600 font-medium" : ""}>2. Type</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className={currentStep === "direction" ? "text-blue-600 font-medium" : ""}>3. Direction</span>
                </div>

                {/* Current Selection */}
                {selectedMainClass && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      {getClassIcon(selectedMainClass)}
                      <span>
                        Class {selectedMainClass}: {getVehicleClassById(selectedMainClass)?.name}
                      </span>
                    </div>
                    {selectedSubClass && (
                      <div className="ml-7 text-gray-600 dark:text-gray-400">→ {selectedSubClass}</div>
                    )}
                  </div>
                )}

                {/* Undo Button */}
                <Button
                  onClick={handleUndoClick}
                  disabled={!canUndo}
                  className={`w-full flex items-center justify-center gap-3 h-10 mt-4 transition-all duration-200 ${
                    canUndo
                      ? "bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-md"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  title={canUndo ? "Click to undo last count (Z)" : "No counts to undo"}
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="font-medium">Undo Last Count</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-black/20 text-white rounded">Z</kbd>
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-4">
                {currentStep === "main" && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">Select Vehicle Class</h3>
                    {vehicleClassifications.map((vehicleClass) => {
                      const totalCount = getTotalCountForClass(vehicleClass.id)
                      const isClickable = intersectionsSet

                      return (
                        <Card
                          key={vehicleClass.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isClickable ? "hover:scale-105 hover:border-blue-300" : "opacity-50 cursor-not-allowed"
                          } ${
                            lastPressed?.mainClass === vehicleClass.id
                              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                          onClick={() => isClickable && handleMainClassSelect(vehicleClass.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${vehicleClass.bgColor} text-white`}>
                                  {getClassIcon(vehicleClass.id)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    Class {vehicleClass.id}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{vehicleClass.name}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {totalCount > 0 && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {totalCount}
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {currentStep === "sub" && selectedMainClass && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">Select Vehicle Type</h3>
                    {getVehicleClassById(selectedMainClass)?.subClasses.map((subClass) => {
                      const totalCount = getTotalCountForSubClass(selectedMainClass, subClass.name)
                      const isClickable = intersectionsSet

                      return (
                        <Card
                          key={subClass.name}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isClickable ? "hover:scale-105 hover:border-blue-300" : "opacity-50 cursor-not-allowed"
                          } ${
                            lastPressed?.subClass === subClass.name
                              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                          onClick={() => isClickable && handleSubClassSelect(subClass.name)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{subClass.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{subClass.description}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {subClass.examples.join(", ")}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {totalCount > 0 && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {totalCount}
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {currentStep === "direction" && selectedMainClass && selectedSubClass && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">Select Direction</h3>
                    {["North", "South", "East", "West"].map((direction) => {
                      const count = counts[selectedMainClass.toString()]?.[selectedSubClass]?.[direction] || 0
                      const isClickable = intersectionsSet

                      return (
                        <Card
                          key={direction}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isClickable ? "hover:scale-105 hover:border-blue-300" : "opacity-50 cursor-not-allowed"
                          } ${
                            lastPressed?.direction === direction
                              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                          onClick={() => isClickable && handleDirectionSelect(direction)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                  {directionIcons[direction as keyof typeof directionIcons]}
                                </div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{direction}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {count}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Quick Tips */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm">Quick Tips</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li>• First select the main vehicle class (1-6)</li>
                    <li>• Then choose the specific vehicle type</li>
                    <li>• Finally select the direction of travel</li>
                    <li>• Use the back button to change your selection</li>
                    <li>• Press Z to undo the last count</li>
                    <li>• Set up intersections first to enable counting</li>
                  </ul>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </>
  )
}
