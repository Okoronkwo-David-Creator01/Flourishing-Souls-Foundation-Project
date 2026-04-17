import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// PRODUCTION SocialAuth BUTTONS:
// - Google (OAuth)
// - Github (OAuth)
// - Apple (OAuth, for iOS/macOS users, if configured)
// - Handles real auth flows, errors, and states

/**
 * Provides production-ready social login buttons.
 * - Calls Supabase for OAuth flows
 * - Shows real errors
 * - Redirects to dashboard/home after successful login
 */
const PROVIDERS = [
  {
    key: "google",
    label: "Continue with Google",
    colorClass: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
    icon: (
      <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
        <g>
          <path
            d="M44.5 20H24v8.5h11.8C34.3 33.5 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.6 1.1 7.7 2.7l6.4-6.4C34.1 5.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.7-.3-4z"
            fill="#fbc02d"
          />
          <path
            d="M6.3 14.1l7 5.1C15.6 16 19.5 13 24 13c3 0 5.6 1.1 7.7 2.7l6.4-6.4C34.1 5.7 29.3 4 24 4c-6.1 0-11.4 2.8-15 7.1l-2.7 3z"
            fill="#e53935"
          />
          <path
            d="M24 44c5.6 0 10.3-1.8 13.7-4.8l-6.5-5.4C29.9 35.9 27.1 37 24 37c-5.7 0-10.3-3.4-12-8.2l-7 5.4C7.7 40.7 15.2 44 24 44z"
            fill="#4caf50"
          />
          <path
            d="M44.5 20H24v8.5h11.8c-1.1 3.2-4.2 5.5-7.8 5.5-3.1 0-5.8-2.1-6.7-5.1H7.4v6.7C9.8 40.4 16.4 44 24 44c9.2 0 17.2-6.1 19.8-14.3-2.6-4.7-8.4-9.7-16.5-9.7z"
            fill="#1565c0"
          />
        </g>
      </svg>
    ),
  },
  {
    key: "github",
    label: "Continue with GitHub",
    colorClass: "bg-gray-900 text-white hover:bg-gray-800",
    icon: (
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.026 2c-5.51 0-9.974 4.465-9.974 9.974 0 4.406 2.867 8.142 6.839 9.466.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.604-3.37-1.339-3.37-1.339-.454-1.154-1.11-1.461-1.11-1.461-.909-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.893 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.111-4.555-4.944 0-1.091.39-1.984 1.03-2.682-.104-.253-.447-1.273.098-2.654 0 0 .84-.27 2.75 1.026A9.558 9.558 0 0112 6.844a9.57 9.57 0 012.507.337c1.91-1.296 2.75-1.026 2.75-1.026.546 1.381.203 2.401.1 2.654.641.698 1.03 1.591 1.03 2.682 0 3.842-2.337 4.687-4.565 4.936.36.309.684.919.684 1.854 0 1.338-.012 2.421-.012 2.751 0 .268.18.579.688.481C19.135 20.112 22 16.377 22 11.974 22 6.465 17.535 2 12.026 2z"
        />
      </svg>
    ),
  },
  {
    key: "apple",
    label: "Continue with Apple",
    colorClass: "bg-black text-white hover:bg-gray-900",
    icon: (
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
        <g>
          <path
            d="M16.365 1.43c0 1.14-.935 2.056-1.866 2.056-.07 0-.144-.008-.218-.025-.098-.017-.195-.033-.292-.048-.157-.025-.314-.05-.47-.084-.169-.032-.33-.075-.496-.118-.055-.011-.107-.021-.153-.042-.127-.054-.26-.1-.386-.148-.276-.1-.548-.2-.818-.308a2.118 2.118 0 01-.687-.452c-.23-.186-.478-.35-.715-.549-.367-.308-.69-.679-.958-1.113-.045-.07-.086-.143-.127-.216-.12-.211-.2-.447-.277-.687-.064-.204-.1-.422-.122-.652-.017-.147-.03-.294-.05-.442-.022-.169-.055-.336-.08-.506-.044-.311-.105-.619-.174-.924A2.056 2.056 0 017.806.867c.073.012.147.028.214.056.152.056.298.13.441.21.22.121.435.259.648.406.202.134.4.275.596.429.108.087.216.175.306.281a2.006 2.006 0 01.305.41c.465.579.905 1.205 1.346 1.834.058.076.116.153.168.234.026.039.053.077.081.118zm-3.264 3.628c2.417 0 3.998 1.31 3.998 3.073 0 2.045-1.887 3.411-4.321 3.411-2.559 0-4.251-1.385-4.251-3.419 0-1.729 1.688-3.065 4.33-3.065 0-.001.12 0 .244 0z"
            fill="#fff"
          />
          <path
            d="M19.741 12.706c-.047-.035-.096-.065-.146-.094-.592-.398-1.086-.9-1.444-1.57-.378-.715-.502-1.385-.507-1.419.011-.039.017-.079.027-.12.664-2.882-1.165-5.965-4.154-7.064-3.181-1.184-6.774-.437-8.956 1.814-2.116 2.178-2.356 5.551-.936 8.127.446.803 1.099 1.668 2.106 2.394.067.051.13.105.195.157.422.32.909.617 1.473.893.735.366 1.541.645 2.396.773 2.006.295 4.395.036 6.469-1.088 1.62-.898 2.864-2.427 3.237-3.482z"
            fill="#fff"
          />
        </g>
      </svg>
    ),
  },
];

const SocialAuth = ({ redirectTo = "/" }) => {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle social login by calling Supabase OAuth
  const handleSocialSignIn = async (providerKey) => {
    setError("");
    setLoadingProvider(providerKey);

    let provider = providerKey;
    // Map any naming differences if necessary - Supabase: "github", "google", "apple"

    try {
      const { error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });

      // If Supabase returns error immediately (rare)
      if (supabaseError) {
        setError(supabaseError.message || "Failed to authenticate. Try again.");
        setLoadingProvider(null);
      }
      // Supabase will take over with redirect. (No further action required here.)
    } catch {
      setError("Unexpected error during social authentication. Please try again.");
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3 text-xs">
          {error}
        </div>
      )}

      {PROVIDERS.map(({ key, label, colorClass, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSocialSignIn(key)}
          className={`flex items-center justify-center w-full py-2 px-4 rounded-md font-semibold shadow-sm transition-colors duration-150 ${colorClass} ${
            loadingProvider === key ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={!!loadingProvider}
          aria-label={label}
        >
          {icon}
          {loadingProvider === key ? `Redirecting...` : label}
        </button>
      ))}
    </div>
  );
};

export default SocialAuth;