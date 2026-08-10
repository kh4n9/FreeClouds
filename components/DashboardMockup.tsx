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
  { icon: FileText, name: "Design-brief.pdf", size: "2.4 MB", tint: "text-accent bg-accent/10" },
  { icon: ImageIcon, name: "team-photo.jpg", size: "4.8 MB", tint: "text-success bg-success/10" },
  { icon: Video, name: "demo-video.mp4", size: "48 MB", tint: "text-warning bg-warning/10" },
  { icon: Music, name: "intro-track.mp3", size: "6.2 MB", tint: "text-error bg-error/10" },
  { icon: FileArchive, name: "backup-2026.zip", size: "120 MB", tint: "text-sub bg-sub/10" },
  { icon: FileText, name: "report-q2.docx", size: "1.1 MB", tint: "text-accent bg-accent/10" },
];

const folders = ["My Files", "Shared", "Recent", "Trash"];

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="relative rounded-2xl border border-line bg-card shadow-[0_24px_64px_-32px_rgba(23,25,31,0.35)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line bg-background/60">
          <span className="w-3 h-3 rounded-full bg-error/80" />
          <span className="w-3 h-3 rounded-full bg-warning/80" />
          <span className="w-3 h-3 rounded-full bg-success/80" />
          <div className="flex-1 flex justify-center">
            <div className="w-56 h-6 rounded-md bg-background border border-line flex items-center justify-center gap-2 text-[10px] text-muted">
              <LockIcon className="w-3 h-3" />
              free-clouds.vercel.app/dashboard
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="hidden sm:flex flex-col w-44 border-r border-line bg-background/40 p-4 gap-1">
            <div className="flex items-center gap-2 mb-5 px-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Free Clouds</span>
            </div>
            {folders.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                  i === 0
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted"
                }`}
              >
                {i === 0 ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5 opacity-60" />}
                {item}
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-line">
              <div className="text-[10px] text-muted mb-2 px-3 uppercase tracking-wider">Storage</div>
              <div className="px-3">
                <div className="h-1.5 rounded-full bg-line overflow-hidden mb-1.5">
                  <div className="h-full w-3/5 rounded-full bg-accent" />
                </div>
                <div className="text-[10px] text-muted">312 MB of 500 MB</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="text-sm font-semibold text-foreground">My Files</div>
                <div className="text-[10px] text-muted">6 files · 3 folders</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-line text-muted text-xs">
                  <Search className="w-3.5 h-3.5" />
                  Search files...
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium">
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
                <div key={stat.label} className="rounded-xl border border-line bg-background/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted">{stat.label}</span>
                    <stat.icon className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="text-base font-semibold text-foreground font-mono">{stat.value}</div>
                  <div className="text-[10px] text-muted">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted uppercase tracking-wider mb-2">Recent files</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="group rounded-xl border border-line bg-background/50 p-3 flex items-center gap-3 hover:border-accent/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${file.tint}`}>
                    <file.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-foreground truncate">{file.name}</div>
                    <div className="text-[10px] text-muted">{file.size}</div>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-line hover:text-muted transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}