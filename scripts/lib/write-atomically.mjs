import fs from "fs/promises";
import path from "path";

export const writeFileAtomically = async (file, content, options = "utf8") => {
  const encoding = typeof options === "string" ? options : options?.encoding;
  const bytes = typeof content === "string" ? Buffer.from(content, encoding || "utf8") : Buffer.from(content);
  try {
    // Avoid replacing unchanged files and needlessly triggering file-sync clients.
    if ((await fs.readFile(file)).equals(bytes)) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const temporary = path.join(
    path.dirname(file),
    `.${path.basename(file)}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`
  );

  try {
    await fs.writeFile(temporary, content, options);
    await fs.rename(temporary, file);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
};
