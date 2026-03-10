export default function CommunitySection() {
  return (
    <section className="py-16 px-6 max-w-[850px] mx-auto">

      <div className="flex flex-col md:flex-row gap-10 bg-white/50 p-8 rounded-3xl">

        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac"
          className="rounded-2xl"
        />

        <div>
          <h2 className="text-2xl font-bold mb-4">
            เหล่าสาวกชามัวรออะไรอยู่ล่ะ
          </h2>

          <ul className="space-y-3">
            <li>✓ รวมกิจกรรมสุขภาพ</li>
            <li>✓ มี community</li>
            <li>✓ รีวิวจากผู้เข้าร่วมจริง</li>
            <li>✓ สมัครง่าย</li>
          </ul>
        </div>

      </div>

    </section>
  );
}