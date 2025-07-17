"use client"

import { Button } from "@/components/ui/button"
import { Undo2, CheckCircle2 } from "lucide-react"
import DirectionArrowIndicator from "./direction-arrow-indicator"

interface ControlsPanelProps {
  onUndo: () => void
  onFinish: () => void
  onClearVideo: () => void
  canUndo: boolean
  canFinish: boolean
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
  lastPressed,
  showArrowIndicator,
  totalCount,
  lastDirectionCount,
}: ControlsPanelProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{totalCount}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Total Counts</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{lastDirectionCount}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Last Direction</div>
      </div>

      <DirectionArrowIndicator lastPressed={lastPressed} isVisible={showArrowIndicator} />

      <Button
        onClick={onUndo}
        disabled={!canUndo}
        className={`h-12 px-6 flex items-center justify-center gap-2 transition-all duration-200 ${
          canUndo
            ? "bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 hover:shadow-md"
            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        }`}
        title={canUndo ? "Undo last count (Z)" : "No counts to undo"}
      >
        <Undo2 className="h-5 w-5" />
        <span className="font-semibold">Undo</span>
      </Button>

      <Button
        onClick={onFinish}
        disabled={!canFinish}
        className={`h-12 px-6 flex items-center justify-center gap-2 transition-all duration-200 ${
          canFinish
            ? "bg-green-500 hover:bg-green-600 text-white hover:scale-105 hover:shadow-md"
            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        }`}
        title={canFinish ? "Finish counting and export data" : "No data to export"}
      >
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-semibold">Finish</span>
      </Button>
    </div>
  )
}
