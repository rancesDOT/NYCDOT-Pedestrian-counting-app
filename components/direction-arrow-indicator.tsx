"use client"

import { getDirectionIcon, getDirectionConfigForKey } from "@/lib/key-mappings"

interface DirectionArrowIndicatorProps {
  lastPressed: { key: string; direction: string } | null
  isVisible: boolean
}

export default function DirectionArrowIndicator({ lastPressed, isVisible }: DirectionArrowIndicatorProps) {
  if (!lastPressed || !isVisible) {
    return null
  }

  const config = getDirectionConfigForKey(lastPressed.key)

  if (!config) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex items-center justify-center w-20 h-14 ${config.color.bg} rounded-lg border-2 ${config.color.border} shadow-lg ${config.color.glow} transition-all duration-300`}
        style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
      >
        <div className="text-white drop-shadow-sm scale-150">{getDirectionIcon(config.direction)}</div>
      </div>
    </div>
  )
}
