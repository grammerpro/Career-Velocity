// ============================================================================
// CareerVelocity — Extension Background Service Worker
// Handles authentication, API communication, and side panel orchestration.
// ============================================================================

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3000"; // Updated to production URL in release

// ── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
    token: string;
    userId: string;
    email: string;
    expiresAt: number;
}

interface TailorRequest {
    type: "TAILOR_JD";
    jobDescription: string;
    companyName: string;
    jobTitle: string;
    sourceUrl: string;
}

interface TailorResponse {
    success: boolean;
    data?: {
        tailoredResume: Record<string, unknown>;
        coverLetter: string;
        atsAnalysis: {
            score: number;
            matchedKeywords: string[];
            missingKeywords: string[];
        };
    };
    error?: string;
}

// ── Authentication ──────────────────────────────────────────────────────────

/**
 * Retrieve stored auth state from extension local storage.
 */
async function getAuthState(): Promise<AuthState | null> {
    const result = await chrome.storage.local.get("cv_auth");
    const auth = result.cv_auth as AuthState | undefined;

    if (!auth) return null;

    // Check expiry
    if (Date.now() > auth.expiresAt) {
        await chrome.storage.local.remove("cv_auth");
        return null;
    }

    return auth;
}

/**
 * Store auth state after successful login.
 */
async function setAuthState(auth: AuthState): Promise<void> {
    await chrome.storage.local.set({ cv_auth: auth });
}

/**
 * Clear auth state on logout.
 */
async function clearAuthState(): Promise<void> {
    await chrome.storage.local.remove("cv_auth");
}

/**
 * Authenticate with the Next.js backend using the web app's existing session.
 * Opens a popup window to the login page, which posts back the JWT on success.
 */
async function authenticateUser(): Promise<AuthState | null> {
    return new Promise((resolve) => {
        // Open the CareerVelocity auth page in a popup
        const authUrl = `${API_BASE}/auth/extension?redirect=extension`;

        chrome.windows.create(
            {
                url: authUrl,
                type: "popup",
                width: 480,
                height: 640,
            },
            (window) => {
                if (!window?.id) {
                    resolve(null);
                    return;
                }

                const windowId = window.id;

                // Listen for the auth callback message
                const listener = (
                    message: { type: string; token: string; userId: string; email: string },
                    sender: chrome.runtime.MessageSender
                ) => {
                    if (message.type === "AUTH_SUCCESS" && sender.tab?.windowId === windowId) {
                        const auth: AuthState = {
                            token: message.token,
                            userId: message.userId,
                            email: message.email,
                            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
                        };

                        setAuthState(auth);
                        chrome.windows.remove(windowId);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(auth);
                    }
                };

                chrome.runtime.onMessage.addListener(listener);

                // Fallback: resolve null if window is closed without auth
                chrome.windows.onRemoved.addListener(function closeListener(closedId) {
                    if (closedId === windowId) {
                        chrome.windows.onRemoved.removeListener(closeListener);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(null);
                    }
                });
            }
        );
    });
}

// ── API Communication ───────────────────────────────────────────────────────

/**
 * Send the scraped JD to the backend for AI tailoring.
 */
async function tailorResume(
    auth: AuthState,
    request: TailorRequest
): Promise<TailorResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/extension/tailor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify({
                userId: auth.userId,
                jobDescription: request.jobDescription,
                companyName: request.companyName,
                jobTitle: request.jobTitle,
                sourceUrl: request.sourceUrl,
            }),
        });

        if (response.status === 401) {
            // Token expired — clear and re-auth
            await clearAuthState();
            return { success: false, error: "Session expired. Please log in again." };
        }

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: error || `Server error: ${response.status}` };
        }

        return await response.json();
    } catch (error) {
        console.error("[CV Extension] API call failed:", error);
        return {
            success: false,
            error: "Unable to reach CareerVelocity servers. Please check your connection.",
        };
    }
}

// ── Message Router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
    (
        message: { type: string;[key: string]: unknown },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
    ) => {
        switch (message.type) {
            case "CHECK_AUTH":
                getAuthState().then((auth) => {
                    sendResponse({ authenticated: !!auth, email: auth?.email });
                });
                return true; // Will respond asynchronously

            case "LOGIN":
                authenticateUser().then((auth) => {
                    sendResponse({
                        success: !!auth,
                        email: auth?.email,
                    });
                });
                return true;

            case "LOGOUT":
                clearAuthState().then(() => {
                    sendResponse({ success: true });
                });
                return true;

            case "TAILOR_JD":
                (async () => {
                    let auth = await getAuthState();

                    if (!auth) {
                        auth = await authenticateUser();
                    }

                    if (!auth) {
                        sendResponse({
                            success: false,
                            error: "Authentication required. Please log in.",
                        });
                        return;
                    }

                    const result = await tailorResume(auth, message as unknown as TailorRequest);
                    sendResponse(result);
                })();
                return true;

            case "GET_BASE_RESUMES":
                (async () => {
                    const auth = await getAuthState();
                    if (!auth) {
                        sendResponse({ success: false, error: "Not authenticated" });
                        return;
                    }

                    try {
                        const response = await fetch(`${API_BASE}/api/extension/resumes`, {
                            headers: { Authorization: `Bearer ${auth.token}` },
                        });
                        const data = await response.json();
                        sendResponse(data);
                    } catch {
                        sendResponse({ success: false, error: "Failed to fetch resumes" });
                    }
                })();
                return true;
        }
    }
);

// ── Side Panel Activation ───────────────────────────────────────────────────

// Open side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});

// Enable side panel on supported job board URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;

    const JOB_BOARD_PATTERNS = [
        /linkedin\.com\/jobs/,
        /indeed\.com\/(viewjob|jobs)/,
        /glassdoor\.com\/job-listing/,
        /boards\.greenhouse\.io\/.*\/jobs/,
        /jobs\.lever\.co\//,
    ];

    const isJobBoard = JOB_BOARD_PATTERNS.some((p) => p.test(tab.url!));

    await chrome.sidePanel.setOptions({
        tabId,
        enabled: isJobBoard,
    });
});
