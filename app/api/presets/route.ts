import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { parseWords } from "@/lib/storage";

const DEFAULT_PRESETS_DIR = path.join(process.cwd(), "word-lists");

export async function GET() {
  const configuredDir = process.env.WORD_LISTS_DIR;
  const presetsDir = configuredDir && configuredDir.trim().length > 0 ? configuredDir : DEFAULT_PRESETS_DIR;

  try {
    const entries = await fs.readdir(presetsDir, { withFileTypes: true });

    const txtFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"));

    const presetsWithMeta = await Promise.all(
      txtFiles.map(async (entry) => {
        const fileName = entry.name;
        const fullPath = path.join(presetsDir, fileName);
        const [content, stats] = await Promise.all([fs.readFile(fullPath, "utf8"), fs.stat(fullPath)]);
        const words = parseWords(content);

        return {
          id: fileName,
          name: fileName.replace(/\.txt$/i, ""),
          words,
          modifiedAt: stats.mtimeMs,
        };
      })
    );

    const presets = presetsWithMeta
      .filter((preset) => preset.words.length > 0)
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .map(({ modifiedAt: _modifiedAt, ...preset }) => preset);

    return NextResponse.json({ presetsDir, presets });
  } catch {
    return NextResponse.json({ presetsDir, presets: [] });
  }
}
