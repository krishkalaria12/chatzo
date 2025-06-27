/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as config_models from "../config/models.js";
import type * as config_prompts from "../config/prompts.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as providers_base from "../providers/base.js";
import type * as providers_google from "../providers/google.js";
import type * as providers_mistral from "../providers/mistral.js";
import type * as providers_registry from "../providers/registry.js";
import type * as test from "../test.js";
import type * as todos from "../todos.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  "config/models": typeof config_models;
  "config/prompts": typeof config_prompts;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "providers/base": typeof providers_base;
  "providers/google": typeof providers_google;
  "providers/mistral": typeof providers_mistral;
  "providers/registry": typeof providers_registry;
  test: typeof test;
  todos: typeof todos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
