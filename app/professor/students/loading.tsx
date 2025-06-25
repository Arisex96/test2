import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-64" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & filter skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 items-center">
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4 col-span-1" />
                <Skeleton className="h-4 col-span-1" />
                <Skeleton className="h-8 w-20 col-span-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
