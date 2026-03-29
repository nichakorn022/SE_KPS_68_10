import React, { useEffect, useRef } from "react";

export default function InboxPopup({ messages, onClose }) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div ref={popupRef} className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#e6e3da] mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e3da]">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#485B3B]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            <span className="text-lg font-semibold text-[#485B3B]">กล่องข้อความ</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-[#485B3B] transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {messages && messages.length > 0 ? (
            messages.map((msg, idx) => (
              <div key={idx} className="px-6 py-4 border-b last:border-b-0 border-[#f0ede6] hover:bg-[#485B3B]/5 cursor-pointer transition-colors">
                <div className="font-medium text-[#24321F]">{msg.title}</div>
                <div className="mt-1 text-sm text-[#6f7b70]">{msg.content}</div>
                <div className="mt-1 text-xs text-gray-400">{msg.time}</div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-[#c8c3b8]" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <p className="mt-3 text-[#6f7b70]">ไม่มีข้อความใหม่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
