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
    language: "en",
    title: "Free Clouds - Secure Cloud Storage & File Sharing Platform",
    description:
      "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access, and cross-platform compatibility.",
    keywords: [
      "free cloud storage",
      "secure file sharing",
      "free file hosting",
      "telegram cloud storage",
      "online file management",
      "free online storage",
      "cloud storage free unlimited folders",
      "secure file upload",
      "cloud drive free",
      "file backup online",
    ],
    image: `${BASE_URL}/opengraph-image`,
    url: `${BASE_URL}/`,
    canonical: `${BASE_URL}/`,
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
      name: "Is Free Clouds really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our Starter plan is free forever with a 50MB file limit, unlimited folders, secure storage, and file search.",
      },
    },
    {
      "@type": "Question",
      name: "What is the maximum file size I can upload?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The free plan supports files up to 50MB. Pro and Enterprise plans support up to 500MB and 5GB respectively.",
      },
    },
    {
      "@type": "Question",
      name: "How secure is my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your files are encrypted and stored on Telegram's robust infrastructure, with JWT authentication, CSRF protection, and rate limiting built in.",
      },
    },
    {
      "@type": "Question",
      name: "Can I access my files from any device?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Free Clouds works on any browser and platform — Windows, macOS, Linux, iOS, and Android.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a credit card to sign up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You can create an account and start storing files without providing any payment details.",
      },
    },
  ],
};

const breadcrumbsData = generateBreadcrumbs([{ name: "Home", url: "/" }]);

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your files are encrypted and stored securely. Only you have access to your data.",
    vi: "Bảo mật và riêng tư tuyệt đối",
    gradient: "from-blue-500 to-sky-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Upload and download files at blazing speeds with our optimized infrastructure.",
    vi: "Tốc độ nhanh như chớp",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Cloud,
    title: "Telegram Powered",
    desc: "Leveraging Telegram's robust infrastructure for reliable, always-on storage.",
    vi: "Vận hành bởi Telegram",
    gradient: "from-sky-400 to-cyan-400",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "JWT authentication, CSRF protection, and rate limiting built-in.",
    vi: "Bảo mật doanh nghiệp",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    icon: Users,
    title: "Easy Organization",
    desc: "Organize files with folders, search instantly, and manage with ease.",
    vi: "Tổ chức file dễ dàng",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Globe,
    title: "Cross-Platform",
    desc: "Access your files from any device, anywhere in the world.",
    vi: "Truy cập mọi lúc mọi nơi",
    gradient: "from-sky-500 to-blue-600",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Upload your files",
    desc: "Drag and drop files into the cloud. They're encrypted and stored safely on Telegram's infrastructure.",
    vi: "Tải file lên đám mây an toàn",
    gradient: "from-blue-500 to-sky-500",
  },
  {
    icon: FolderPlus,
    title: "Organize with folders",
    desc: "Create unlimited folders, search instantly, and keep everything in perfect order.",
    vi: "Tổ chức với thư mục không giới hạn",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Share2,
    title: "Access anywhere",
    desc: "Open your files from any device, on any platform — right when you need them.",
    vi: "Truy cập mọi lúc, mọi nơi",
    gradient: "from-sky-500 to-blue-600",
  },
];

const pricing = [
  { name: "Starter", price: "$0", period: "month", features: ["50MB file limit", "Unlimited folders", "Secure storage", "File organization", "Search"], popular: false },
  { name: "Pro", price: "$9", period: "month", features: ["500MB file limit", "Unlimited folders", "Priority support", "Advanced analytics", "Bulk download"], popular: true },
  { name: "Enterprise", price: "$29", period: "month", features: ["5GB file limit", "Everything in Pro", "API access", "Team management", "Custom integration"], popular: false },
];

export default function HomePage() {
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
              Powered by Telegram Infrastructure
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Your Files,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                  Anywhere
                </span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Store, organize, and access your files securely in the cloud. Powered by Telegram&apos;s robust infrastructure with enterprise-grade security.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-primary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group">
                  Start for Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#features" className="btn-secondary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2">
                  Learn More
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
                <div className="text-sm text-slate-500 mt-1">File Limit</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  ∞
                </div>
                <div className="text-sm text-slate-500 mt-1">Folders</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <CountUp to={99.9} decimals={1} suffix="%" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Uptime</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <CountUp to={24} suffix="/7" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Support</div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">Features</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for file storage
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Simple, secure, and reliable cloud storage with all the features you expect.
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
                    <p className="text-xs text-slate-500 italic">{feature.vi}</p>
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
              <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">How it works</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Three steps to cloud freedom
              </h2>
              <p className="text-lg text-slate-400 mb-10">
                Getting started takes less than a minute. No credit card required — just create a free account and go.
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
                            <span className="text-xs text-slate-500">— Step {i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-400">{step.desc}</p>
                          <p className="text-xs text-slate-500 italic mt-0.5">{step.vi}</p>
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
                  <Image src="/images/about.webp" alt="Files stored securely in the cloud" width={1600} height={1066} className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl glass px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Your data, always within reach</div>
                      <div className="text-xs text-slate-400">Encrypted · Backed up · Always on</div>
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
            <div className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-400">Start for free, upgrade when you need more.</p>
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
                      Most Popular
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
                    href="/register"
                    className={`w-full py-3 rounded-xl text-sm font-semibold text-center block transition-all ${
                      plan.popular
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    Get Started
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
            Ready to get started?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            Join thousands of users who trust Free Clouds with their files.
          </p>
          <Link
            href="/register"
            className="btn-primary px-10 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2 group"
          >
            Create Account
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
