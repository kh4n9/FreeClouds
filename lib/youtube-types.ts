export interface YoutubeFormatOption {
  itag: number;
  label: string;
  mime: string;
  sizeBytes: number | null;
  container: string;
  height: number | null;
  audioBitrateKbps: number | null;
  /** True when the MP3 source is a progressive MP4 (audio extracted from it). */
  fromProgressive: boolean;
}

export interface YoutubeMp4Option {
  id: string;
  label: string;
  itags: number[];
  needsMerge: boolean;
  sizeBytes: number | null;
  height: number;
}

export interface YoutubeInfoResponse {
  ok: true;
  videoId: string;
  title: string;
  author: string;
  durationSeconds: number;
  thumbnail: string;
  audio: YoutubeFormatOption[];
  mp4: YoutubeMp4Option[];
  /** itag (as string) -> signed stream URL, usable for ~hours. */
  urls: Record<string, string>;
}

export interface YoutubeApiError {
  ok: false;
  error: string;
  code?: string;
}

export type YoutubeApiResult = YoutubeInfoResponse | YoutubeApiError;
