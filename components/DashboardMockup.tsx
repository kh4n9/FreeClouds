import {
  Cloud,
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  Search,
  Upload,
  HardDrive,
  Download,
  MoreVertical,
  Lock as LockIcon,
} from "lucide-react";

const files = [
  { icon: FileText, name: "Design-brief.pdf", size: "2.4 MB", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  { icon: ImageIcon, name: "team-photo.jpg", size: "4.8 MB", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { icon: Video, name: "demo-video.mp4", size: "48 MB", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { icon: Music, name: "intro-track.mp3", size: "6.2 MB", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  { icon: FileArchive, name: "backup-2026.zip", size: "120 MB", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { icon: FileText, name: "report-q2.docx", size: "1.1 MB", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
];

const folders = ["Projects", "Media", "Documents", "Backups"];

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl animate-slide-up" style={{ animationDelay: "0.25s" }}>
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-sky-500/40 blur-sm" />
      <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-blue-500/10 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <div className="flex-1 flex justify-center">
            <div className="w-56 h-6 rounded-md bg-slate-800/80 border border-slate-700/50 flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <LockIcon className="w-3 h-3" />
              free-clouds.vercel.app/dashboard
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="hidden sm:flex flex-col w-44 border-r border-slate-800 bg-slate-950/40 p-4 gap-1">
            <div className="flex items-center gap-2 mb-5 px-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Free Clouds</span>
            </div>
            {["My Files", "Shared", "Recent", "Trash"].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                  i === 0
                    ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                    : "text-slate-400"
                }`}
              >
                {i === 0 ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5 opacity-60" />}
                {item}
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 mb-2 px-3 uppercase tracking-wider">Storage</div>
              <div className="px-3">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                  <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
                <div className="text-[10px] text-slate-500">312 MB of 500 MB</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="text-sm font-semibold text-white">My Files</div>
                <div className="text-[10px] text-slate-500">6 files · 3 folders</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-500 text-xs">
                  <Search className="w-3.5 h-3.5" />
                  Search files...
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { icon: HardDrive, label: "Total storage", value: "312 MB", sub: "of 500 MB" },
                { icon: Folder, label: "Folders", value: "12", sub: "+2 this week" },
                { icon: FileText, label: "Files", value: "146", sub: "+18 this week" },
                { icon: Download, label: "Downloads", value: "1.2k", sub: "this month" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500">{stat.label}</span>
                    <stat.icon className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-base font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-slate-500">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Recent files</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="group rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center gap-3 hover:border-cyan-500/40 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${file.color}`}>
                    <file.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-200 truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500">{file.size}</div>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-500/20 rounded-full blur-[96px] animate-pulse-slow" />
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-cyan-500/20 rounded-full blur-[96px] animate-pulse-slow" style={{ animationDelay: "1.2s" }} />
    </div>
  );
}
