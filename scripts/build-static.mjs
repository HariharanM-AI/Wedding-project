// Builds the invitation as a plain static site in dist/client (no Cloudflare
// runtime), for static hosts such as Vercel.
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.env.LOCAL_NODE_DEV = "1";
process.env.STATIC_EXPORT = "1";
rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), "build"];
await import(cli.href);
