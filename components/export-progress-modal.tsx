"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Download, FileText, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"

interface ExportProgressModalProps {
  isOpen: boolean
  onComplete: () => void
  totalEntries: number
  groupedEntries: number
}

export default function ExportProgressModal({
                                              isOpen,
                                              onComplete,
                                              totalEntries,
                                              groupedEntries,
                                            }: ExportProgressModalProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: FileText, label: "Processing data", description: "Analyzing pedestrian counts..." },
    { icon: BarChart3, label: "Grouping by intervals", description: "Organizing into intervals..." },
    { icon: Download, label: "Generating CSV", description: "Creating export file..." },
    { icon: CheckCircle, label: "Complete", description: "Data exported successfully!" },
  ]

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2

        if (newProgress >= 25 && currentStep === 0) setCurrentStep(1)
        else if (newProgress >= 50 && currentStep === 1) setCurrentStep(2)
        else if (newProgress >= 75 && currentStep === 2) setCurrentStep(3)
        else if (newProgress >= 100) {
          clearInterval(timer)
          // Call onComplete immediately when progress is 100%
          onComplete()
          return 100
        }

        return newProgress
      })
    }, 50)

    return () => clearInterval(timer)
  }, [isOpen, onComplete, currentStep]) // Removed currentStep from dependencies to prevent re-running timer on step change

  if (!isOpen) return null

  const CurrentIcon = steps[currentStep].icon

  return (
      <Dialog open={isOpen}>
        <DialogContent className="max-w-md mx-auto" hideCloseButton>
          <div className="flex flex-col items-center p-6 space-y-6">
            <div className="relative">
              <div
                  className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                      currentStep === 3 ? "scale-110" : "scale-100"
                  }`}
                  style={{
                    animation: currentStep < 3 ? "pulseGlow 2s ease-in-out infinite" : "none",
                  }}
              >
                <CurrentIcon className="h-10 w-10 text-white transition-transform duration-300 ease-out" />
              </div>
              {currentStep === 3 && (
                  <div
                      className="absolute inset-0 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
                      style={{ animation: "fadeInScale 0.6s ease-out" }}
                  >
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h3
                  className="text-xl font-semibold text-gray-800 dark:text-white transition-all duration-300 ease-out"
                  key={currentStep}
                  style={{ animation: "slideInUp 0.4s ease-out" }}
              >
                {steps[currentStep].label}
              </h3>
              <p
                  className="text-sm text-gray-600 dark:text-gray-300 transition-all duration-300 ease-out"
                  key={`desc-${currentStep}`}
                  style={{ animation: "slideInUp 0.4s ease-out 0.1s both" }}
              >
                {steps[currentStep].description}
              </p>
            </div>

            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{progress}%</span>
                <span>{currentStep < 3 ? "Processing..." : "Complete!"}</span>
              </div>
            </div>

            <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Original entries:</span>
                <span className="font-medium text-gray-800 dark:text-white">{totalEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Grouped entries:</span>
                <span className="font-medium text-gray-800 dark:text-white">{groupedEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Reduction:</span>
                <span className="font-medium text-green-600">
                {totalEntries > 0 ? Math.round(((totalEntries - groupedEntries) / totalEntries) * 100) : 0}%
              </span>
              </div>
            </div>

            <div className="flex space-x-3">
              {steps.map((step, index) => (
                  <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ease-out ${
                          index <= currentStep
                              ? index === currentStep
                                  ? "bg-blue-500 scale-125 shadow-lg"
                                  : "bg-green-500 scale-110"
                              : "bg-gray-300 dark:bg-gray-600 scale-100"
                      }`}
                      style={{
                        boxShadow: index === currentStep ? "0 0 12px rgba(59, 130, 246, 0.5)" : "none",
                      }}
                  />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
