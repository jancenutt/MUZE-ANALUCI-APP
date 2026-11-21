import { useEffect } from "react";

export const SITE_URL = "https://analuci.app";

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applyPageMeta({ title, description, path = "/", image, type = "website", jsonLd }) {
  const url = `${SITE_URL}${path}`;

  if (title) document.title = title;
  setMeta("name", "description", description);
  setCanonical(url);

  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:type", type);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  if (image) {
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
  }

  document.head.querySelectorAll('script[data-page-jsonld="true"]').forEach((node) => node.remove());
  if (jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-page-jsonld", "true");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

// Keeps the document head unique per route so each page is indexed on its own
// title, description, canonical URL and structured data.
export function usePageMeta(meta) {
  const key = JSON.stringify(meta);
  useEffect(() => {
    applyPageMeta(JSON.parse(key));
  }, [key]);
}