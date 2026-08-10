import Image from "next/image";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/motion/Reveal";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/hero-bg.webp?w=1200&q=70" alt="" fill priority sizes="100vw" className="object-cover opacity-[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>
      <div className="relative flex-1 flex items-center justify-center p-4 py-12">
        <Reveal className="w-full max-w-md" delay={0.05}>{children}</Reveal>
      </div>
      <Footer />
    </div>
  );
}