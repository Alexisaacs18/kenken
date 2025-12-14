import { onRequestOptions as __api_generate_ts_onRequestOptions } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/generate.ts"
import { onRequestPost as __api_generate_ts_onRequestPost } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/generate.ts"
import { onRequestOptions as __api_solve_ts_onRequestOptions } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/solve.ts"
import { onRequestPost as __api_solve_ts_onRequestPost } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/solve.ts"
import { onRequestOptions as __api_validate_ts_onRequestOptions } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/validate.ts"
import { onRequestPost as __api_validate_ts_onRequestPost } from "/Users/alexisaacs/Development/kenken/frontend/functions/api/validate.ts"

export const routes = [
    {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_generate_ts_onRequestOptions],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_ts_onRequestPost],
    },
  {
      routePath: "/api/solve",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_solve_ts_onRequestOptions],
    },
  {
      routePath: "/api/solve",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_solve_ts_onRequestPost],
    },
  {
      routePath: "/api/validate",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_validate_ts_onRequestOptions],
    },
  {
      routePath: "/api/validate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_validate_ts_onRequestPost],
    },
  ]