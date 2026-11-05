import Script from "next/script";

const themeScript = `(function(){try{var stored=localStorage.getItem("theme");var resolved=stored==="light"?"light":stored==="dark"?"dark":stored==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"dark";var root=document.documentElement;root.classList.add(resolved);root.style.colorScheme=resolved;if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){root.classList.add("motion-ok");}}catch(e){}})();`;

export function ThemeScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {themeScript}
    </Script>
  );
}
