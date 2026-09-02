import fs from "fs/promises";
import path from "path";

export const writeFileAtomically = async (file, content, options = "utf8") => {
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
