import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = require.resolve("next/dist/bin/next");

// These are valid web-only Next.js routes, but they cannot/should not be packed
// into Capacitor's static web bundle. They are moved out only for this build and
// are always restored afterwards. Their source files are never edited.
const webOnlyEntries = [
  "pages/sitemap.xml.tsx",
  "pages/api",
  "pages/[...slug].tsx",
];

const backupRoot = await mkdtemp(path.join(projectRoot, ".capacitor-build-"));
const movedEntries = [];

async function moveOut(relativePath) {
  const source = path.join(projectRoot, relativePath);
  if (!existsSync(source)) return;

  const destination = path.join(backupRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(source, destination);
  movedEntries.push({ source, destination });
}

async function restoreAll() {
  for (const { source, destination } of movedEntries.reverse()) {
    if (!existsSync(destination)) continue;
    await mkdir(path.dirname(source), { recursive: true });
    await rename(destination, source);
  }
  await rm(backupRoot, { recursive: true, force: true });
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, "build"], {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        SEDABOX_CAPACITOR_BUILD: "1",
      },
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Next.js build terminated by signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

let exitCode = 1;

try {
  // Next.js writes generated route/type validators into .next during dev/build.
  // Because this Capacitor build temporarily hides web-only routes, stale
  // validators from a previous `next dev` can still reference those routes and
  // make TypeScript fail before the static export starts. `.next` is generated
  // build state only, so clear it for an isolated Capacitor build.
  await rm(path.join(projectRoot, ".next"), { recursive: true, force: true });

  // Avoid accidentally keeping files from an older successful export.
  await rm(path.join(projectRoot, "out"), { recursive: true, force: true });

  for (const entry of webOnlyEntries) {
    await moveOut(entry);
  }

  exitCode = await runNextBuild();
} catch (error) {
  console.error("\nCapacitor export failed:", error);
  exitCode = 1;
} finally {
  try {
    await restoreAll();
  } catch (restoreError) {
    console.error("\nIMPORTANT: failed to restore temporarily moved web routes:", restoreError);
    exitCode = 1;
  }
}

if (exitCode === 0) {
  console.log("\nCapacitor web bundle created successfully in: out/");
}

process.exitCode = exitCode;
