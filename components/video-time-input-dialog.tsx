"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Clock, Calendar } from "lucide-react"

interface VideoTimeInputDialogProps {
  isOpen: boolean
  onConfirm: (startTime: Date) => void
  onSkip: () => void
}

export default function VideoTimeInputDialog({ isOpen, onConfirm, onSkip }: VideoTimeInputDialogProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      // Set default to current date and time
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0]
      const timeStr = now.toTimeString().slice(0, 5)
      setDate(dateStr)
      setTime(timeStr)
      setError("")
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!date || !time) {
      setError("Please enter both date and time")
      return
    }

    try {
      const startTime = new Date(`${date}T${time}:00`)
      if (isNaN(startTime.getTime())) {
        setError("Invalid date or time format")
        return
      }
      onConfirm(startTime)
    } catch (err) {
      setError("Invalid date or time format")
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md mx-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Video Recording Time
          </DialogTitle>
          <DialogDescription>
            Enter when this video was recorded to calculate accurate timestamps in your export data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Recording Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
                placeholder="Select date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">
              Recording Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10"
                placeholder="Select time"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-700">
              <strong>Example:</strong> If your video was recorded at 2:30 PM on March 15th, 2024, and you count a
              pedestrian at 0:45 in the video, the CSV will show the event at 3:15 PM.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSkip} className="flex-1 bg-transparent">
            Skip (Use Video Time)
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Confirm Time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
