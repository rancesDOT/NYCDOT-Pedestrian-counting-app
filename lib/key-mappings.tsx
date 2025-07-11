import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import type { JSX } from "react" // optional, just for clarity

export const directionsConfig = [
  {
    name: "Eastbound (North)",
    key: "1",
    intersection: "North",
    direction: "right",
    color: {
      bg: "bg-blue-500",
      text: "text-blue-600",
      border: "border-blue-400",
      glow: "shadow-blue-500/50",
    },
  },
  {
    name: "Westbound (North)",
    key: "2",
    intersection: "North",
    direction: "left",
    color: {
      bg: "bg-blue-500",
      text: "text-blue-600",
      border: "border-blue-400",
      glow: "shadow-blue-500/50",
    },
  },
  {
    name: "Eastbound (South)",
    key: "3",
    intersection: "South",
    direction: "right",
    color: {
      bg: "bg-red-500",
      text: "text-red-600",
      border: "border-red-400",
      glow: "shadow-red-500/50",
    },
  },
  {
    name: "Westbound (South)",
    key: "4",
    intersection: "South",
    direction: "left",
    color: {
      bg: "bg-red-500",
      text: "text-red-600",
      border: "border-red-400",
      glow: "shadow-red-500/50",
    },
  },
  {
    name: "Northbound (East)",
    key: "5",
    intersection: "East",
    direction: "up",
    color: {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      border: "border-emerald-400",
      glow: "shadow-emerald-500/50",
    },
  },
  {
    name: "Southbound (East)",
    key: "6",
    intersection: "East",
    direction: "down",
    color: {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      border: "border-emerald-400",
      glow: "shadow-emerald-500/50",
    },
  },
  {
    name: "Northbound (West)",
    key: "7",
    intersection: "West",
    direction: "up",
    color: {
      bg: "bg-amber-500",
      text: "text-amber-600",
      border: "border-amber-400",
      glow: "shadow-amber-500/50",
    },
  },
  {
    name: "Southbound (West)",
    key: "8",
    intersection: "West",
    direction: "down",
    color: {
      bg: "bg-amber-500",
      text: "text-amber-600",
      border: "border-amber-400",
      glow: "shadow-amber-500/50",
    },
  },
]

export const getDirectionIcon = (direction: string): JSX.Element | null => {
  const iconProps = { className: "h-6 w-6" }
  switch (direction) {
    case "up":
      return <ArrowUp {...iconProps} />
    case "down":
      return <ArrowDown {...iconProps} />
    case "left":
      return <ArrowLeft {...iconProps} />
    case "right":
      return <ArrowRight {...iconProps} />
    default:
      return null
  }
}

export const getDirectionConfigForKey = (key: string) => {
  return directionsConfig.find((d) => d.key === key)
}

export const getIntersectionConfig = (label: string) => {
  const intersectionMap: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
    "North Intersection": {
      label: "North Intersection",
      color: "#3b82f6",
      bgColor: "bg-blue-500",
      textColor: "text-blue-600",
    },
    "East Intersection": {
      label: "East Intersection",
      color: "#10b981",
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    "South Intersection": {
      label: "South Intersection",
      color: "#ef4444",
      bgColor: "bg-red-500",
      textColor: "text-red-600",
    },
    "West Intersection": {
      label: "West Intersection",
      color: "#f59e0b",
      bgColor: "bg-amber-500",
      textColor: "text-amber-600",
    },
  }
  return intersectionMap[label]
}
