import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-[600px] max-w-4xl mx-auto rounded-xl" />
    </div>
  );
}
