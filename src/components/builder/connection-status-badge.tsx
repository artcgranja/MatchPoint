import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ConnectionStatus = "pending" | "email_sent" | "clicked" | "accepted";

const statusStyles: Record<ConnectionStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  email_sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  clicked: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  accepted: "bg-sage/10 text-sage border-sage/20",
};

const statusLabels: Record<ConnectionStatus, string> = {
  pending: "Pending",
  email_sent: "Email Sent",
  clicked: "Clicked",
  accepted: "Accepted",
};

export function ConnectionStatusBadge({
  status,
  labels,
}: {
  status: ConnectionStatus;
  labels?: Record<ConnectionStatus, string>;
}) {
  const displayLabels = labels ?? statusLabels;

  return (
    <Badge variant="outline" className={cn("border", statusStyles[status])}>
      {displayLabels[status]}
    </Badge>
  );
}
