export function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent" />
    </div>
  );
}

