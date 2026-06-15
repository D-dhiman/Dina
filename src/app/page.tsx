"use client"; // Required for next-i18next client-side execution in Next.js App Router

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function WelcomePage() {
  const { t, i18n } = useTranslation();

  // Helper function to change language
  const changeLanguage = (lng: "en" | "hi") => {
    i18n.changeLanguage(lng);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 dina-background relative">
      
      {/* Language Switcher Sticky Menu (Top Right) */}
      <div className="absolute top-4 right-4 flex gap-2 bg-white/10 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
        <button
          onClick={() => changeLanguage("en")}
          className={`px-3 py-1 text-sm rounded transition-all ${
            i18n.language === "en" 
              ? "bg-emerald-600 text-white font-semibold shadow-sm" 
              : "text-gray-300 hover:text-white"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage("hi")}
          className={`px-3 py-1 text-sm rounded transition-all ${
            i18n.language === "hi" 
              ? "bg-emerald-600 text-white font-semibold shadow-sm" 
              : "text-gray-300 hover:text-white"
          }`}
        >
          हिन्दी
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        {/* Logo Container */}
        <div className="dina-logo-container mb-9">
          <Image
            src="/konak-wheel.svg"
            alt="DINA-AI Logo"
            width={70}
            height={70}
            priority
          />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-1 justify-center flex-wrap mb-17">
          <p className="dina-heading">DINA-AI</p>
          <p className="dina-catchphrase">
            {t("catchphrase")}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="dina-button"
          >
            {t("login")}
          </Link>
          <Link
            href="/dashboard"
            className="dina-button"
          >
            {t("continueGuest")}
          </Link>
        </div>
      </div>
    </main>
  );
}