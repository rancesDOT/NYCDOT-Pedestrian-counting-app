"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Repeat2 } from "lucide-react"

interface VideoEndPromptProps {
  isOpen: boolean
  onUploadNew: () => void
  onExport: () => void
  onReplay: () => void
  totalCounts: number
  videoCount: number
}

export default function VideoEndPrompt({
  isOpen,
  onUploadNew,
  onExport,
  onReplay,
  totalCounts,
  videoCount,
}: VideoEndPromptProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Video Ended</DialogTitle>
          <DialogDescription>The current video has finished. What would you like to do next?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Total counts so far:{" "}
            <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">{totalCounts}</span>
            {videoCount > 1 && <span className="block text-xs mt-1">Across {videoCount} videos</span>}
          </div>
          <Button onClick={onUploadNew} className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Upload New Video (Keep Data)
          </Button>
          <Button onClick={onExport} className="w-full bg-transparent" variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Export All Data
          </Button>
          <Button onClick={onReplay} className="w-full" variant="ghost">
            <Repeat2 className="mr-2 h-4 w-4" /> Replay Current Video
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
