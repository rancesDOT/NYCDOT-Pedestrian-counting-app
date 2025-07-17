"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, UploadCloud, Download } from "lucide-react"

interface VideoEndPromptProps {
  isOpen: boolean
  onClose: () => void
  onUploadNewVideo: () => void
  onExportData: () => void
  totalCounts: number
}

export default function VideoEndPrompt({
  isOpen,
  onClose,
  onUploadNewVideo,
  onExportData,
  totalCounts,
}: VideoEndPromptProps) {
  if (!isOpen) return null

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Video Ended
          </DialogTitle>
          <DialogDescription className="text-center">
            You've reached the end of the video. What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
            <p className="text-sm text-blue-700">
              You have recorded <strong className="text-blue-800">{totalCounts}</strong> pedestrian counts.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onExportData}
              disabled={totalCounts === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-5 w-5 mr-2" />
              Export All Data ({totalCounts} counts)
            </Button>
            <Button onClick={onUploadNewVideo} variant="outline" className="w-full bg-transparent">
              <UploadCloud className="h-5 w-5 mr-2" />
              Upload New Video
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
