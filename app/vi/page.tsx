import Link from "next/link";
import { Shield, Zap, Users, ArrowRight, Check, Cloud, Lock, Server, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Bảo Mật & Riêng Tư",
    desc: "File của bạn được mã hóa và lưu trữ an toàn. Chỉ bạn mới có quyền truy cập.",
    en: "Secure and private",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Zap,
    title: "Tốc Độ Cực Nhanh",
    desc: "Tải lên và tải xuống với tốc độ cao nhờ hạ tầng tối ưu.",
    en: "Lightning fast",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Cloud,
    title: "Vận Hành Bởi Telegram",
    desc: "Tận dụng hạ tầng mạnh mẽ của Telegram cho lưu trữ luôn sẵn sàng.",
    en: "Telegram powered",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Lock,
    title: "Bảo Mật Doanh Nghiệp",
    desc: "Xác thực JWT, bảo vệ CSRF, giới hạn tốc độ tích hợp sẵn.",
    en: "Enterprise security",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Dễ Dàng Quản Lý",
    desc: "Sắp xếp với thư mục, tìm kiếm tức thì, quản lý dễ dàng.",
    en: "Easy organization",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Globe,
    title: "Truy Cập Mọi Nơi",
    desc: "Truy cập file từ bất kỳ thiết bị nào, bất kỳ đâu trên thế giới.",
    en: "Cross-platform",
    gradient: "from-pink-500 to-rose-500",
  },
];

const pricing = [
  { name: "Cơ Bản", price: "$0", period: "tháng", features: ["Giới hạn 50MB", "Không giới hạn thư mục", "Lưu trữ an toàn", "Quản lý file", "Tìm kiếm"], popular: false },
  { name: "Pro", price: "$9", period: "tháng", features: ["Giới hạn 500MB", "Không giới hạn thư mục", "Hỗ trợ ưu tiên", "Phân tích nâng cao", "Tải bulk"], popular: true },
  { name: "Doanh Nghiệp", price: "$29", period: "tháng", features: ["Giới hạn 5GB", "Mọi tính năng Pro", "API access", "Quản lý nhóm", "Tích hợp tùy chỉnh"], popular: false },
];

export default function VietnameseHomePage() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/vi" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Free Clouds</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/vi/login" className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium">
                Đăng Nhập
              </Link>
              <Link href="/vi/register" className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
                Bắt Đầu
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Vận hành bởi hạ tầng Telegram
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              File Của Bạn,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mọi Nơi
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Lưu trữ, sắp xếp và truy cập file an toàn trên đám mây. Được hỗ trợ bởi hạ tầng mạnh mẽ của Telegram.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vi/register" className="btn-primary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group">
                Bắt Đầu Miễn Phí
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#features" className="btn-secondary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2">
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50MB", label: "Giới Hạn File" },
              { value: "∞", label: "Thư Mục" },
              { value: "99.9%", label: "Hoạt Động" },
              { value: "24/7", label: "Hỗ Trợ" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Mọi thứ bạn cần cho lưu trữ file
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Đơn giản, an toàn và đáng tin cậy với đầy đủ tính năng bạn cần.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="stat-card group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 mb-2">{feature.desc}</p>
                  <p className="text-xs text-slate-500 italic">{feature.en}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bảng giá đơn giản, minh bạch
            </h2>
            <p className="text-lg text-slate-400">Bắt đầu miễn phí, nâng cấp khi cần thêm.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px] ${
                plan.popular
                  ? "bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/50"
                  : "bg-slate-800/50 border border-slate-700"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-semibold text-white">
                    Phổ Biến Nhất
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/vi/register"
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center block transition-all ${
                    plan.popular ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Bắt Đầu
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            Tham gia cùng hàng nghìn người dùng tin tưởng Free Clouds.
          </p>
          <Link
            href="/vi/register"
            className="btn-primary px-10 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group"
          >
            Tạo Tài Khoản
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Free Clouds</span>
            </div>
            <div className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Free Clouds. Bảo lưu mọi quyền.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
