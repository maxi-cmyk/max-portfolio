import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const pages = ["index.html", "404.html", "403.html"];

function localAdminRewrite(request, _response, next) {
  request.url = request.url.replace(/^\/admin(?=\?|$)/, "/admin/index.html");
  next();
}

function localNotFound(loadPage) {
  return async (request, response, next) => {
    const path = request.url.split("?", 1)[0];
    const accept = request.headers.accept ?? "*/*";
    if (
      !["GET", "HEAD"].includes(request.method) ||
      !/text\/html|\*\/\*/.test(accept) ||
      pages.includes(path.slice(1))
    ) {
      return next();
    }

    try {
      const html = await loadPage();
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : html);
    } catch (error) {
      next(error);
    }
  };
}

export default defineConfig({
  appType: "mpa",
  build: {
    rolldownOptions: { input: pages },
  },
  plugins: [
    {
      name: "portfolio-local-404",
      configureServer(server) {
        server.middlewares.use(localAdminRewrite);
        return () => {
          server.middlewares.use(
            localNotFound(async () => {
              const html = await readFile(
                resolve(server.config.root, "404.html"),
                "utf8",
              );
              return server.transformIndexHtml("/404.html", html);
            }),
          );
        };
      },
      configurePreviewServer(server) {
        server.middlewares.use(localAdminRewrite);
        const page = resolve(
          server.config.root,
          server.config.build.outDir,
          "404.html",
        );
        return () =>
          server.middlewares.use(localNotFound(() => readFile(page, "utf8")));
      },
    },
  ],
});
