import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

// Reloads the dev preview when an agent edits an issue folder.
function watchIssues() {
  return {
    name: "watch-issues",
    configureServer(server) {
      const dir = path.join(root, "src", "content", "issues");
      server.watcher.add(dir);
      const reload = (file) => {
        if (file.replaceAll("\\", "/").includes("/src/content/issues/")) {
          server.ws.send({ type: "full-reload", path: "*" });
        }
      };
      server.watcher.on("add", reload);
      server.watcher.on("change", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

// site is the future public URL. base stays "/" for a custom domain.
// A project site such as username.github.io/repo/ needs base: "/repo/".
export default defineConfig({
  site: "https://irani.cc",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [watchIssues()],
  },
});
