export default function Footer() {
  return (
    <footer className="bg-[#AEBC9F] pt-12 pb-8 px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10">
          {/* Navigation */}
          <div>
            <h3 className="text-[#4a4a4a] font-semibold mb-5 text-[17px]">Navigation</h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-[#4a4a4a] hover:text-[#485B3B] text-[16px]">Home</a></li>
                            <li><a href="/shop" className="text-[#4a4a4a] hover:text-[#485B3B] text-[16px]">Shop</a></li>
              <li><a href="/events" className="text-[#4a4a4a] hover:text-[#485B3B] text-[16px]">Event</a></li>
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h3 className="text-[#4a4a4a] font-semibold mb-5 text-[17px]">About Us</h3>
            <ul className="space-y-3">
              <li className="text-[#4a4a4a] hover:text-[#485B3B] text-[16px]"> A community for tea lovers — connecting people through events, wellness, and shared moments over tea.</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#4a4a4a] font-semibold mb-5 text-[17px]">Contact</h3>
            <div className="space-y-2 mb-4">
              <p className="text-[#4a4a4a] text-[16px]">Email: Teative2669@gmail.com</p>
              <p className="text-[#4a4a4a] text-[16px]">Tel: 091-017-1541</p>
              <p className="text-[#4a4a4a] text-[16px]">Kasetsart University Kamphaeng Saen Campus, Thailand</p>
            </div>
            {/* Social Icons */}
            <div className="flex gap-3 mt-4">
              {/* Facebook */}
              <a href="#" className="w-10 h-10 rounded-full border border-[#4a4a4a] flex items-center justify-center text-[#4a4a4a] hover:bg-[#485B3B] hover:text-white hover:border-[#485B3B] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="w-10 h-10 rounded-full border border-[#4a4a4a] flex items-center justify-center text-[#4a4a4a] hover:bg-[#485B3B] hover:text-white hover:border-[#485B3B] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* Twitter / X */}
              <a href="#" className="w-10 h-10 rounded-full border border-[#4a4a4a] flex items-center justify-center text-[#4a4a4a] hover:bg-[#485B3B] hover:text-white hover:border-[#485B3B] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Email */}
              <a href="mailto:hello@teactive.com" className="w-10 h-10 rounded-full border border-[#4a4a4a] flex items-center justify-center text-[#4a4a4a] hover:bg-[#485B3B] hover:text-white hover:border-[#485B3B] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#4a4a4a] opacity-30 mb-6" />

        {/* Bottom Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#485B3B] flex items-center justify-center text-white text-[14px] font-semibold">
              T
            </div>
            <span className="text-[#4a4a4a] font-semibold text-[17px]">Teactive</span>
          </div>
          <p className="text-[#4a4a4a] text-[14px]">
            © 2026 Teactive. All rights reserved. Social · Activity · Tea
          </p>
        </div>
      </div>
    </footer>
  );
}