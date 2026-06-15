import { Sparkles, Trophy, BadgePercent, Truck } from 'lucide-react';

interface KeunggulanProps {
  settings?: any;
}

export default function Keunggulan({ settings }: KeunggulanProps) {
  const keunggulanTitle = settings?.keunggulanTitle || '4 Pilar Utama Keunggulan Haylofress Ngawi';
  const keunggulanSubtitle = settings?.keunggulanSubtitle || 'Kami menjaga kualitas produk sejak awal rantai distribusi hingga sampai di tangan Anda demi memberikan kenyamanan dan kesehatan konsumsi keluarga.';

  const USP_ITEMS = [
    {
      icon: <Sparkles className="w-8 h-8 text-emerald-600" />,
      title: 'Higenis & Steril Total',
      desc: 'Melalui pencucian steril berulang dengan air bersih terfiltrasi. Pengemasan menggunakan kantong plastik kedap udara (vacuum pack) standar food-grade untuk mengunci kebersihan mutlak.',
    },
    {
      icon: <Trophy className="w-8 h-8 text-emerald-600" />,
      desc: 'Suhu dingin terjaga di bawah -18 derajat Celsius menghambat pertumbuhan bakteri merugikan. Tekstur, aroma alami, dan nutrisi daging segar dikunci persis sesaat setelah dipotong.',
      title: 'Kualitas Fresh & Frozen Premium',
    },
    {
      icon: <BadgePercent className="w-8 h-8 text-emerald-600" />,
      title: 'Harga Eceran Murah & Grosir Hebat',
      desc: 'Kami adalah supplier tangan pertama! Menyediakan opsi eceran ekonomis untuk memasak harian, serta harga potongan grosir super hemat otomatis saat membeli minimal 5 Kg.',
    },
    {
      icon: <Truck className="w-8 h-8 text-emerald-600" />,
      title: 'Siap Kirim Cepat & Aman',
      desc: 'Bekerjasama dengan kurir lokal yang dilengkapi kotak berinsulasi penahan dingin agar rantai beku (cold chain) tidak terputus di jalan. Menjamin produk sampai dengan aman di rumah Anda.',
    },
  ];

  return (
    <section id="id-keunggulan" className="py-20 bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden border-t border-slate-200">
      {/* Visual background accents */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
            — STANDAR KUALITAS KAMI —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">
            {keunggulanTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {keunggulanSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {USP_ITEMS.map((item, index) => (
            <div
              key={index}
              className="bg-white/40 backdrop-blur-xl border border-white/50 p-6 sm:p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-emerald-200/10 hover:bg-white/60 transition-all duration-300 flex flex-col sm:flex-row gap-6 hover:-translate-y-1 transform group"
            >
              <div className="bg-emerald-50 text-emerald-600 p-4 h-fit rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shrink-0">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
