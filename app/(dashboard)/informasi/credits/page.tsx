"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RevealOnScroll from "@/components/informasi/RevealOnScroll";
import {
  AtSign,
  CirclePlay,
  Code,
  ExternalLink,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  type CreditMember,
  originalDevelopers20252026,
} from "@/components/superadmin/CreditData";

type SocialType = keyof CreditMember["socials"];

const socialMeta: Record<
  SocialType,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  instagram: { label: "Instagram", Icon: AtSign },
  github: { label: "GitHub", Icon: Code },
  youtube: { label: "YouTube", Icon: CirclePlay },
};

function getSocialEntries(member: CreditMember): Array<[SocialType, string]> {
  return (
    Object.entries(member.socials) as Array<[SocialType, string | undefined]>
  ).filter((entry): entry is [SocialType, string] => Boolean(entry[1]));
}

export default function CreditsPage() {
  const [activeMember, setActiveMember] = useState<CreditMember | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openModal = (member: CreditMember) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMember(member);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const closeModal = () => {
    setIsModalVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMember(null);
      closeTimerRef.current = null;
    }, 180);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Credits" />

      <RevealOnScroll>
        <section className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 p-5 dark:border-brand-400/50 dark:bg-brand-500/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Current Maintainers 2026/2027
          </h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Slot terbuka untuk maintainer berikutnya.
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Jika kamu melanjutkan proyek ini, tambahkan namamu di sini di{" "}
            <span className="font-semibold">
              components/superadmin/CreditData.ts
            </span>{" "}
            (atau file serupa).
          </p>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={80}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Original Developers 2025/2026
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Klik nama untuk melihat profil lengkap.
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {originalDevelopers20252026.map((member, index) => (
              <li
                key={member.name}
                className="credits-row-animate"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <button
                  type="button"
                  onClick={() => openModal(member)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/60"
                >
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white/90">
                      {member.name}
                    </p>
                    <p className="text-sm text-brand-600 dark:text-brand-300">
                      {member.role}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    View profile
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={140}>
        <section className="rounded-2xl border border-purple-200 bg-linear-to-r from-purple-50 via-pink-50 to-orange-50 p-5 shadow-sm dark:border-purple-500/30 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-orange-500/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Trophy className="h-5 w-5 text-purple-500" />
                Built from MiniTechcomfest Momentum
              </h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Website ini dibangun setelah tim memenangkan MiniTechcomfest.
                Semoga kamu juga ikut kompetisinya dan bawa pulang prestasi
                berikutnya.
              </p>
            </div>
            <Link
              href="https://www.instagram.com/p/DYL1d8Ck76P/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-50 dark:border-purple-400/40 dark:bg-purple-500/10 dark:text-purple-200"
            >
              Lihat Postingan
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {activeMember ? (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 p-4 transition-opacity duration-200 ${
            isModalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 sm:p-6 ${
              isModalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close profile modal"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <Image
                  src={activeMember.image}
                  alt={`${activeMember.name} portrait`}
                  width={638}
                  height={1011}
                  unoptimized
                  className="h-[360px] w-full object-cover md:h-full"
                />
              </div>

              <div className="pt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeMember.name}
                </h3>
                <p className="mt-1 text-sm text-brand-600 dark:text-brand-300">
                  {activeMember.role}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  {getSocialEntries(activeMember).map(([socialType, href]) => {
                    const { label, Icon } = socialMeta[socialType];
                    return (
                      <Link
                        key={`${activeMember.name}-${socialType}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${activeMember.name} ${label}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes credits-row-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .credits-row-animate {
          opacity: 0;
          animation: credits-row-in 420ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
