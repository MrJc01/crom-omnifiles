export const GOOGLE_CONFIG = {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', // User must set this in .env
    API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',     // Optional for Discovery
    DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    SCOPES: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile", // Scope for full Drive access
};
