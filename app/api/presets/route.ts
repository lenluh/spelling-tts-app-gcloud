import { NextResponse } from "next/server";
import { parseWords } from "@/lib/storage";

const DEFAULT_REMOTE_WORDS_URL = "http://spelling.elii.se/words/";

type Preset = {
  id: string;
  name: string;
  words: string[];
  modifiedAt: number;
  order: number;
};

function toAbsoluteUrl(baseUrl: string, href: string): string {
  return new URL(href, baseUrl).toString();
}

function getTxtLinksFromHtml(html: string, baseUrl: string): string[] {
  const hrefRegex = /href=["']([^"']+\.txt(?:\?[^"']*)?)["']/gi;
  const links = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    links.add(toAbsoluteUrl(baseUrl, href));
  }

  return [...links];
}

function fileNameFromUrl(fileUrl: string): string {
  const pathname = new URL(fileUrl).pathname;
  const raw = pathname.split("/").filter(Boolean).pop() ?? "word-list.txt";
  return decodeURIComponent(raw);
}

export async function GET() {
  const configuredUrl = process.env.WORD_LISTS_URL;
  const wordsUrl = configuredUrl && configuredUrl.trim().length > 0 ? configuredUrl : DEFAULT_REMOTE_WORDS_URL;

  try {
    const indexResponse = await fetch(wordsUrl, { cache: "no-store" });
    if (!indexResponse.ok) {
      return NextResponse.json({ source: wordsUrl, presets: [] });
    }

    const html = await indexResponse.text();
    const txtUrls = getTxtLinksFromHtml(html, wordsUrl);

    const presetsWithMeta = await Promise.all(
      txtUrls.map(async (fileUrl, index) => {
        const response = await fetch(fileUrl, { cache: "no-store" });
        if (!response.ok) return null;

        const content = await response.text();
        const words = parseWords(content);
        const fileName = fileNameFromUrl(fileUrl);

        let modifiedAt = 0;
        const lastModified = response.headers.get("last-modified");
        if (lastModified) {
          const ts = Date.parse(lastModified);
          if (!Number.isNaN(ts)) modifiedAt = ts;
        }

        const preset: Preset = {
          id: fileName,
          name: fileName.replace(/\.txt$/i, ""),
          words,
          modifiedAt,
          order: index,
        };

        return preset;
      })
    );

    const presets = presetsWithMeta
      .filter((preset): preset is Preset => preset !== null)
      .filter((preset) => preset.words.length > 0)
      .sort((a, b) => {
        if (a.modifiedAt && b.modifiedAt) return b.modifiedAt - a.modifiedAt;
        if (a.modifiedAt) return -1;
        if (b.modifiedAt) return 1;
        return b.order - a.order;
      })
      .map(({ modifiedAt: _modifiedAt, order: _order, ...preset }) => preset);

    return NextResponse.json({ source: wordsUrl, presets });
  } catch {
    return NextResponse.json({ source: wordsUrl, presets: [] });
  }
}
