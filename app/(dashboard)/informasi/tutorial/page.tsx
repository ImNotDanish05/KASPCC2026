"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RevealOnScroll from "@/components/informasi/RevealOnScroll";
import { CirclePlay } from "lucide-react";

type TutorialVideo = {
  title: string;
  sourceUrl: string;
  description: string;
};

const tutorialVideos: TutorialVideo[] = [
  {
    title: "Tutorial Formatif",
    sourceUrl: "https://www.youtube.com/watch?v=XxZbIdYXXiA",
    description: "Panduan pengisian alur formatif agar proses pelaporan KAS tetap rapi dan konsisten.",
  },
  {
    title: "Tutorial Music",
    sourceUrl: "https://www.youtube.com/watch?v=aCIoUCn0O5g",
    description: "Panduan fitur music untuk membantu suasana kerja tetap fokus dan menyenangkan.",
  },
];

function toEmbedUrl(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const videoId = url.searchParams.get("v");
  return videoId ? `https://www.youtube.com/embed/${videoId}` : sourceUrl;
}

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tutorial" />

      <RevealOnScroll>
        <section className="rounded-2xl border border-brand-100 bg-linear-to-r from-brand-50 to-blue-50 p-5 shadow-sm dark:border-brand-500/30 dark:from-brand-500/10 dark:to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <CirclePlay className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Pusat Tutorial KASPCC</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pelajari alur kerja inti lewat video tutorial resmi.
              </p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <div className="space-y-6">
        {tutorialVideos.map((video, index) => (
          <RevealOnScroll key={video.title} delayMs={index * 120}>
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white/90">{video.title}</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{video.description}</p>
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
                <div className="aspect-video w-full">
                  <iframe
                    className="h-full w-full"
                    src={toEmbedUrl(video.sourceUrl)}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </section>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}
