import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
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
import { getLoggedInRedirectPath } from "@/lib/auth";

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
    title: "Secure & private",
    desc: "Encrypted storage with JWT authentication, CSRF protection, and rate limiting built in.",
  },
  {
    icon: Zap,
    title: "Lightning fast",
    desc: "Upload and download at speed with optimized infrastructure.",
  },
  {
    icon: Cloud,
    title: "Telegram powered",
    desc: "Built on Telegram's robust, always-on storage infrastructure.",
  },
  {
    icon: Lock,
    title: "Enterprise security",
    desc: "Your data is encrypted and only you hold the keys.",
  },
  {
    icon: Users,
    title: "Easy organization",
    desc: "Folders, instant search, favorites, and bulk tools keep files in order.",
  },
  {
    icon: Globe,
    title: "Cross-platform",
    desc: "Access your files from any device, anywhere in the world.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Upload your files",
    desc: "Drag and drop files into the cloud. They are encrypted and stored safely.",
  },
  {
    icon: FolderPlus,
    title: "Organize with folders",
    desc: "Create unlimited folders and search across everything instantly.",
  },
  {
    icon: Share2,
    title: "Access anywhere",
    desc: "Open your files from any device, on any platform, right when you need them.",
  },
];

const pricing = [
  { name: "Starter", price: "$0", period: "month", features: ["50MB file limit", "Unlimited folders", "Secure storage", "File organization", "Search"], popular: false },
  { name: "Pro", price: "$9", period: "month", features: ["500MB file limit", "Unlimited folders", "Priority support", "Advanced analytics", "Bulk download"], popular: true },
  { name: "Enterprise", price: "$29", period: "month", features: ["5GB file limit", "Everything in Pro", "API access", "Team management", "Custom integration"], popular: false },
];

export default async function HomePage() {
  // Logged-in users bounce straight to their dashboard/admin area.
  const redirectPath = await getLoggedInRedirectPath();
  if (redirectPath) redirect(redirectPath);

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
                  Powered by Telegram Infrastructure
                </StaggerItem>
                <StaggerItem>
                  <h1 className="text-4xl md:text-5xl xl:text-6xl font-semibold tracking-tighter leading-[1.05] text-foreground mb-6">
                    Your files,{" "}
                    <em className="font-semibold text-accent not-italic">anywhere</em> you are.
                  </h1>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-base md:text-lg text-sub leading-relaxed mb-9 max-w-md">
                    Store, organize, and access your files securely in the cloud. Powered by Telegram&apos;s robust infrastructure with enterprise-grade security.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    <Link
                      href="/register"
                      className="btn-primary px-7 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 group"
                    >
                      Start for free
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <a
                      href="#features"
                      className="btn-secondary px-7 py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
                    >
                      Learn more
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
                <div className="text-sm text-muted mt-1.5">File limit</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">∞</div>
                <div className="text-sm text-muted mt-1.5">Folders</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">
                  <CountUp to={99.9} decimals={1} suffix="%" />
                </div>
                <div className="text-sm text-muted mt-1.5">Uptime</div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight text-accent font-mono">
                  <CountUp to={24} suffix="/7" />
                </div>
                <div className="text-sm text-muted mt-1.5">Support</div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Features — bento */}
      <section id="features" className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-14">
            <div className="text-sm font-medium text-accent uppercase tracking-[0.14em] mb-3">Features</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground mb-4">
              Everything you need for file storage
            </h2>
            <p className="text-base md:text-lg text-sub">
              Simple, secure, and reliable cloud storage with all the features you expect.
            </p>
          </Reveal>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" gap={0.07}>
            <StaggerItem className="lg:col-span-4 lg:row-span-2">
              <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden border border-line group">
                <Image
                  src="/images/about.webp"
                  alt="Files organized in folders, stored securely in the cloud"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <Cloud className="w-6 h-6 text-accent mb-3" />
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                    Your data, always within reach
                  </h3>
                  <p className="text-sm text-sub">Encrypted · Backed up · Always on</p>
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
                Three steps to cloud freedom
              </h2>
              <p className="text-base md:text-lg text-sub mb-10">
                Getting started takes less than a minute. No credit card required, just create a free account.
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
                    alt="Cloud storage access from any device"
                    width={1600}
                    height={1066}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl border border-line bg-card/90 backdrop-blur px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Your data, always within reach</div>
                      <div className="text-xs text-sub">Encrypted · Backed up · Always on</div>
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
              Simple, transparent pricing
            </h2>
            <p className="text-base md:text-lg text-sub">Start for free, upgrade when you need more.</p>
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
                      Most popular
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
                    href="/register"
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center block transition-all ${
                      plan.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    Get started
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
            Ready to get started?
          </h2>
          <p className="text-base md:text-lg text-sub mb-8 max-w-lg mx-auto">
            Join thousands of users who trust Free Clouds with their files.
          </p>
          <Link
            href="/register"
            className="btn-primary px-9 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 group"
          >
            Create account
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}