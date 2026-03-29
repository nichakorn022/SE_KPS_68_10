export default function AdminConfirmActionModal({
  title,
  message,
  confirmLabel,
  tone = "primary",
  busy = false,
  onClose,
  onConfirm,
}) {
  const confirmClass =
    tone === "positive"
      ? "bg-[#386132] text-white"
      : tone === "danger"
        ? "bg-[#b33a24] text-white"
        : "bg-[#485b3b] text-white";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">Confirm Action</p>
        <h4 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h4>
        <p className="mt-3 text-sm leading-6 text-[#4b5541]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
