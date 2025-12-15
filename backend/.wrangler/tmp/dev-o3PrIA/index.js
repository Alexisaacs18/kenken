var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-vKTX0C/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/kenken.ts
var SeededRandom = class {
  seed;
  constructor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    this.seed = Math.abs(hash) || 1;
  }
  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  randint(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  choice(arr) {
    return arr[Math.floor(this.random() * arr.length)];
  }
  shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
};
__name(SeededRandom, "SeededRandom");
function adjacent(xy1, xy2) {
  const [x1, y1] = xy1;
  const [x2, y2] = xy2;
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx === 0 && Math.abs(dy) === 1 || dy === 0 && Math.abs(dx) === 1;
}
__name(adjacent, "adjacent");
function operation(op) {
  switch (op) {
    case "+":
      return (a, b) => a + b;
    case "-":
      return (a, b) => a - b;
    case "*":
      return (a, b) => a * b;
    case "/":
      return (a, b) => a / b;
    default:
      return (a, b) => a;
  }
}
__name(operation, "operation");
function rowXorCol(xy1, xy2) {
  return xy1[0] === xy2[0] !== (xy1[1] === xy2[1]);
}
__name(rowXorCol, "rowXorCol");
function conflicting(A, a, B, b) {
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B.length; j++) {
      const mA = A[i];
      const mB = B[j];
      const ma = a[i];
      const mb = b[j];
      if (rowXorCol(mA, mB) && ma === mb) {
        return true;
      }
    }
  }
  return false;
}
__name(conflicting, "conflicting");
function product(arr, repeat) {
  if (repeat === 0)
    return [[]];
  const result = [];
  for (const item of arr) {
    for (const rest of product(arr, repeat - 1)) {
      result.push([item, ...rest]);
    }
  }
  return result;
}
__name(product, "product");
function permutations(arr) {
  if (arr.length <= 1)
    return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}
__name(permutations, "permutations");
function satisfies(values, op, target) {
  const opFn = operation(op);
  for (const perm of permutations(values)) {
    const result = perm.reduce(opFn);
    if (Math.abs(result - target) < 1e-4) {
      return true;
    }
  }
  return false;
}
__name(satisfies, "satisfies");
function gdomains(size, cliques) {
  const domains = /* @__PURE__ */ new Map();
  const numbers = Array.from({ length: size }, (_, i) => i + 1);
  for (const [members, operator, target] of cliques) {
    const membersKey = JSON.stringify(members);
    const allCombinations = product(numbers, members.length);
    const validCombinations = allCombinations.filter((values) => {
      if (conflicting(members, values, members, values)) {
        return false;
      }
      return satisfies(values, operator, target);
    });
    domains.set(membersKey, validCombinations);
  }
  return domains;
}
__name(gdomains, "gdomains");
function gneighbors(cliques) {
  const neighbors = /* @__PURE__ */ new Map();
  for (const [members] of cliques) {
    neighbors.set(JSON.stringify(members), []);
  }
  for (const [A] of cliques) {
    for (const [B] of cliques) {
      const aKey = JSON.stringify(A);
      const bKey = JSON.stringify(B);
      if (aKey !== bKey && !neighbors.get(aKey).includes(bKey)) {
        const dummyA = Array(A.length).fill(-1);
        const dummyB = Array(B.length).fill(-1);
        if (conflicting(A, dummyA, B, dummyB)) {
          neighbors.get(aKey).push(bKey);
          neighbors.get(bKey).push(aKey);
        }
      }
    }
  }
  return neighbors;
}
__name(gneighbors, "gneighbors");
function backtrackingSearch(variables, domains, neighbors, constraint) {
  const assignment = /* @__PURE__ */ new Map();
  let checks = 0;
  let assigns = 0;
  function isConsistent(varA, valA) {
    for (const varB of neighbors.get(varA) || []) {
      const valB = assignment.get(varB);
      if (valB) {
        checks++;
        if (!constraint(varA, valA, varB, valB)) {
          return false;
        }
      }
    }
    return true;
  }
  __name(isConsistent, "isConsistent");
  function search() {
    if (assignment.size === variables.length) {
      return true;
    }
    const unassigned = variables.find((v) => !assignment.has(v));
    if (!unassigned)
      return true;
    const domain = domains.get(unassigned) || [];
    for (const value of domain) {
      if (isConsistent(unassigned, value)) {
        assignment.set(unassigned, value);
        assigns++;
        if (search()) {
          return true;
        }
        assignment.delete(unassigned);
      }
    }
    return false;
  }
  __name(search, "search");
  const success = search();
  return {
    assignment: success ? assignment : null,
    checks,
    assigns
  };
}
__name(backtrackingSearch, "backtrackingSearch");
function generate(size, seed) {
  const rng = seed ? new SeededRandom(seed) : new SeededRandom(Date.now().toString());
  let board = [];
  for (let j = 0; j < size; j++) {
    const row = [];
    for (let i = 0; i < size; i++) {
      row.push((i + j) % size + 1);
    }
    board.push(row);
  }
  for (let _ = 0; _ < size; _++) {
    board = rng.shuffle(board);
  }
  for (let c1 = 0; c1 < size; c1++) {
    for (let c2 = 0; c2 < size; c2++) {
      if (rng.random() > 0.5) {
        for (let r = 0; r < size; r++) {
          [board[r][c1], board[r][c2]] = [board[r][c2], board[r][c1]];
        }
      }
    }
  }
  const boardMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      boardMap.set(JSON.stringify([j + 1, i + 1]), board[i][j]);
    }
  }
  const uncaged = [];
  for (let i = 1; i <= size; i++) {
    for (let j = 1; j <= size; j++) {
      uncaged.push([j, i]);
    }
  }
  uncaged.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const cliques = [];
  while (uncaged.length > 0) {
    const clique = [];
    const csize = rng.randint(1, 4);
    let cell = uncaged[0];
    uncaged.splice(0, 1);
    clique.push(cell);
    for (let _ = 0; _ < csize - 1; _++) {
      const adjs = uncaged.filter((other) => adjacent(cell, other));
      if (adjs.length === 0)
        break;
      cell = rng.choice(adjs);
      const idx = uncaged.findIndex((c) => c[0] === cell[0] && c[1] === cell[1]);
      uncaged.splice(idx, 1);
      clique.push(cell);
    }
    const actualSize = clique.length;
    let operator;
    let target;
    if (actualSize === 1) {
      const cell2 = clique[0];
      const value = boardMap.get(JSON.stringify(cell2));
      cliques.push([clique, "=", value]);
      continue;
    } else if (actualSize === 2) {
      const [fst, snd] = clique;
      const val1 = boardMap.get(JSON.stringify(fst));
      const val2 = boardMap.get(JSON.stringify(snd));
      if (val1 / val2 > 0 && val1 % val2 === 0) {
        operator = "/";
        target = val1 / val2;
      } else {
        operator = "-";
        target = Math.abs(val1 - val2);
      }
    } else {
      operator = rng.choice(["+", "*"]);
      const values = clique.map((c) => boardMap.get(JSON.stringify(c)));
      const opFn = operation(operator);
      target = values.reduce(opFn);
    }
    cliques.push([clique, operator, Math.floor(target)]);
  }
  return [size, cliques];
}
__name(generate, "generate");
function solve(size, cliques) {
  const startTime = Date.now();
  const variables = cliques.map(([members]) => JSON.stringify(members));
  const domains = gdomains(size, cliques);
  const neighbors = gneighbors(cliques);
  const constraint = /* @__PURE__ */ __name((varA, valA, varB, valB) => {
    if (varA === varB)
      return true;
    const membersA = JSON.parse(varA);
    const membersB = JSON.parse(varB);
    return !conflicting(membersA, valA, membersB, valB);
  }, "constraint");
  const result = backtrackingSearch(variables, domains, neighbors, constraint);
  if (!result.assignment) {
    return null;
  }
  const board = Array(size).fill(0).map(() => Array(size).fill(0));
  for (const [members] of cliques) {
    const membersKey = JSON.stringify(members);
    const values = result.assignment.get(membersKey);
    if (values) {
      for (let i = 0; i < members.length; i++) {
        const [row, col] = members[i];
        board[row - 1][col - 1] = values[i];
      }
    }
  }
  const endTime = Date.now();
  return {
    solution: board,
    checks: result.checks,
    assigns: result.assigns,
    time: (endTime - startTime) / 1e3
  };
}
__name(solve, "solve");
function cliquesToCages(cliques) {
  return cliques.map(([members, operator, target]) => ({
    cells: members.map(([row, col]) => [row - 1, col - 1]),
    operator: operator === "." ? "=" : operator,
    target
  }));
}
__name(cliquesToCages, "cliquesToCages");

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (path === "/api/generate" && method === "POST") {
      return handleGenerate(request);
    } else if (path === "/api/solve" && method === "POST") {
      return handleSolve(request);
    } else if (path === "/api/validate" && method === "POST") {
      return handleValidate(request);
    } else if (path === "/api/health" && method === "GET") {
      return new Response(JSON.stringify({ status: "ok", message: "API Worker is running" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (path === "/" && method === "GET") {
      return new Response(JSON.stringify({
        message: "KenKen API is running",
        endpoints: ["/api/generate", "/api/solve", "/api/validate", "/api/health"]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
async function handleGenerate(request) {
  try {
    const data = await request.json();
    const size = data.size || 4;
    const algorithm = data.algorithm || "FC+MRV";
    const seed = data.seed || void 0;
    const [puzzleSize, cliques] = generate(size, seed);
    const solutionResult = solve(puzzleSize, cliques);
    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: "Failed to solve generated puzzle" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const cages = cliquesToCages(cliques);
    const response = {
      puzzle: {
        size: puzzleSize,
        cages,
        solution: solutionResult.solution
      },
      stats: {
        algorithm,
        constraint_checks: solutionResult.checks,
        assignments: solutionResult.assigns,
        completion_time: solutionResult.time
      }
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error generating puzzle:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
__name(handleGenerate, "handleGenerate");
async function handleSolve(request) {
  try {
    const data = await request.json();
    const puzzleData = data.puzzle;
    const algorithm = data.algorithm || "FC+MRV";
    const size = puzzleData.size;
    const cliques = puzzleData.cages.map((cage) => {
      const cells = cage.cells.map(([row, col]) => [row + 1, col + 1]);
      const operator = cage.operator === "=" ? "." : cage.operator;
      return [cells, operator, cage.target];
    });
    const solutionResult = solve(size, cliques);
    if (!solutionResult) {
      return new Response(
        JSON.stringify({ error: "Failed to solve puzzle" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        solution: solutionResult.solution,
        stats: {
          algorithm,
          constraint_checks: solutionResult.checks,
          assignments: solutionResult.assigns,
          completion_time: solutionResult.time
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error solving puzzle:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
__name(handleSolve, "handleSolve");
async function handleValidate(request) {
  try {
    const data = await request.json();
    const puzzleData = data.puzzle;
    const board = data.board;
    const errors = [];
    for (let row = 0; row < puzzleData.size; row++) {
      const seen = /* @__PURE__ */ new Set();
      for (let col = 0; col < puzzleData.size; col++) {
        const val = board[row][col];
        if (val > 0) {
          if (seen.has(val)) {
            errors.push({
              row,
              col,
              message: `Duplicate ${val} in row`
            });
          }
          seen.add(val);
        }
      }
    }
    for (let col = 0; col < puzzleData.size; col++) {
      const seen = /* @__PURE__ */ new Set();
      for (let row = 0; row < puzzleData.size; row++) {
        const val = board[row][col];
        if (val > 0) {
          if (seen.has(val)) {
            errors.push({
              row,
              col,
              message: `Duplicate ${val} in column`
            });
          }
          seen.add(val);
        }
      }
    }
    for (const cage of puzzleData.cages) {
      const cageValues = cage.cells.map(([row, col]) => board[row][col]).filter((val) => val > 0);
      if (cageValues.length === cage.cells.length) {
        if (!evaluateCage(cage, cageValues)) {
          for (const [row, col] of cage.cells) {
            errors.push({
              row,
              col,
              message: "Cage constraint not satisfied"
            });
          }
        }
      }
    }
    return new Response(
      JSON.stringify({
        valid: errors.length === 0,
        errors
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error validating board:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
__name(handleValidate, "handleValidate");
function evaluateCage(cage, values) {
  if (cage.operator === "=") {
    return values.length === 1 && values[0] === cage.target;
  }
  const sortedValues = [...values].sort((a, b) => a - b);
  switch (cage.operator) {
    case "+":
      return sortedValues.reduce((a2, b2) => a2 + b2, 0) === cage.target;
    case "-":
      if (sortedValues.length !== 2)
        return false;
      return Math.abs(sortedValues[0] - sortedValues[1]) === cage.target;
    case "*":
      return sortedValues.reduce((a2, b2) => a2 * b2, 1) === cage.target;
    case "/":
      if (sortedValues.length !== 2)
        return false;
      const [a, b] = sortedValues;
      return a / b === cage.target || b / a === cage.target;
    default:
      return false;
  }
}
__name(evaluateCage, "evaluateCage");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-vKTX0C/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-vKTX0C/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
