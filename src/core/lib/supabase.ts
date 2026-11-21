import {createClient} from "@supabase/supabase-js";
import type {Database} from "./database.types";
import {getSupabaseUrl, getSupabaseAnonKey} from "./runtime-config";

// Lazy initialization - the config is read at runtime when the client is first used
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
    if (!supabaseClient) {
        const supabaseUrl = getSupabaseUrl();
        const supabaseAnonKey = getSupabaseAnonKey();

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error(
                `[supabase] Missing environment variables.\n` +
                    `The Cloudflare Pages _middleware.ts reads these at runtime from the ` +
                    `project's "Variables and secrets" settings.\n` +
                    `Verify that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY ` +
                    `(or VITE_SUPABASE_ANON_KEY) are set on the Pages project — ` +
                    `not at the account level — and that a fresh deployment was triggered.\n` +
                    `Current: URL=${supabaseUrl ? "set" : "MISSING"}, ` +
                    `key=${supabaseAnonKey ? "present" : "MISSING"}`
            );
        }

        supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
    get(target, prop, receiver) {
        const client = getSupabaseClient();
        return Reflect.get(client, prop, receiver);
    },
});
