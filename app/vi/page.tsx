import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Users, ArrowRight, Check, Cloud, Lock, Globe, Upload, FolderPlus, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardMockup from "@/components/DashboardMockup";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/motion/Reveal";
import {
  generateMetadata as generateSEOMetadata,
  generateBreadcrumbs,
} from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    language: "vi",
    title: "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File",
    description:
      "Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp. Giới hạn file 50MB, thư mục không giới hạn.",
    keywords: [
      "lưu trữ đám mây miễn phí",
      "chia sẻ file an toàn",
      "cloud storage việt nam",
      "lưu trữ file trực tuyến",
      "telegram cloud",
      "lưu trữ file miễn phí",
      "đám mây không giới hạn thư mục",
      "tải file lên an toàn",
      "quản lý file online",
      "sao lưu dữ liệu online",
    ],
    image: `${BASE_URL}/vi/opengraph-image`,
    url: `${BASE_URL}/vi`,
    canonical: `${BASE_URL}/vi`,
    alternates: {
      languages: {
        en: `${BASE_URL}/`,
        vi: `${BASE_URL}/vi`,
      },
    },
  });
}

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Free Clouds có thực sự miễn phí không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Gói Starter miễn phí vĩnh viễn với giới hạn file 50MB, thư mục không giới hạn, lưu trữ an toàn và tìm kiếm file.",
      },
    },
    {
      "@type": "Question",
      name: "Kích thước file tối đa tôi có thể tải lên là bao nhiêu?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gói miễn phí hỗ trợ file tối đa 50MB. Gói Pro và Doanh Nghiệp hỗ trợ lần lượt tới 500MB và 5GB.",
      },
    },
    {
      "@type": "Question",
      name: "Dữ liệu của tôi an toàn đến mức nào?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "File của bạn được mã hóa và lưu trữ trên hạ tầng mạnh mẽ của Telegram, với xác thực JWT, bảo vệ CSRF và giới hạn tốc độ được tích hợp sẵn.",
      },
    },
    {
      "@type": "Question",
      name: "Tôi có thể truy cập file từ bất kỳ thiết bị nào không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Có. Free Clouds hoạt động trên mọi trình duyệt và nền tảng — Windows, macOS, Linux, iOS và Android.",
      },
    },
    {
      "@type": "Question",
      name: "Tôi có cần thẻ tín dụng để đăng ký không?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Không. Bạn có thể tạo tài khoản và bắt đầu lưu trữ file mà không cần cung cấp bất kỳ thông tin thanh toán nào.",
      },
    },
  ],
};

const breadcrumbsData = generateBreadcrumbs([
  { name: "Trang chủ", url: "/vi" },
]);

const features = [
  {
    icon: Shield,
    title: "Bảo Mật & Riêng Tư",
    desc: "File của bạn được mã hóa và lưu trữ an toàn. Chỉ bạn mới có quyền truy cập.",
    en: "Secure and private",
    gradient: "from-blue-500 to-sky-500",
  },
  {
    icon: Zap,
    title: "Tốc Độ Cực Nhanh",
    desc: "Tải lên và tải xuống với tốc độ cao nhờ hạ tầng tối ưu.",
    en: "Lightning fast",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Cloud,
    title: "Vận Hành Bởi Telegram",
    desc: "Tận dụng hạ tầng mạnh mẽ của Telegram cho lưu trữ luôn sẵn sàng.",
    en: "Telegram powered",
    gradient: "from-sky-400 to-cyan-400",
  },
  {
    icon: Lock,
    title: "Bảo Mật Doanh Nghiệp",
    desc: "Xác thực JWT, bảo vệ CSRF, giới hạn tốc độ tích hợp sẵn.",
    en: "Enterprise security",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    icon: Users,
    title: "Dễ Dàng Quản Lý",
    desc: "Sắp xếp với thư mục, tìm kiếm tức thì, quản lý dễ dàng.",
    en: "Easy organization",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Globe,
    title: "Truy Cập Mọi Nơi",
    desc: "Truy cập file từ bất kỳ thiết bị nào, bất kỳ đâu trên thế giới.",
    en: "Cross-platform",
    gradient: "from-sky-500 to-blue-600",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Tải file lên đám mây",
    desc: "Kéo và thả file vào đám mây. File được mã hóa và lưu trữ an toàn trên hạ tầng Telegram.",
    en: "Upload your files",
    gradient: "from-blue-500 to-sky-500",
  },
  {
    icon: FolderPlus,
    title: "Tổ chức với thư mục",
    desc: "Tạo thư mục không giới hạn, tìm kiếm tức thì và sắp xếp mọi thứ gọn gàng.",
    en: "Organize with folders",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Share2,
    title: "Truy cập mọi nơi",
    desc: "Mở file từ bất kỳ thiết bị nào, trên mọi nền tảng — đúng lúc bạn cần.",
    en: "Access anywhere",
    gradient: "from-sky-500 to-blue-600",
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
      <Navbar />

      <script
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsData) }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-bg.webp?w=1200&q=70" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-[#0f172a]" />
        </div>
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stagger className="text-center max-w-4xl mx-auto mb-16">
            <StaggerItem className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Vận hành bởi hạ tầng Telegram
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                File Của Bạn,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                  Ở Mọi Nơi
                </span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Lưu trữ, sắp xếp và truy cập file của bạn một cách an toàn trên đám mây. Được vận hành bởi hạ tầng mạnh mẽ của Telegram với bảo mật cấp doanh nghiệp.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/vi/register" className="btn-primary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group">
                  Bắt Đầu Miễn Phí
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#features" className="btn-secondary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2">
                  Tìm Hiểu Thêm
                </a>
              </div>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.2}><DashboardMockup /></Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-8" gap={0.12}>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <CountUp to={50} suffix="MB" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Giới hạn file</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  ∞
                </div>
                <div className="text-sm text-slate-500 mt-1">Thư mục</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <CountUp to={99.9} decimals={1} suffix="%" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Hoạt động ổn định</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <CountUp to={24} suffix="/7" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Hỗ trợ</div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">Tính năng</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Mọi thứ bạn cần cho lưu trữ file
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Lưu trữ đám mây đơn giản, an toàn và đáng tin cậy với đầy đủ tính năng bạn mong đợi.
            </p>
          </Reveal>
          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <div className="stat-card group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 mb-2">{feature.desc}</p>
                    <p className="text-xs text-slate-500 italic">{feature.en}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">Cách hoạt động</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ba bước đến đám mây tự do
              </h2>
              <p className="text-lg text-slate-400 mb-10">
                Bắt đầu chỉ mất chưa đầy một phút. Không cần thẻ tín dụng — chỉ cần tạo tài khoản miễn phí.
              </p>
              <Stagger className="space-y-6" gap={0.12}>
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <StaggerItem key={step.title}>
                      <div className="flex gap-4 group">
                        <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${step.gradient} p-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-full h-full text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-semibold text-white">{step.title}</span>
                            <span className="text-xs text-slate-500">— Bước {i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-400">{step.desc}</p>
                          <p className="text-xs text-slate-500 italic mt-0.5">{step.en}</p>
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl">
                  <Image src="/images/about.webp" alt="File được lưu trữ an toàn trên đám mây" width={1600} height={1066} className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl glass px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Dữ liệu của bạn, luôn trong tầm tay</div>
                      <div className="text-xs text-slate-400">Mã hóa · Sao lưu · Luôn sẵn sàng</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">Bảng giá</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Giá đơn giản, minh bạch
            </h2>
            <p className="text-lg text-slate-400">Bắt đầu miễn phí, nâng cấp khi bạn cần thêm.</p>
          </Reveal>
          <Stagger className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" gap={0.12}>
            {pricing.map((plan) => (
              <StaggerItem key={plan.name}>
                <div className={`relative rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px] ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-500/10 to-cyan-500/10 border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/10"
                    : "bg-slate-800/50 border border-slate-700"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-xs font-semibold text-white">
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
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/vi/register"
                    className={`w-full py-3 rounded-xl text-sm font-semibold text-center block transition-all ${
                      plan.popular
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    Bắt Đầu Ngay
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/cta-bg.webp" alt="" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-slate-950/80 to-cyan-900/70" />
        </div>
        <Reveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            Hàng nghìn người dùng đã tin tưởng Free Clouds với file của họ.
          </p>
          <Link
            href="/vi/register"
            className="btn-primary px-10 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group"
          >
            Tạo Tài Khoản
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
