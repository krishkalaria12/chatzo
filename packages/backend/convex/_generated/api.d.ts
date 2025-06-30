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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as chat_http_middleware from "../chat_http/middleware.js";
import type * as chat_http_routes_analytics from "../chat_http/routes/analytics.js";
import type * as chat_http_routes_chat from "../chat_http/routes/chat.js";
import type * as config_models from "../config/models.js";
import type * as config_prompts from "../config/prompts.js";
import type * as config_title_prompts from "../config/title_prompts.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as providers_base from "../providers/base.js";
import type * as providers_google from "../providers/google.js";
import type * as providers_mistral from "../providers/mistral.js";
import type * as providers_model_factory from "../providers/model_factory.js";
import type * as providers_registry from "../providers/registry.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_message from "../schemas/message.js";
import type * as schemas_thread from "../schemas/thread.js";
import type * as schemas_usage from "../schemas/usage.js";
import type * as services_analytics_service from "../services/analytics_service.js";
import type * as services_chat_service from "../services/chat_service.js";
import type * as services_middleware from "../services/middleware.js";
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
  analytics: typeof analytics;
  auth: typeof auth;
  "chat_http/middleware": typeof chat_http_middleware;
  "chat_http/routes/analytics": typeof chat_http_routes_analytics;
  "chat_http/routes/chat": typeof chat_http_routes_chat;
  "config/models": typeof config_models;
  "config/prompts": typeof config_prompts;
  "config/title_prompts": typeof config_title_prompts;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "providers/base": typeof providers_base;
  "providers/google": typeof providers_google;
  "providers/mistral": typeof providers_mistral;
  "providers/model_factory": typeof providers_model_factory;
  "providers/registry": typeof providers_registry;
  "schemas/index": typeof schemas_index;
  "schemas/message": typeof schemas_message;
  "schemas/thread": typeof schemas_thread;
  "schemas/usage": typeof schemas_usage;
  "services/analytics_service": typeof services_analytics_service;
  "services/chat_service": typeof services_chat_service;
  "services/middleware": typeof services_middleware;
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
