"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Undo2, Download } from "lucide-react"
import DirectionArrowIndicator from "./direction-arrow-indicator"
import { getDirectionConfigForKey } from "@/lib/key-mappings"

interface ControlsPanelProps {
  onUndo: () => void
  onFinish: () => void
  canUndo: boolean
  canFinish: boolean
  onClearVideo: () => void
  lastPressed: { key: string; direction: string } | null
  showArrowIndicator: boolean
  totalCount: number
  lastDirectionCount: number
}

export default function ControlsPanel({
  onUndo,
  onFinish,
  canUndo,
  canFinish,
  onClearVideo,
  lastPressed,
  showArrowIndicator,
  totalCount,
  lastDirectionCount,
}: ControlsPanelProps) {
  const lastDirectionConfig = lastPressed ? getDirectionConfigForKey(lastPressed.key) : null

  return (
    <div className="flex items-center gap-3 w-full max-w-3xl">
      <div className="flex-shrink-0">
        <DirectionArrowIndicator lastPressed={lastPressed} isVisible={showArrowIndicator} />
      </div>

      {/* Counters */}
      <div className="flex gap-2">
        <div className="bg-white dark:bg-slate-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 min-w-[80px] text-center">
          <div className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-300 leading-none">
            {totalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total</div>
        </div>

        {lastDirectionConfig && (
          <div
            className={`${lastDirectionConfig.color.bg} rounded-lg px-3 py-2 border-2 ${lastDirectionConfig.color.border} min-w-[80px] text-center`}
          >
            <div className="text-lg font-bold tabular-nums text-white leading-none">{lastDirectionCount}</div>
            <div className="text-xs text-white/80 mt-1">Direction</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 h-10 flex items-center justify-center hover:bg-secondary/80 transition-all duration-200 shadow-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 font-semibold text-sm"
          title="Undo last count (Z)"
        >
          <Undo2 className="h-4 w-4 mr-2 transition-transform duration-200" />
          <span className="leading-none">Undo</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={!canFinish}
              size="sm"
              className="flex-1 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 dark:text-slate-900 transition-all duration-200 shadow-sm disabled:opacity-50 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 font-semibold text-sm"
              title="Export counting data"
            >
              <Download className="h-4 w-4 mr-2 transition-transform duration-200" />
              <span className="leading-none">Export</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="animate-in fade-in-0 zoom-in-95 duration-300">
            <AlertDialogHeader>
              <AlertDialogTitle>Export Data & Finish?</AlertDialogTitle>
              <AlertDialogDescription>
                This will export your counting data as a CSV file (grouped by 15-second intervals) and clear the video.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:scale-105 hover:shadow-md transition-all duration-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onFinish()
                  onClearVideo()
                }}
                className="bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                Yes, Finish & Export
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
