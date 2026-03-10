export default function FloatingCartButton({ cartCount = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open cart"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#57B356] text-white shadow-[0_14px_28px_rgba(87,179,86,0.32)] transition-transform duration-200 hover:scale-105 hover:bg-[#4ca14b] active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l2.2 9.3a1 1 0 0 0 1 .7h9.7a1 1 0 0 0 1-.8L21 8H7" />
        <circle cx="10" cy="19" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="18" cy="19" r="1.6" fill="currentColor" stroke="none" />
      </svg>

      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#57B356] shadow-md">
          {cartCount}
        </span>
      )}
    </button>
  );
}
