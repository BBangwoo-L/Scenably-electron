import { Badge } from "@/shared/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          className: "bg-green-100 text-green-800",
          text: "SUCCESS"
        };
      case "FAILED":
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          className: "bg-red-100 text-red-800",
          text: "FAILED"
        };
      case "RUNNING":
        return {
          icon: <Clock className="h-4 w-4 text-blue-500 animate-spin" />,
          className: "bg-blue-100 text-blue-800",
          text: "RUNNING"
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          className: "bg-gray-100 text-gray-800",
          text: "PENDING"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-1">
      {showIcon && config.icon}
      <Badge variant="secondary" className={config.className}>
        {config.text}
      </Badge>
    </div>
  );
}