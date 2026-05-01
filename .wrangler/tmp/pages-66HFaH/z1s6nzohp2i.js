// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/*"],
  exclude: ["/static/*", "/qh-logo.png"]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\DinhTungPC\\.gemini\\antigravity\\scratch\\qhboypho-main\\.wrangler\\tmp\\pages-66HFaH\\bundledWorker-0.7924675851893224.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\DinhTungPC\\.gemini\\antigravity\\scratch\\qhboypho-main\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\DinhTungPC\\.gemini\\antigravity\\scratch\\qhboypho-main\\.wrangler\\tmp\\pages-66HFaH\\bundledWorker-0.7924675851893224.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=z1s6nzohp2i.js.map
