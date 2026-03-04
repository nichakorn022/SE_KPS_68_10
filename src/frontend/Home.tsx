import React from 'react';
// 1. Import Swiper Components และ Modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// 2. Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      
      {/* Container หลัก */}
      <div className="w-full max-w-[1024px] bg-[#F5F3E9] shadow-sm overflow-hidden">

        {/* ================= Navbar (Header) ================= */}
        <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50">
  
  {/* ส่วนโลโก้: ปรับกล่องหุ้มให้กว้างขึ้นและช่วยจัดกึ่งกลาง */}
  <div className="flex items-center justify-start h-16 w-32 md:w-40"> 
    <img 
      src="./Pictrue/Logo.png"  // เปลี่ยนชื่อไฟล์ให้ตรงกับในโฟลเดอร์ public
      alt="ATC Logo" 
      /* h-full: ให้ความสูงเต็มกล่องที่ตั้งไว้
         w-auto: ปรับความกว้างตามสัดส่วนรูปจริงไม่ให้เบี้ยว
         object-contain: บังคับให้รูปแสดงครบถ้วนในกล่อง ไม่โดนตัด
         drop-shadow-sm: เพิ่มมิติให้โลโก้ดูชัดขึ้น
      */
      className="h-full w-auto object-contain drop-shadow-sm" 
    />
  </div>

          <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">
            <a href="#" className="hover:text-black transition-colors underline-offset-4 hover:underline">Home</a>
            <a href="#" className="hover:text-black transition-colors underline-offset-4 hover:underline">Shop</a>
            <a href="#" className="hover:text-black transition-colors underline-offset-4 hover:underline">Event</a>
            <a href="#" className="hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6">Login</a>
          </div>
        </nav>

        {/* ================= Hero Section ================= */}
        <section className="relative w-full h-[400px]">
          <img 
            src="./Pictrue/Tea Background.png" 
            alt="Tea background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight drop-shadow-xl font-bold">
              Social,<br/>Activity,<br/>Tea
            </h1>
            <button className="bg-[#485B3B] text-white px-10 py-3 rounded-full text-sm font-bold hover:bg-[#3a4a2f] transition-all shadow-lg active:scale-95">
              join us now
            </button>
          </div>
        </section>

        {/* ================= Section 1: ชวนพักใจ (แบบเลื่อนได้จริง) ================= */}
        <section className="py-14 px-4 text-center">
          <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">ชวนพักใจ พบเพื่อนใหม่ในชุมชนชา</h2>
          
          <div className="w-full max-w-[900px] mx-auto">
            <Swiper
              modules={[Pagination, Autoplay, EffectCoverflow]}
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={1.5} // ให้เห็นรูปข้างๆ บางส่วน
              loop={true}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              pagination={{ clickable: true }}
              breakpoints={{
                768: { slidesPerView: 2 },
              }}
              className="pb-14"
            >
              {/* รูปสไลด์ที่ 1 */}
              <SwiperSlide>
                <div className="h-64 md:h-80 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                  <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" 
                       className="w-full h-full object-cover" alt="Salad" />
                </div>
              </SwiperSlide>

              {/* รูปสไลด์ที่ 2 */}
              <SwiperSlide>
                <div className="h-64 md:h-80 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                  <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80" 
                       className="w-full h-full object-cover" alt="Tea" />
                </div>
              </SwiperSlide>

              {/* รูปสไลด์ที่ 3 */}
              <SwiperSlide>
                <div className="h-64 md:h-80 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                  <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80" 
                       className="w-full h-full object-cover" alt="Field" />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
          
          {/* Custom CSS สำหรับแต่งจุด Pagination ให้เป็นสีเขียวตามแบรนด์ */}
          <style dangerouslySetInnerHTML={{ __html: `
            .swiper-pagination-bullet-active { background: #485B3B !important; }
            .swiper-pagination-bullet { width: 10px; height: 10px; margin: 0 5px !important; }
          ` }} />
        </section>

        {/* ================= Section 2: กิจกรรม ================= */}
        <section className="py-10 px-6 text-center">
          <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">ร่วมกิจกรรมเพื่อสุขภาพกับผู้คนหลากหลาย</h2>
          
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row text-left max-w-[850px] mx-auto border border-gray-100 mb-20">
            <div className="p-10 md:w-3/5 flex flex-col justify-center">
              <div className="flex gap-2 mb-6">
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-40"></div>
              </div>

              <h3 className="text-[24px] font-bold text-gray-800 mb-6 leading-tight">Morning Yoga &<br/>Meditation Session</h3>
              
              <div className="text-[16px] text-gray-600 space-y-3 mb-10">
                <p>👤 ครูจันทรากานต์</p>
                <p>📅 Sunday, February 2, 2024</p>
                <p>⏰ 7:00 AM - 8:30 AM</p>
                <p>📍 สวนลุมพินี กรุงเทพฯ (จุดนัดพบ: ลานตะวัน)</p>
              </div>

              <div className="flex gap-4">
                <button className="bg-[#AEBC9F] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:brightness-95 transition-all shadow-md">เข้าร่วมแล้ว (22/30)</button>
                <button className="bg-gray-100 text-gray-500 px-8 py-2.5 rounded-full text-sm font-bold border border-gray-200">เหลือที่ว่าง 8</button>
              </div>
            </div>

            <div className="md:w-2/5 p-6 pl-0 hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80" 
                alt="Running group" 
                className="w-full h-full object-cover rounded-2xl shadow-inner" 
              />
            </div>
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer className="bg-[#AEBC9F] pt-12 pb-20 px-10">
          <div className="max-w-[850px] mx-auto">
            <div className="space-y-4 max-w-[200px] opacity-30">
              <div className="h-4 bg-white w-full rounded-md"></div>
              <div className="h-4 bg-white w-4/5 rounded-md"></div>
              <div className="h-4 bg-white w-2/3 rounded-md"></div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}