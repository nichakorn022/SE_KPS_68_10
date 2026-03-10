import { useAuthModal } from "../../App";

export default function HeroSection() {
  const { openRegister } = useAuthModal();

  return (
    <section className="relative w-full h-[400px]">
      <img
        src="./Pictrue/Tea Background.png"
        className="w-full h-full object-cover"
        alt="Tea background"
      />

      <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 font-bold">
          Social,<br />Activity,<br />Tea
        </h1>

        <button
          onClick={openRegister}
          className="bg-[#485B3B] text-white px-10 py-3 rounded-full font-bold"
        >
          join us now
        </button>
      </div>
    </section>
  );
}