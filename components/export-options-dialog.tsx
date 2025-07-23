"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ExportOptionsDialogProps {
  isOpen: boolean
  onPreview: () => void
  onExportAndEnd: () => void
  onCancel: () => void
  totalEntries: number
  groupedEntries: number
}

export default function ExportOptionsDialog({
  isOpen,
  onPreview,
  onExportAndEnd,
  onCancel,
  totalEntries,
  groupedEntries,
}: ExportOptionsDialogProps) {
  const reductionPercentage = totalEntries > 0 ? ((totalEntries - groupedEntries) / totalEntries) * 100 : 0

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export Data Options</AlertDialogTitle>
          <AlertDialogDescription>
            Your counting data has been grouped into 1-minute intervals. This will reduce the number of rows in your CSV
            from {totalEntries} to {groupedEntries} (a {reductionPercentage.toFixed(1)}% reduction).
            <br />
            <br />
            Choose how you'd like to proceed:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <Button onClick={onPreview} className="w-full">
            Preview Data & Continue
          </Button>
          <Button onClick={onExportAndEnd} className="w-full" variant="secondary">
            Export & End Session
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
