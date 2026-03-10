import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function EventDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 pointer-events-auto relative">
          <div className="flex items-center justify-start h-16 w-32 md:w-40"> 
            <img src="./Pictrue/Logo.png" alt="ATC Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] relative z-50 pointer-events-auto">
            <Link to="/" className="hover:text-black">Home</Link>
            <Link to="/shop" className="hover:text-black">Shop</Link>
            <Link to="/events" className="text-black underline underline-offset-8 decoration-2">Event</Link>
            <Link to="/login" className="border-l border-black/20 pl-6 hover:text-black font-bold">Login</Link>
          </div>
        </nav>

        <div className="py-6 px-6 text-center">
          <h1 className="text-3xl font-medium text-gray-800 mb-6">Events</h1>
        </div>

        {/* Event Main Card */}
        <div className="px-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row max-w-[900px] mx-auto border border-gray-100">
            <div className="p-8 md:w-[55%] flex flex-col">
              <div className="flex gap-2 mb-4">
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-60"></div>
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-60"></div>
                <div className="w-10 h-3 bg-[#AEBC9F] rounded-full opacity-60"></div>
              </div>
              
              <h2 className="text-[24px] font-bold text-[#1a2e35] mb-4">Morning Yoga & Meditation Session</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=guy" alt="avatar" />
                  </div>
                  <span>GuyInwzaxd <span className="text-gray-400">@guyza558</span></span>
                </div>
                <p className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="text-lg">🕒</span> Saturday, February 8, 2026 | 7:00 AM - 8:30 AM
                </p>
                <p className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="text-lg">📍</span> Canaan Baptist Church Bangkok <br/>
                  <span className="text-[10px] text-blue-400 ml-8 underline cursor-pointer">Open with Google Maps</span>
                </p>
              </div>

              <div className="flex gap-3 mb-6">
                <div className="bg-[#AEBC9F] text-white px-4 py-1.5 rounded-full text-[11px] font-bold">Will go 5/20</div>
                <div className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[11px] font-bold">Interested 10</div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-sm text-gray-800 mb-1">Description</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Join us for a rejuvenating morning yoga and meditation session designed for all levels. Start your weekend with mindfulness, breathing exercises, and gentle stretches. We'll practice in a peaceful outdoor setting, weather permitting. Please bring your own mat and water bottle. <span className="font-bold text-gray-800 cursor-pointer">Read more.</span>
                </p>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-[#AEBC9F] text-white py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2">
                   💬 Chat
                </button>
                <button className="flex-1 border border-gray-200 text-gray-400 py-2 rounded-full text-sm font-bold">
                  Cancel Registration
                </button>
              </div>
            </div>

            <div className="md:w-[45%] h-auto min-h-[300px]">
              <img src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80" 
                   className="w-full h-full object-cover" alt="Yoga" />
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="px-6 pb-20 max-w-[900px] mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Comment <span className="text-gray-400 font-normal text-sm">(3)</span></h3>
            
            <div className="flex gap-4 mb-10">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=me" alt="user" />
              </div>
              <div className="flex-1 flex gap-2">
                <input type="text" placeholder="Write a comment..." className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-2 text-sm focus:outline-none" />
                <button className="bg-[#AEBC9F] text-white px-6 py-2 rounded-full text-sm font-bold shadow-md">Post</button>
              </div>
            </div>

            <div className="space-y-8">
              {[
                { name: "Uka Uka", time: "2 hours ago", text: "กิจกรรมสนุกมากครับ บรรยากาศดีมาก อยากให้จัดแบบนี้บ่อยๆ ครับ" },
                { name: "Somchai", time: "3 hours ago", text: "ขอบคุณทีมงานมาก กิจกรรมจัดดีมากครับ" },
                { name: "Ploy", time: "1 day ago", text: "บรรยากาศดี เหมาะกับการฝึกสมาธิจริงๆ" }
              ].map((comment, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-800">{comment.name}</span>
                      <span className="text-gray-400 text-[10px]">{comment.time}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none text-sm text-gray-700 leading-relaxed">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="bg-[#AEBC9F] h-40 w-full mt-10 opacity-60">
           <div className="p-10 space-y-4">
              <div className="h-4 bg-white/40 w-64 rounded"></div>
              <div className="h-4 bg-white/40 w-48 rounded"></div>
           </div>
        </footer>

      </div>
    </div>
  );
}
