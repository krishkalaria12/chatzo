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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as chat_http_generate_thread_name from "../chat_http/generate_thread_name.js";
import type * as chat_http_get_model from "../chat_http/get_model.js";
import type * as chat_http_image_generation from "../chat_http/image_generation.js";
import type * as chat_http_manual_stream_transform from "../chat_http/manual_stream_transform.js";
import type * as chat_http_routes_chat from "../chat_http/routes/post_chat.js";
import type * as chat_http_shared from "../chat_http/shared.js";
import type * as config_models from "../config/models.js";
import type * as config_prompts from "../config/prompts.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_backend_to_ui_messages from "../lib/backend_to_ui_messages.js";
import type * as lib_cloudinary from "../lib/cloudinary.js";
import type * as lib_db_to_core_messages from "../lib/db_to_core_messages.js";
import type * as lib_delayed_promise from "../lib/delayed_promise.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_file_constants from "../lib/file_constants.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_toolkit from "../lib/toolkit.js";
import type * as lib_tools_adapters_firecrawl_search_adapter from "../lib/tools/adapters/firecrawl_search_adapter.js";
import type * as lib_tools_adapters_index from "../lib/tools/adapters/index.js";
import type * as lib_tools_adapters_search_adapter from "../lib/tools/adapters/search_adapter.js";
import type * as lib_tools_adapters_search_providers from "../lib/tools/adapters/search_providers.js";
import type * as lib_tools_adapters_serper_search_adapter from "../lib/tools/adapters/serper_search_adapter.js";
import type * as lib_tools_supermemory from "../lib/tools/supermemory.js";
import type * as lib_tools_web_search from "../lib/tools/web_search.js";
import type * as messages from "../messages.js";
import type * as models from "../models.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_message from "../schemas/message.js";
import type * as schemas_parts from "../schemas/parts.js";
import type * as schemas_settings from "../schemas/settings.js";
import type * as schemas_thread from "../schemas/thread.js";
import type * as schemas_usage from "../schemas/usage.js";
import type * as settings from "../settings.js";
import type * as test from "../test.js";
import type * as threads from "../threads.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  "chat_http/generate_thread_name": typeof chat_http_generate_thread_name;
  "chat_http/get_model": typeof chat_http_get_model;
  "chat_http/image_generation": typeof chat_http_image_generation;
  "chat_http/manual_stream_transform": typeof chat_http_manual_stream_transform;
  "chat_http/routes/chat": typeof chat_http_routes_chat;
  "chat_http/shared": typeof chat_http_shared;
  "config/models": typeof config_models;
  "config/prompts": typeof config_prompts;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/backend_to_ui_messages": typeof lib_backend_to_ui_messages;
  "lib/cloudinary": typeof lib_cloudinary;
  "lib/db_to_core_messages": typeof lib_db_to_core_messages;
  "lib/delayed_promise": typeof lib_delayed_promise;
  "lib/encryption": typeof lib_encryption;
  "lib/errors": typeof lib_errors;
  "lib/file_constants": typeof lib_file_constants;
  "lib/identity": typeof lib_identity;
  "lib/toolkit": typeof lib_toolkit;
  "lib/tools/adapters/firecrawl_search_adapter": typeof lib_tools_adapters_firecrawl_search_adapter;
  "lib/tools/adapters/index": typeof lib_tools_adapters_index;
  "lib/tools/adapters/search_adapter": typeof lib_tools_adapters_search_adapter;
  "lib/tools/adapters/search_providers": typeof lib_tools_adapters_search_providers;
  "lib/tools/adapters/serper_search_adapter": typeof lib_tools_adapters_serper_search_adapter;
  "lib/tools/supermemory": typeof lib_tools_supermemory;
  "lib/tools/web_search": typeof lib_tools_web_search;
  messages: typeof messages;
  models: typeof models;
  "schemas/index": typeof schemas_index;
  "schemas/message": typeof schemas_message;
  "schemas/parts": typeof schemas_parts;
  "schemas/settings": typeof schemas_settings;
  "schemas/thread": typeof schemas_thread;
  "schemas/usage": typeof schemas_usage;
  settings: typeof settings;
  test: typeof test;
  threads: typeof threads;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
