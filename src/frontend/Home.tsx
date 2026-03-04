
export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-[1024px] bg-[#F5F3E9] shadow-sm overflow-hidden">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 bg-[#AEBC9F] w-full">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="font-bold text-3xl tracking-wider text-black">ATC</span>
          </div>
          <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a]">
            <a href="#" className="hover:text-black transition-colors">Commu</a>
            <a href="#" className="hover:text-black transition-colors">Event</a>
            <a href="#" className="hover:text-black transition-colors">Ranking</a>
            <a href="#" className="hover:text-black transition-colors">Login</a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative w-full h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1576092768241-dec231879bfc?auto=format&fit=crop&w=1920&q=80" 
            alt="Tea background" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 drop-shadow-md">
              Social,<br/>Activity,<br/>Tea
            </h1>
            <button className="bg-[#485B3B] text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-[#36452c] transition-colors shadow-md">
              join us now
            </button>
          </div>
        </section>

        {/* กิจกรรม Section */}
        <section className="py-12 px-6 text-center">
          <h2 className="text-[24px] font-medium text-[#485B3B] mb-8">ร่วมกิจกรรมเพื่อสุขภาพกับผู้คนหลากหลาย</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row text-left max-w-[800px] mx-auto">
            <div className="p-8 md:w-3/5">
              <h3 className="text-[20px] font-medium text-gray-800 mb-4">Morning Yoga & Meditation</h3>
              <div className="text-[14px] text-gray-600 space-y-2 mb-6">
                <p>📅 Sunday, February 2, 2024</p>
                <p>📍 สวนลุมพินี กรุงเทพฯ</p>
              </div>
              <button className="bg-[#AEBC9F] text-white px-6 py-2 rounded-full text-xs font-medium">เข้าร่วมแล้ว (22/30)</button>
            </div>
            <div className="md:w-2/5 p-4">
              <img 
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80" 
                alt="Yoga" 
                className="w-full h-full object-cover rounded-xl" 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}