interface EmptyStateComponentProps {
  name: string;
}

export default function EmptyStateComponent({
  name,
}: EmptyStateComponentProps) {
  return (
    <div className="flex h-[calc(100%-10%)] items-center justify-center text-gray-500">
      No {name} Data
    </div>
  );
}
