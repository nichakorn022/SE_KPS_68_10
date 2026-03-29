export default function AdminMetaCard({ label, value, tone = "filled" }) {
  const cardClass =
    tone === "plain"
      ? "rounded-2xl bg-white px-4 py-4 ring-1 ring-[#efe8d8]"
      : "rounded-2xl bg-[#f8f4eb] px-4 py-4";

  return (
    <div className={cardClass}>
      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">{label}</p>
      <p className="mt-2 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}
