export default function Footer() {
  return (
    <footer className="bg-[#AEBC9F] pt-8 pb-16 px-8">
      <div className="max-w-[850px] ml-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-[#4a4a4a] font-medium mb-4 text-[17px]">Navigation</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-[#4a4a4a] hover:text-[#485B3B] text-[17px] font-medium">Home</a></li>
              <li><a href="/shop" className="text-[#4a4a4a] hover:text-[#485B3B] text-[17px] font-medium">Shop</a></li>
              <li><a href="/events" className="text-[#4a4a4a] hover:text-[#485B3B] text-[17px] font-medium">Events</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[#4a4a4a] font-medium mb-4 text-[17px]">About Us</h3>
            <p className="text-[#4a4a4a] text-[17px] font-medium">We are a community dedicated to tea culture, social activities, and wellness events.</p>
          </div>
          <div>
            <h3 className="text-[#4a4a4a] font-medium mb-4 text-[17px]">Contact</h3>
            <p className="text-[#4a4a4a] text-[17px] font-medium">Email: segroup10@gmail.com</p>
            <p className="text-[#4a4a4a] text-[17px] font-medium">Phone: +66 9101 71541</p>
          </div>
        </div>
      </div>
    </footer>
  );
}