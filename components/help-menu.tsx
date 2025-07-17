"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { HelpCircle, Settings, Download, Upload, FileVideo, Clock } from "lucide-react"
import HelpPopup from "./help-popup"

interface HelpMenuProps {
  onShowHelpCenter: () => void
  onShowHelpSidebar: () => void
  onExportData: () => void
  onClearVideo: () => void
  onShowTimeInput: () => void
  onLoadVideo: () => void
  isVideoLoaded: boolean
  isCountingActive: boolean
}

export default function HelpMenu({
  onShowHelpCenter,
  onShowHelpSidebar,
  onExportData,
  onClearVideo,
  onShowTimeInput,
  onLoadVideo,
  isVideoLoaded,
  isCountingActive,
}: HelpMenuProps) {
  const [isHelpPopupOpen, setIsHelpPopupOpen] = useState(false)
  const helpButtonRef = useRef<HTMLButtonElement>(null)

  const handleToggleHelpPopup = () => {
    setIsHelpPopupOpen((prev) => !prev)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10"
            ref={helpButtonRef}
            onClick={handleToggleHelpPopup}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="sr-only">Help menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={onShowHelpCenter} className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Full Help Guide
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShowHelpSidebar} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Toggle Sidebar Help
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportData} disabled={!isCountingActive} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClearVideo} disabled={!isVideoLoaded} className="flex items-center gap-2">
            <FileVideo className="w-4 h-4" />
            Clear Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShowTimeInput} disabled={!isVideoLoaded} className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Set Video Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLoadVideo} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Load New Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <HelpPopup isOpen={isHelpPopupOpen} onClose={() => setIsHelpPopupOpen(false)} triggerRef={helpButtonRef} />
    </>
  )
}
