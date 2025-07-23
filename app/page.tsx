import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Welcome to the Pedestrian Counting App
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
        Effortlessly count pedestrians in your videos, label intersections, and export detailed data for analysis.
      </p>
      <Link href="/counter" passHref>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
          Start Counting
        </Button>
      </Link>
    </div>
  )
}
