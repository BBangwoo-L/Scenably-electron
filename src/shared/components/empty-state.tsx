interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm mt-1">{description}</p>
      )}
    </div>
  );
}