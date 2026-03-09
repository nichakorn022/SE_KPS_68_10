import React from 'react';
import { Link } from 'react-router-dom';
// Import Swiper Components และ Modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function Home() {
  // ข้อมูลกิจกรรมสำหรับส่วนสไลด์กิจกรรม (Section 2)
  const eventData = [
    {
      title: "Morning Yoga & Meditation Session",
      instructor: "ครูจันทรากานต์",
      date: "Sunday, February 2, 2024",
      time: "7:00 AM - 8:30 AM",
      location: "สวนลุมพินี กรุงเทพฯ (จุดนัดพบ: ลานตะวัน)",
      members: "22/30",
      spaces: "8",
      img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Tea Tasting & Mindfulness Workshop",
      instructor: "คุณศิริพงษ์",
      date: "Saturday, February 8, 2024",
      time: "2:00 PM - 4:00 PM",
      location: "ATC Community Space ชั้น 2",
      members: "12/15",
      spaces: "3",
      img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      
      {/* Container หลัก */}
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden">

        {/* ================= Navbar (Header) ================= */}
        <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm pointer-events-auto relative">
          <div className="flex items-center justify-start h-16 w-32 md:w-40"> 
            <img 
              src="./Pictrue/Logo.png"  
              alt="ATC Logo" 
              className="h-full w-auto object-contain drop-shadow-sm" 
            />
          </div>

          <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4 relative z-50 pointer-events-auto">
            <Link to="/" className="hover:text-black transition-colors underline-offset-4 hover:underline">Home</Link>
            <Link to="/shop" className="hover:text-black transition-colors underline-offset-4 hover:underline">Shop</Link>
            <Link to="/events" className="hover:text-black transition-colors underline-offset-4 hover:underline">Event</Link>
            <Link to="/login" className="hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6">Login</Link>
          </div>
        </nav>

        {/* ================= Hero Section ================= */}
        <section className="relative w-full h-[400px]">
          <img 
            src="./Pictrue/Tea Background.png" 
            alt="Tea background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center pointer-events-none">
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight drop-shadow-xl font-bold">
              Social,<br/>Activity,<br/>Tea
            </h1>
            <button className="bg-[#485B3B] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-[#3a4a2f] transition-all shadow-lg active:scale-95 pointer-events-auto">
              join us now
            </button>
          </div>
        </section>

        {/* ================= Section 1: ชวนพักใจ (แก้ไขให้เลื่อนเหมือน Section 2) ================= */}
        <section className="py-14 px-4 text-center">
          <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">ชวนพักใจ พบเพื่อนใหม่ในชุมชนชา</h2>
          
          <div className="relative w-full max-w-[850px] mx-auto group">
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 4000 }}
              navigation={{
                nextEl: '.s1-next',
                prevEl: '.s1-prev',
              }}
              pagination={{ clickable: true, el: '.s1-pagination' }}
              className="pb-16"
            >
              <SwiperSlide>
                <div className="h-64 md:h-96 overflow-hidden rounded-3xl shadow-lg border-8 border-white">
                  <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80" 
                       className="w-full h-full object-cover" alt="Community 1" />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="h-64 md:h-96 overflow-hidden rounded-3xl shadow-lg border-8 border-white">
                  <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80" 
                       className="w-full h-full object-cover" alt="Community 2" />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="h-64 md:h-96 overflow-hidden rounded-3xl shadow-lg border-8 border-white">
                  <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" 
                       className="w-full h-full object-cover" alt="Community 3" />
                </div>
              </SwiperSlide>
            </Swiper>

            {/* ปุ่มกดเลื่อน Section 1 */}
            <div className="s1-prev absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❮</div>
            <div className="s1-next absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❯</div>
            
            <div className="s1-pagination flex justify-center gap-2 mt-[-30px]"></div>
          </div>
        </section>

        {/* ================= Section 2: กิจกรรม ================= */}
        <section className="py-10 px-6 text-center">
          <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">ร่วมกิจกรรมเพื่อสุขภาพกับผู้คนหลากหลาย</h2>
          
          <div className="relative max-w-[850px] mx-auto group">
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 5000 }}
              navigation={{
                nextEl: '.s2-next',
                prevEl: '.s2-prev',
              }}
              pagination={{ clickable: true, el: '.s2-pagination' }}
              className="pb-16"
            >
              {eventData.map((event, index) => (
                <SwiperSlide key={index}>
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row text-left border border-gray-100 mx-1">
                    <div className="p-10 md:w-3/5 flex flex-col justify-center">
                      <div className="flex gap-2 mb-6">
                        <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
                        <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
                        <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
                      </div>

                      <h3 className="text-[24px] font-bold text-gray-800 mb-6 leading-tight">
                        {event.title.split('&').map((text, i) => (
                          <span key={i}>{text}{i === 0 && <><br/>&</>}</span>
                        ))}
                      </h3>
                      
                      <div className="text-[16px] text-gray-600 space-y-3 mb-10">
                        <p>👤 {event.instructor}</p>
                        <p>📅 {event.date}</p>
                        <p>⏰ {event.time}</p>
                        <p>📍 {event.location}</p>
                      </div>

                      <div className="flex gap-4">
                        <button className="bg-[#AEBC9F] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:brightness-95 transition-all shadow-md active:scale-95">เข้าร่วมแล้ว ({event.members})</button>
                        <button className="bg-gray-100 text-gray-500 px-8 py-2.5 rounded-full text-sm font-bold border border-gray-200">เหลือที่ว่าง {event.spaces}</button>
                      </div>
                    </div>

                    <div className="md:w-2/5 p-6 pl-0 hidden md:block">
                      <img 
                        src={event.img} 
                        alt={event.title} 
                        className="w-full h-full object-cover rounded-2xl shadow-inner" 
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="s2-prev absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❮</div>
            <div className="s2-next absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer text-[#485B3B] hover:bg-[#485B3B] hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex">❯</div>
            
            <div className="s2-pagination flex justify-center gap-2 mt-[-30px]"></div>
          </div>
        </section>

        {/* ================= Section 3: เหล่าสาวกชา ================= */}
        <section className="py-16 px-6 max-w-[850px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 bg-white/50 p-8 rounded-3xl shadow-sm border border-white/40">
            <div className="w-full md:w-1/2 h-[250px] overflow-hidden rounded-2xl shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80" 
                alt="Community group" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="w-full md:w-1/2 text-left">
              <h2 className="text-[24px] font-bold text-gray-800 mb-6 leading-tight">
                เหล่าสาวกชามัวรออะไรอยู่ล่ะ<br/>มาร่วมกับพวกเราสิ!
              </h2>
              <ul className="space-y-4 text-gray-700 text-[16px]">
                <li className="flex items-start gap-3"><span className="text-[#485B3B] font-bold">✓</span> รวมกิจกรรมด้านสุขภาพไว้ที่เดียว</li>
                <li className="flex items-start gap-3"><span className="text-[#485B3B] font-bold">✓</span> มี community แลกเปลี่ยนประสบการณ์</li>
                <li className="flex items-start gap-3"><span className="text-[#485B3B] font-bold">✓</span> รีวิวจากผู้เข้าร่วมจริง</li>
                <li className="flex items-start gap-3"><span className="text-[#485B3B] font-bold">✓</span> สมัคร-ยกเลิกกิจกรรมง่าย</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[#485B3B] font-medium mb-6">พร้อมเริ่มกิจกรรมแรกของคุณหรือยัง?</p>
            <div className="flex justify-center gap-6">
              <button className="bg-[#485B3B] text-white px-10 py-3 rounded-full font-bold shadow-lg hover:bg-[#3a4a2f] transition-all">สมัครสมาชิก</button>
              <Link to="/events">
  <button className="bg-white text-[#485B3B] border-2 border-[#485B3B] px-10 py-3 rounded-full font-bold hover:bg-[#485B3B] hover:text-white transition-all">
    ดูกิจกรรมทั้งหมด
  </button>
</Link>
            </div>
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer className="bg-[#AEBC9F] pt-12 pb-20 px-10">
          <div className="max-w-[850px] mx-auto opacity-30 space-y-4">
            <div className="h-4 bg-white w-48 rounded"></div>
            <div className="h-4 bg-white w-32 rounded"></div>
          </div>
        </footer>

      </div>
      
      {/* CSS สำหรับจุด Pagination ทั้งสองส่วน */}
      <style dangerouslySetInnerHTML={{ __html: `
        .s1-pagination .swiper-pagination-bullet-active, 
        .s2-pagination .swiper-pagination-bullet-active { 
          background: #485B3B !important; 
          width: 12px; 
          height: 12px; 
        }
        .s1-pagination .swiper-pagination-bullet, 
        .s2-pagination .swiper-pagination-bullet { 
          background: #AEBC9F; 
          opacity: 0.6; 
        }
      ` }} />
    </div>
  );
}