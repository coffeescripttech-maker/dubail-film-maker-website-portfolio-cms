"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AppLogoProps {
  variant?: "full" | "icon";
  href?: string;
  className?: string;
  forceDark?: boolean; // Force dark mode logo (for dark backgrounds like auth pages)
}

interface LogoData {
  logo_light: string | null;
  logo_dark: string | null;
  logo_icon: string | null;
}

export default function AppLogo({ variant = "full", href = "/", className = "", forceDark = false }: AppLogoProps) {
  const [logoData, setLogoData] = useState<LogoData>({
    logo_light: null,
    logo_dark: null,
    logo_icon: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogoData();
  }, []);

  const fetchLogoData = async () => {
    try {
      const response = await fetch("/api/settings/logo");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched logo data:", data);
        setLogoData({
          logo_light: data.logo_light || "/images/logo/logo.svg",
          logo_dark: data.logo_dark || "/images/logo/logo-dark.svg",
          logo_icon: data.logo_icon || "/images/logo/logo-icon.svg",
        });
      } else {
        console.error("Failed to fetch logo data:", response.status);
        // Fallback to default logos
        setLogoData({
          logo_light: "/images/logo/logo.svg",
          logo_dark: "/images/logo/logo-dark.svg",
          logo_icon: "/images/logo/logo-icon.svg",
        });
      }
    } catch (error) {
      console.error("Error fetching logo data:", error);
      // Fallback to default logos
      setLogoData({
        logo_light: "/images/logo/logo.svg",
        logo_dark: "/images/logo/logo-dark.svg",
        logo_icon: "/images/logo/logo-icon.svg",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
        {variant === "icon" ? (
          <div className="w-8 h-8" />
        ) : (
          <div className="w-32 h-8" />
        )}
      </div>
    );
  }

  const LogoContent = () => {
    if (variant === "icon") {
      console.log("Rendering icon logo:", logoData.logo_icon);
      return (
        <img
          src={logoData.logo_icon || "/images/logo/logo-icon.svg"}
          alt="Logo"
          className={className}
          onError={(e) => console.error("Failed to load icon logo:", e)}
          onLoad={() => console.log("Icon logo loaded successfully")}
        />
      );
    }

    console.log("Rendering full logo - light:", logoData.logo_light, "dark:", logoData.logo_dark, "forceDark:", forceDark);
    
    // If forceDark is true, always show dark logo
    if (forceDark) {
      return (
        <img
          className={className}
          src={logoData.logo_dark || "/images/logo/logo-dark.svg"}
          alt="Logo"
          onError={(e) => console.error("Failed to load dark logo:", logoData.logo_dark, e)}
          onLoad={() => console.log("Dark logo loaded successfully:", logoData.logo_dark)}
        />
      );
    }
    
    return (
      <>
        <img
          className={`dark:hidden ${className}`}
          src={logoData.logo_light || "/images/logo/logo.svg"}
          alt="Logo"
          onError={(e) => console.error("Failed to load light logo:", logoData.logo_light, e)}
          onLoad={() => console.log("Light logo loaded successfully:", logoData.logo_light)}
        />
        <img
          className={`hidden dark:block ${className}`}
          src={logoData.logo_dark || "/images/logo/logo-dark.svg"}
          alt="Logo"
          onError={(e) => console.error("Failed to load dark logo:", logoData.logo_dark, e)}
          onLoad={() => console.log("Dark logo loaded successfully:", logoData.logo_dark)}
        />
      </>
    );
  };

  if (href) {
    return (
      <Link href={href}>
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
