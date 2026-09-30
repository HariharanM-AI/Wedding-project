import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const nodeModulesDir = path.join(rootDir, "node_modules");
const pnpmDir = path.join(nodeModulesDir, ".pnpm");

console.log("Re-indexing .pnpm packages with version awareness...");

if (!fs.existsSync(pnpmDir)) {
  console.error("node_modules/.pnpm does not exist!");
  process.exit(1);
}

const pnpmEntries = fs.readdirSync(pnpmDir);

// Map of pkgName -> Array of { version, dir, entryDir }
const allVersions = new Map();

for (const entry of pnpmEntries) {
  const entryPath = path.join(pnpmDir, entry);
  try {
    const stat = fs.statSync(entryPath);
    if (!stat.isDirectory()) continue;
  } catch (e) {
    continue;
  }

  const innerNodeModules = path.join(entryPath, "node_modules");
  if (!fs.existsSync(innerNodeModules)) continue;

  const scanInner = (dir, scope = "") => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item.startsWith("@")) {
        scanInner(path.join(dir, item), item);
      } else {
        const pkgName = scope ? `${scope}/${item}` : item;
        const targetDir = path.join(dir, item);
        const pkgJsonPath = path.join(targetDir, "package.json");
        let version = "0.0.0";
        if (fs.existsSync(pkgJsonPath)) {
          try {
            const p = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
            version = p.version || "0.0.0";
          } catch (e) {}
        }
        if (!allVersions.has(pkgName)) {
          allVersions.set(pkgName, []);
        }
        allVersions.get(pkgName).push({ version, targetDir, entryPath });
      }
    }
  };

  try {
    scanInner(innerNodeModules);
  } catch (e) {}
}

console.log(`Indexed ${allVersions.size} package names across .pnpm`);

// Simple semver compare (descending)
const compareVersions = (v1, v2) => {
  const p1 = v1.split(/[-.+]/)[0].split(".").map(Number);
  const p2 = v2.split(/[-.+]/)[0].split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 !== n2) return n2 - n1;
  }
  return 0;
};

// 1. Link top-level packages in node_modules, choosing the latest version
for (const [pkgName, list] of allVersions.entries()) {
  list.sort((a, b) => compareVersions(a.version, b.version));
  const best = list[0]; // newest version

  const destDir = path.join(nodeModulesDir, ...pkgName.split("/"));

  // If already exists as junction/symlink, re-link to best
  try {
    const stat = fs.lstatSync(destDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destDir);
    }
  } catch (e) {}

  if (!fs.existsSync(destDir)) {
    const parentDir = path.dirname(destDir);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    try {
      fs.symlinkSync(best.targetDir, destDir, "junction");
    } catch (e) {}
  }
}

// 2. For strip-literal and other nested dependencies, link their declared dependencies inside their .pnpm entry
for (const entry of pnpmEntries) {
  const entryPath = path.join(pnpmDir, entry);
  const innerNodeModules = path.join(entryPath, "node_modules");
  if (!fs.existsSync(innerNodeModules)) continue;

  const items = fs.readdirSync(innerNodeModules);
  for (const item of items) {
    if (item.startsWith("@")) continue;
    const pkgDir = path.join(innerNodeModules, item);
    const pkgJsonPath = path.join(pkgDir, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;

    try {
      const p = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      const deps = { ...p.dependencies, ...p.peerDependencies };
      for (const depName of Object.keys(deps)) {
        const depDest = path.join(innerNodeModules, ...depName.split("/"));
        if (!fs.existsSync(depDest)) {
          const depList = allVersions.get(depName);
          if (depList && depList.length > 0) {
            depList.sort((a, b) => compareVersions(a.version, b.version));
            const depTarget = depList[0].targetDir;
            const parent = path.dirname(depDest);
            if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
            try {
              fs.symlinkSync(depTarget, depDest, "junction");
            } catch (err) {}
          }
        }
      }
    } catch (e) {}
  }
}

console.log("Re-indexing & relinking complete!");
