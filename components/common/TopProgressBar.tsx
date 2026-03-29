"use client";

import NextTopLoader from "nextjs-toploader";

export default function TopProgressBar() {
  return (
    <>
      <style>{`
        .nextjs-toploader {
          top: 64px !important;
        }
      `}</style>
      <NextTopLoader
        color="#465fff"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #465fff,0 0 5px rgba(70, 95, 255, 0.5)"
        template='<div class="bar" role="bar"><div class="peg"></div></div>'
        zIndex={1600}
      />
    </>
  );
}
