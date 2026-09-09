"use client";

import dynamic from "next/dynamic";

const PortfolioChat = dynamic(() => import("./PortfolioChat"), {
  ssr: false,
});

export default function PortfolioChatLoader() {
  return <PortfolioChat />;
}
