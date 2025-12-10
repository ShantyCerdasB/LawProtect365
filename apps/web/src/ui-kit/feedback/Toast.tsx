type Props = { message: string };

export function Toast({ message }: Props) {
  return <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded">{message}</div>;
}

