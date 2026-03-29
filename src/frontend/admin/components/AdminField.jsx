export default function AdminField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`.trim()}>
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">{label}</span>
      {children}
    </label>
  );
}
