"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, BarChart3, RefreshCw, CheckCircle } from "lucide-react"

interface VideoEndPromptProps {
  isOpen: boolean
  onUploadNew: () => void
  onExport: () => void
  onReplay: () => void
  totalCounts: number
  videoCount: number
  isLastVideo?: boolean
}

export default function VideoEndPrompt({
  isOpen,
  onUploadNew,
  onExport,
  onReplay,
  totalCounts,
  videoCount,
  isLastVideo = false,
}: VideoEndPromptProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto">
        <div className="flex flex-col items-center p-6 space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              {isLastVideo ? "All Videos Complete!" : "Video Complete!"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isLastVideo
                ? "You've reached the end of your last video. What would you like to do next?"
                : "You've reached the end of this video. What would you like to do next?"}
            </p>
          </div>

          <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Total pedestrians counted:</span>
              <span className="font-medium text-gray-800 dark:text-white">{totalCounts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Videos processed:</span>
              <span className="font-medium text-gray-800 dark:text-white">{videoCount}</span>
            </div>
          </div>

          <div className="flex flex-col w-full space-y-3">
            {isLastVideo ? (
              <>
                <Button onClick={onExport} className="w-full flex items-center justify-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Export All Data
                </Button>
                <Button
                  onClick={onUploadNew}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <Upload className="h-4 w-4" />
                  Upload Another Video
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onUploadNew} className="w-full flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Next Video
                </Button>
                <Button
                  onClick={onExport}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <BarChart3 className="h-4 w-4" />
                  Export Current Data
                </Button>
              </>
            )}
            <Button onClick={onReplay} variant="ghost" className="w-full flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Replay This Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
