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
import type * as api_routes_analytics from "../api/routes/analytics.js";
import type * as auth from "../auth.js";
import type * as chat_http_middleware from "../chat_http/middleware.js";
import type * as chat_http_routes_chat from "../chat_http/routes/chat.js";
import type * as chat_http_routes_messages from "../chat_http/routes/messages.js";
import type * as chat_http_routes_threads from "../chat_http/routes/threads.js";
import type * as config_models from "../config/models.js";
import type * as config_prompts from "../config/prompts.js";
import type * as config_title_prompts from "../config/title_prompts.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_toolkit from "../lib/toolkit.js";
import type * as lib_tools_adapters_firecrawl_search_adapter from "../lib/tools/adapters/firecrawl_search_adapter.js";
import type * as lib_tools_adapters_index from "../lib/tools/adapters/index.js";
import type * as lib_tools_adapters_search_adapter from "../lib/tools/adapters/search_adapter.js";
import type * as lib_tools_adapters_search_provider from "../lib/tools/adapters/search_provider.js";
import type * as lib_tools_adapters_serper_search_adapter from "../lib/tools/adapters/serper_search_adapter.js";
import type * as lib_tools_web_search from "../lib/tools/web_search.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_message from "../schemas/message.js";
import type * as schemas_thread from "../schemas/thread.js";
import type * as schemas_usage from "../schemas/usage.js";
import type * as services_analytics_service from "../services/analytics_service.js";
import type * as services_chat_service from "../services/chat_service.js";
import type * as services_message_service from "../services/message_service.js";
import type * as services_middleware from "../services/middleware.js";
import type * as services_thread_service from "../services/thread_service.js";
import type * as services_user_service from "../services/user_service.js";
import type * as test from "../test.js";

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
  "api/routes/analytics": typeof api_routes_analytics;
  auth: typeof auth;
  "chat_http/middleware": typeof chat_http_middleware;
  "chat_http/routes/chat": typeof chat_http_routes_chat;
  "chat_http/routes/messages": typeof chat_http_routes_messages;
  "chat_http/routes/threads": typeof chat_http_routes_threads;
  "config/models": typeof config_models;
  "config/prompts": typeof config_prompts;
  "config/title_prompts": typeof config_title_prompts;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/toolkit": typeof lib_toolkit;
  "lib/tools/adapters/firecrawl_search_adapter": typeof lib_tools_adapters_firecrawl_search_adapter;
  "lib/tools/adapters/index": typeof lib_tools_adapters_index;
  "lib/tools/adapters/search_adapter": typeof lib_tools_adapters_search_adapter;
  "lib/tools/adapters/search_provider": typeof lib_tools_adapters_search_provider;
  "lib/tools/adapters/serper_search_adapter": typeof lib_tools_adapters_serper_search_adapter;
  "lib/tools/web_search": typeof lib_tools_web_search;
  "schemas/index": typeof schemas_index;
  "schemas/message": typeof schemas_message;
  "schemas/thread": typeof schemas_thread;
  "schemas/usage": typeof schemas_usage;
  "services/analytics_service": typeof services_analytics_service;
  "services/chat_service": typeof services_chat_service;
  "services/message_service": typeof services_message_service;
  "services/middleware": typeof services_middleware;
  "services/thread_service": typeof services_thread_service;
  "services/user_service": typeof services_user_service;
  test: typeof test;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
