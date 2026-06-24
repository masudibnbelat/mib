"use client";
import { useRef, useLayoutEffect } from "react";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export function ArticleContent({
  content,
  className = "",
}: ArticleContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const injectedRef = useRef<WeakSet<Element>>(new WeakSet());

  // ✅ useLayoutEffect — DOM update এর সাথে সাথে run করে
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const pres = el.querySelectorAll("pre");

    pres.forEach((pre, index) => {
      if (injectedRef.current.has(pre)) return;

      const codeEl = pre.querySelector("code") || pre;
      const codeId = `mib-code-${index}`;
      codeEl.id = codeId;

      // wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "relative group my-4";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // header bar
      const header = document.createElement("div");
      header.className = [
        "absolute top-0 left-0 right-0 z-10",
        "flex items-center justify-between px-4 py-2",
        "bg-[#282a36] border-b border-gray-700/60",
        "rounded-t-lg select-none",
      ].join(" ");

      const label = document.createElement("span");
      label.className =
        "text-[11px] text-gray-400 font-sans font-semibold uppercase tracking-widest";
      label.textContent = "Code";

      // copy button
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = [
        "flex items-center gap-1.5",
        "text-xs font-medium text-gray-400",
        "hover:text-white transition-colors",
        "cursor-pointer outline-none",
      ].join(" ");

      btn.innerHTML = `
        <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span class="btn-text">Copy code</span>
      `;

      btn.addEventListener("click", () => {
        const text = codeEl.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
          const iconEl = btn.querySelector(".copy-icon");
          const textEl = btn.querySelector(".btn-text");

          if (iconEl) {
            iconEl.outerHTML = `
              <svg class="copy-icon text-green-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            `;
          }
          if (textEl) {
            textEl.textContent = "Copied!";
            textEl.className = "btn-text text-green-400";
          }

          setTimeout(() => {
            const iconNow = btn.querySelector(".copy-icon");
            const textNow = btn.querySelector(".btn-text");

            if (iconNow) {
              iconNow.outerHTML = `
                <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              `;
            }
            if (textNow) {
              textNow.textContent = "Copy code";
              textNow.className = "btn-text";
            }
          }, 2000);
        });
      });

      header.appendChild(label);
      header.appendChild(btn);
      wrapper.appendChild(header);

      pre.style.paddingTop = "3rem";

      injectedRef.current.add(pre);
    });

    // ✅ Fallback: যদি <pre> না পাওয়া যায়, <code> খুঁজো
    if (pres.length === 0) {
      const codes = el.querySelectorAll("code");
      codes.forEach((codeEl, index) => {
        if (injectedRef.current.has(codeEl)) return;
        if (codeEl.closest("[data-injected]")) return;

        const codeId = `mib-code-fb-${index}`;
        codeEl.id = codeId;

        const parent = codeEl.parentElement;
        if (!parent) return;

        const wrapper = document.createElement("div");
        wrapper.className = "relative group my-4";
        wrapper.setAttribute("data-injected", "true");
        parent.parentNode?.insertBefore(wrapper, parent);
        wrapper.appendChild(parent);

        const header = document.createElement("div");
        header.className = [
          "absolute top-0 left-0 right-0 z-10",
          "flex items-center justify-between px-4 py-2",
          "bg-[#282a36] border-b border-gray-700/60",
          "rounded-t-lg select-none",
        ].join(" ");

        const label = document.createElement("span");
        label.className =
          "text-[11px] text-gray-400 font-sans font-semibold uppercase tracking-widest";
        label.textContent = "Code";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = [
          "flex items-center gap-1.5",
          "text-xs font-medium text-gray-400",
          "hover:text-white transition-colors",
          "cursor-pointer outline-none",
        ].join(" ");

        btn.innerHTML = `
          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span class="btn-text">Copy code</span>
        `;

        btn.addEventListener("click", () => {
          const text = codeEl.textContent || "";
          navigator.clipboard.writeText(text).then(() => {
            const iconEl = btn.querySelector(".copy-icon");
            const textEl = btn.querySelector(".btn-text");

            if (iconEl) {
              iconEl.outerHTML = `
                <svg class="copy-icon text-green-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              `;
            }
            if (textEl) {
              textEl.textContent = "Copied!";
              textEl.className = "btn-text text-green-400";
            }

            setTimeout(() => {
              const iconNow = btn.querySelector(".copy-icon");
              const textNow = btn.querySelector(".btn-text");

              if (iconNow) {
                iconNow.outerHTML = `
                  <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                `;
              }
              if (textNow) {
                textNow.textContent = "Copy code";
                textNow.className = "btn-text";
              }
            }, 2000);
          });
        });

        header.appendChild(label);
        header.appendChild(btn);
        wrapper.appendChild(header);

        parent.style.paddingTop = "3rem";

        injectedRef.current.add(codeEl);
      });
    }
  }, [content]);

  return (
    <div
      ref={ref}
      className={[
        "max-w-none",
        "[&_pre]:bg-[#1e1e24] [&_pre]:border [&_pre]:border-violet-500/20",
        "[&_pre]:rounded-lg [&_pre]:overflow-hidden",
        "[&_pre_code]:block [&_pre_code]:p-4 [&_pre_code]:font-mono",
        "[&_pre_code]:text-sm [&_pre_code]:leading-relaxed [&_pre_code]:text-gray-200",
        "[&_pre_code]:overflow-x-auto",
        "[&_code]:bg-violet-500/15 [&_code]:px-1.5 [&_code]:py-0.5",
        "[&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_code]:text-violet-300",
        "[&_p]:mb-2 [&_p]:leading-relaxed",
        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6",
        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-violet-500",
        "[&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic",
        "[&_blockquote]:text-gray-400",
        "[&_a]:text-violet-400 [&_a]:underline [&_a]:hover:text-violet-300",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
