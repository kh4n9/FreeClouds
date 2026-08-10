import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Cloud, Lock, Users, Globe, ArrowRight, Check, Upload, FolderPlus, Share2 } from "lucide-react";
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
        text: "Có. Free Clouds hoạt động trên mọi trình duyệt và nền tảng, Windows, macOS, Linux, iOS và Android.",
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
    title: "Bảo mật & riêng tư",
    desc: "File được mã hóa và lưu trữ an toàn. Chỉ bạn mới có quyền truy cập.",
  },
  {
    icon: Zap,
    title: "Tốc độ cực nhanh",
    desc: "Tải lên và tải xuống với tốc độ cao nhờ hạ tầng tối ưu.",
  },
  {
    icon: Cloud,
    title: "Vận hành bởi Telegram",
    desc: "Tận dụng hạ tầng mạnh mẽ của Telegram cho lưu trữ luôn sẵn sàng.",
  },
  {
    icon: Lock,
    title: "Bảo mật doanh nghiệp",
    desc: "Xác thực JWT, bảo vệ CSRF, giới hạn tốc độ tích hợp sẵn.",
  },
  {
    icon: Users,
    title: "Dễ dàng quản lý",
    desc: "Sắp xếp với thư mục, tìm kiếm tức thì, quản lý dễ dàng.",
  },
  {
    icon: Globe,
    title: "Truy cập mọi nơi",
    desc: "Truy cập file từ bất kỳ thiết bị nào, bất kỳ đâu trên thế giới.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Tải file lên đám mây",
    desc: "Kéo và thả file vào đám mây. File được mã hóa và lưu trữ an toàn.",
  },
  {
    icon: FolderPlus,
    title: "Tổ chức với thư mục",
    desc: "Tạo thư mục không giới hạn và tìm kiếm tức thì trên mọi thứ.",
  },
  {
    icon: Share2,
    title: "Truy cập mọi nơi",
    desc: "Mở file từ bất kỳ thiết bị nào, trên mọi nền tảng, đúng lúc bạn cần.",
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
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-bg.webp?w=1200&q=70" alt="" fill priority sizes="100vw" className="object-cover opacity-[0.06]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Stagger className="max-w-xl">
                <StaggerItem className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Vận hành bởi hạ tầng Telegram
                </StaggerItem>
                <StaggerItem>
                  <h1 className="text-4xl md:text-5xl xl:text-6xl font-semibold tracking-tighter leading-[1.05] text-foreground mb-6">
                    File của bạn,{" "}
                    <em className="font-semibold text-accent not-italic">ở mọi nơi</em> bạn cần.
                  </h1>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-base md:text-lg text-sub leading-relaxed mb-9 max-w-md">
                    Lưu trữ, sắp xếp và truy cập file an toàn trên đám mây. Được vận hành bởi hạ tầng Telegram với bảo mật cấp doanh nghiệp.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    <Link
                      href="/vi/register"
                      className="btn-primary px-7 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 group"
                    >
                      Bắt đầu miễn phí
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <a
                      href="#features"
                      className="btn-secondary px-7 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
                    >
                      Tìm hiểu thêm
                    </a>
                  </div>
                </StaggerItem>
              </Stagger>
            </div>
            <Reveal delay={0.15} className="lg:pl-6">
              <DashboardMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-line bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-y-10" gap={0.08}>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">
                  <CountUp to={50} suffix=" MB" />
                </div>
                <div className="text-sm text-muted mt-1.5">Giới hạn file</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">∞</div>
                <div className="text-sm text-muted mt-1.5">Thư mục</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">
                  <CountUp to={99.9} decimals={1} suffix="%" />
                </div>
                <div className="text-sm text-muted mt-1.5">Hoạt động ổn định</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">
                  <CountUp to={24} suffix="/7" />
                </div>
                <div className="text-sm text-muted mt-1.5">Hỗ trợ</div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Features — bento */}
      <section id="features" className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-14">
            <div className="text-sm font-medium text-accent uppercase tracking-[0.14em] mb-3">Tính năng</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground mb-4">
              Mọi thứ bạn cần cho lưu trữ file
            </h2>
            <p className="text-base md:text-lg text-sub">
              Lưu trữ đám mây đơn giản, an toàn và đáng tin cậy với đầy đủ tính năng bạn mong đợi.
            </p>
          </Reveal>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" gap={0.07}>
            <StaggerItem className="lg:col-span-4 lg:row-span-2">
              <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden border border-line group">
                <Image
                  src="/images/about.webp"
                  alt="File được sắp xếp trong thư mục, lưu trữ an toàn trên đám mây"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <Cloud className="w-6 h-6 text-accent mb-3" />
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                    Dữ liệu của bạn, luôn trong tầm tay
                  </h3>
                  <p className="text-sm text-sub">Mã hóa · Sao lưu · Luôn sẵn sàng</p>
                </div>
              </div>
            </StaggerItem>
            {features.slice(0, 4).map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title} className="lg:col-span-2">
                  <div className="h-full rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:border-line-hover hover:shadow-[0_12px_32px_-16px_rgba(23,25,31,0.25)]">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-sub leading-relaxed">{feature.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24 bg-card/50 border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground mb-4">
                Ba bước đến đám mây tự do
              </h2>
              <p className="text-base md:text-lg text-sub mb-10">
                Bắt đầu chỉ mất chưa đầy một phút. Không cần thẻ tín dụng, chỉ cần tạo tài khoản miễn phí.
              </p>
              <Stagger className="space-y-8" gap={0.1}>
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <StaggerItem key={step.title}>
                      <div className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <div className="w-11 h-11 shrink-0 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          {i < steps.length - 1 && <div className="w-px flex-1 bg-line my-2" />}
                        </div>
                        <div className="pt-1.5">
                          <div className="flex items-baseline gap-2.5 mb-1">
                            <span className="text-xs font-semibold font-mono text-accent">0{i + 1}</span>
                            <span className="text-[15px] font-semibold text-foreground">{step.title}</span>
                          </div>
                          <p className="text-sm text-sub leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border border-line shadow-[0_24px_64px_-32px_rgba(23,25,31,0.35)]">
                  <Image
                    src="/images/hero-bg.webp?w=1200&q=70"
                    alt="Truy cập lưu trữ đám mây từ bất kỳ thiết bị nào"
                    width={1600}
                    height={1066}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl border border-line bg-card/90 backdrop-blur px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Dữ liệu của bạn, luôn trong tầm tay</div>
                      <div className="text-xs text-sub">Mã hóa · Sao lưu · Luôn sẵn sàng</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground mb-4">
              Giá đơn giản, minh bạch
            </h2>
            <p className="text-base md:text-lg text-sub">Bắt đầu miễn phí, nâng cấp khi bạn cần thêm.</p>
          </Reveal>
          <Stagger className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" gap={0.1}>
            {pricing.map((plan) => (
              <StaggerItem key={plan.name}>
                <div
                  className={`relative h-full rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 ${
                    plan.popular
                      ? "border-2 border-accent bg-card shadow-[0_20px_48px_-24px_rgba(37,99,235,0.35)]"
                      : "border border-line bg-card hover:border-line-hover"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-accent text-xs font-medium text-white">
                      Phổ biến nhất
                    </div>
                  )}
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-semibold tracking-tight text-foreground font-mono">{plan.price}</span>
                    <span className="text-sm text-muted">/{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-sub">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/vi/register"
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center block transition-all ${
                      plan.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    Bắt đầu ngay
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/cta-bg.webp" alt="" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-background to-background" />
        </div>
        <Reveal className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-base md:text-lg text-sub mb-8 max-w-lg mx-auto">
            Hàng nghìn người dùng đã tin tưởng Free Clouds với file của họ.
          </p>
          <Link
            href="/vi/register"
            className="btn-primary px-9 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 group"
          >
            Tạo tài khoản
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}