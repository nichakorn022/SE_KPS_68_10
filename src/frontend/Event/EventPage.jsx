import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthModal } from '../../App';

export default function Events() {
  const { openLogin } = useAuthModal();
  // ข้อมูลจำลองรายการกิจกรรม
  const allEvents = Array(5).fill({
    title: "Morning Yoga & Meditation Session",
    instructor: "ครูจันทรากานต์",
    date: "Sunday, February 2, 2024",
    time: "7:00 AM - 8:30 AM",
    location: "สวนลุมพินี กรุงเทพฯ (จุดนัดพบ: ลานตะวัน)",
    members: "22/30",
    spaces: "8",
    img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80"
  });

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      
      {/* Container หลัก */}
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">

        {/* ================= Navbar ================= */}
        <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50">
          <div className="flex items-center justify-start h-16 w-32 md:w-40"> 
            <img src="./Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
            <Link to="/events" className="text-black underline underline-offset-4 font-bold">Event</Link>
            <button onClick={openLogin} className="border-l border-black/20 pl-6 hover:text-black bg-transparent border-t-0 border-r-0 border-b-0 cursor-pointer font-medium text-[17px] text-[#4a4a4a]">Login</button>
          </div>
        </nav>

        {/* ================= ส่วนหัวข้อหน้า Events ================= */}
        <div className="py-8 px-6 text-center">
          <h1 className="text-3xl font-bold text-[#485B3B] mb-6">Events</h1>
          
          <div className="relative max-w-[600px] mx-auto mb-8">
            <input 
              type="text" 
              placeholder="ค้นหา event เพิ่มเติม" 
              className="w-full py-3 px-6 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#AEBC9F]"
            />
            <span className="absolute right-5 top-3.5 text-gray-400">🔍</span>
          </div>

          <div className="flex justify-center gap-3 mb-10 overflow-x-auto pb-2">
            <button className="bg-[#485B3B] text-white px-8 py-2 rounded-full text-sm font-medium">ทั้งหมด</button>
            <button className="bg-[#AEBC9F] text-[#485B3B] px-8 py-2 rounded-full text-sm font-medium hover:bg-[#99a988]">ที่คุณสนใจ</button>
            <button className="bg-[#AEBC9F] text-[#485B3B] px-8 py-2 rounded-full text-sm font-medium hover:bg-[#99a988]">ลงทะเบียนแล้ว</button>
          </div>
        </div>

        {/* ================= รายการการ์ดกิจกรรม ================= */}
        <div className="px-6 space-y-8 pb-20">
          {allEvents.map((event, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col md:flex-row text-left max-w-[850px] mx-auto border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="p-8 md:w-3/5 flex flex-col justify-center">
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-2.5 bg-[#AEBC9F] rounded-full opacity-40"></div>
                  <div className="w-8 h-2.5 bg-[#AEBC9F] rounded-full opacity-40"></div>
                  <div className="w-8 h-2.5 bg-[#AEBC9F] rounded-full opacity-40"></div>
                </div>

                <h3 className="text-[20px] font-bold text-gray-800 mb-4 leading-tight">{event.title}</h3>
                
                <div className="text-[14px] text-gray-600 space-y-2 mb-6">
                  <p>👤 {event.instructor}</p>
                  <p>📅 {event.date}</p>
                  <p>⏰ {event.time}</p>
                  <p>📍 {event.location}</p>
                </div>

                <div className="flex gap-3">
                  {/* --- จุดแก้ไข: เชื่อมโยงไปยังหน้ารายละเอียดกิจกรรมตาม Index --- */}
                  <Link to={`/events/${index}`}>
                    <button className="bg-[#AEBC9F] text-white px-6 py-2 rounded-full text-xs font-bold hover:brightness-95 transition-all">
                      Read More
                    </button>
                  </Link>
                  <button className="bg-gray-50 text-gray-500 px-6 py-2 rounded-full text-xs font-bold border border-gray-200">
                    เหลือ {event.spaces} ที่นั่ง
                  </button>
                </div>
              </div>

              <div className="md:w-2/5 p-4 hidden md:block">
                <img src={event.img} alt={event.title} className="w-full h-full object-cover rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* ================= Footer ================= */}
        <footer className="bg-[#AEBC9F] pt-10 pb-16 px-10">
           <div className="max-w-[850px] mx-auto opacity-30 space-y-3">
            <div className="h-3 bg-white w-40 rounded"></div>
            <div className="h-3 bg-white w-24 rounded"></div>
          </div>
        </footer>

      </div>
    </div>
  );
}