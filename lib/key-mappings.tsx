import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"

export const getDirectionIcon = (direction: string) => {
  switch (direction) {
    case "Northbound":
      return <ArrowUp className="h-8 w-8" />
    case "Southbound":
      return <ArrowDown className="h-8 w-8" />
    case "Eastbound":
      return <ArrowRight className="h-8 w-8" />
    case "Westbound":
      return <ArrowLeft className="h-8 w-8" />
    default:
      return null
  }
}

export const getDirectionConfigForKey = (key: string) => {
  switch (key) {
    case "1":
      return {
        direction: "Eastbound",
        intersection: "North",
        color: { bg: "bg-blue-500", border: "border-blue-600", glow: "shadow-blue-500/50" },
      }
    case "2":
      return {
        direction: "Westbound",
        intersection: "North",
        color: { bg: "bg-blue-500", border: "border-blue-600", glow: "shadow-blue-500/50" },
      }
    case "3":
      return {
        direction: "Eastbound",
        intersection: "South",
        color: { bg: "bg-red-500", border: "border-red-600", glow: "shadow-red-500/50" },
      }
    case "4":
      return {
        direction: "Westbound",
        intersection: "South",
        color: { bg: "bg-red-500", border: "border-red-600", glow: "shadow-red-500/50" },
      }
    case "5":
      return {
        direction: "Northbound",
        intersection: "East",
        color: { bg: "bg-emerald-500", border: "border-emerald-600", glow: "shadow-emerald-500/50" },
      }
    case "6":
      return {
        direction: "Southbound",
        intersection: "East",
        color: { bg: "bg-emerald-500", border: "border-emerald-600", glow: "shadow-emerald-500/50" },
      }
    case "7":
      return {
        direction: "Northbound",
        intersection: "West",
        color: { bg: "bg-amber-500", border: "border-amber-600", glow: "shadow-amber-500/50" },
      }
    case "8":
      return {
        direction: "Southbound",
        intersection: "West",
        color: { bg: "bg-amber-500", border: "border-amber-600", glow: "shadow-amber-500/50" },
      }
    default:
      return null
  }
}
