import Image from "next/image";
import Footer from "@/components/Footer";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/hero-bg.webp" alt="" fill priority className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-[#0f172a]" />
      </div>
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
