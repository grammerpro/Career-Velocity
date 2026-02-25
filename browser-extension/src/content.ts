// ============================================================================
// CareerVelocity — Content Script
// Injects floating "Optimize with CareerVelocity" button into job board DOMs
// and scrapes job description text when triggered.
// ============================================================================

// ── Job Board Scrapers ──────────────────────────────────────────────────────

interface ScrapedJob {
    jobDescription: string;
    companyName: string;
    jobTitle: string;
    sourceUrl: string;
}

/**
 * LinkedIn Jobs scraper.
 * Targets the job detail pane on linkedin.com/jobs/*
 */
function scrapeLinkedIn(): ScrapedJob | null {
    // Job description container
    const descEl =
        document.querySelector(".jobs-description__content") ??
        document.querySelector(".jobs-box__html-content") ??
        document.querySelector('[class*="job-details"]') ??
        document.querySelector("#job-details");

    // Company name
    const companyEl =
        document.querySelector(".job-details-jobs-unified-top-card__company-name a") ??
        document.querySelector(".jobs-unified-top-card__company-name a") ??
        document.querySelector('[class*="topcard__org-name"]');

    // Job title
    const titleEl =
        document.querySelector(".job-details-jobs-unified-top-card__job-title h1") ??
        document.querySelector(".jobs-unified-top-card__job-title") ??
        document.querySelector('[class*="topcard__title"]');

    if (!descEl?.textContent) return null;

    return {
        jobDescription: descEl.textContent.trim(),
        companyName: companyEl?.textContent?.trim() ?? "Unknown Company",
        jobTitle: titleEl?.textContent?.trim() ?? "Unknown Position",
        sourceUrl: window.location.href,
    };
}

/**
 * Indeed scraper.
 * Targets the job detail view on indeed.com/viewjob*
 */
function scrapeIndeed(): ScrapedJob | null {
    const descEl =
        document.querySelector("#jobDescriptionText") ??
        document.querySelector(".jobsearch-jobDescriptionText") ??
        document.querySelector('[class*="jobDescription"]');

    const companyEl =
        document.querySelector('[data-testid="inlineHeader-companyName"]') ??
        document.querySelector(".jobsearch-InlineCompanyRating-companyHeader a") ??
        document.querySelector('[class*="CompanyName"]');

    const titleEl =
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ??
        document.querySelector(".jobsearch-JobInfoHeader-title") ??
        document.querySelector("h1");

    if (!descEl?.textContent) return null;

    return {
        jobDescription: descEl.textContent.trim(),
        companyName: companyEl?.textContent?.trim() ?? "Unknown Company",
        jobTitle: titleEl?.textContent?.trim() ?? "Unknown Position",
        sourceUrl: window.location.href,
    };
}

/**
 * Greenhouse scraper.
 */
function scrapeGreenhouse(): ScrapedJob | null {
    const descEl = document.querySelector("#content .content");
    const titleEl = document.querySelector(".app-title");

    if (!descEl?.textContent) return null;

    return {
        jobDescription: descEl.textContent.trim(),
        companyName: document.title.split(" at ")[1]?.split(" - ")[0]?.trim() ?? "Unknown Company",
        jobTitle: titleEl?.textContent?.trim() ?? "Unknown Position",
        sourceUrl: window.location.href,
    };
}

/**
 * Lever scraper.
 */
function scraperLever(): ScrapedJob | null {
    const sections = document.querySelectorAll(".section-wrapper .section");
    const descTexts: string[] = [];
    sections.forEach((s) => {
        if (s.textContent) descTexts.push(s.textContent.trim());
    });

    const titleEl = document.querySelector(".posting-headline h2");

    if (descTexts.length === 0) return null;

    return {
        jobDescription: descTexts.join("\n\n"),
        companyName: document.querySelector(".posting-headline .sort-by-time")?.textContent?.trim() ?? "Unknown Company",
        jobTitle: titleEl?.textContent?.trim() ?? "Unknown Position",
        sourceUrl: window.location.href,
    };
}

/**
 * Generic fallback scraper — extracts the closest reasonable job description.
 */
function scrapeGeneric(): ScrapedJob | null {
    // Try common patterns
    const selectors = [
        '[class*="job-description"]',
        '[class*="jobDescription"]',
        '[id*="job-description"]',
        '[class*="description"]',
        "article",
        "main",
    ];

    let descEl: Element | null = null;
    for (const sel of selectors) {
        descEl = document.querySelector(sel);
        if (descEl?.textContent && descEl.textContent.length > 200) break;
    }

    if (!descEl?.textContent || descEl.textContent.length < 100) return null;

    return {
        jobDescription: descEl.textContent.trim().slice(0, 10000),
        companyName: "Unknown Company",
        jobTitle: document.title.split(/[|–—-]/)[0]?.trim() ?? "Unknown Position",
        sourceUrl: window.location.href,
    };
}

// ── Scraper Router ──────────────────────────────────────────────────────────

function scrapeCurrentPage(): ScrapedJob | null {
    const url = window.location.href;

    if (url.includes("linkedin.com")) return scrapeLinkedIn();
    if (url.includes("indeed.com")) return scrapeIndeed();
    if (url.includes("greenhouse.io")) return scrapeGreenhouse();
    if (url.includes("lever.co")) return scraperLever();

    return scrapeGeneric();
}

// ── Floating Action Button ──────────────────────────────────────────────────

function injectFloatingButton(): void {
    // Prevent duplicate injection
    if (document.getElementById("cv-optimize-fab")) return;

    const fab = document.createElement("button");
    fab.id = "cv-optimize-fab";
    fab.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 4V2"/>
      <path d="M15 16v-2"/>
      <path d="M8 9h2"/>
      <path d="M20 9h2"/>
      <path d="M17.8 11.8 19 13"/>
      <path d="M15 9h.01"/>
      <path d="M17.8 6.2 19 5"/>
      <path d="m3 21 9-9"/>
      <path d="M12.2 6.2 11 5"/>
    </svg>
    <span class="cv-fab-label">Optimize with CareerVelocity</span>
  `;

    fab.addEventListener("click", handleOptimizeClick);
    document.body.appendChild(fab);
}

// ── Click Handler ───────────────────────────────────────────────────────────

async function handleOptimizeClick(): Promise<void> {
    const fab = document.getElementById("cv-optimize-fab");
    if (!fab) return;

    // Show loading state
    fab.classList.add("cv-fab-loading");
    const label = fab.querySelector(".cv-fab-label");
    if (label) label.textContent = "Scraping job details…";

    // Scrape the page
    const scraped = scrapeCurrentPage();

    if (!scraped || scraped.jobDescription.length < 50) {
        showToast("Could not extract job description from this page.", "error");
        resetFab(fab);
        return;
    }

    if (label) label.textContent = "Sending to AI engine…";

    // Send to background script → API
    chrome.runtime.sendMessage(
        {
            type: "TAILOR_JD",
            jobDescription: scraped.jobDescription,
            companyName: scraped.companyName,
            jobTitle: scraped.jobTitle,
            sourceUrl: scraped.sourceUrl,
        },
        (response: { success: boolean; error?: string }) => {
            if (response?.success) {
                showToast("Resume tailored! Opening sidebar…", "success");
                // The side panel will be populated by the background script
                chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
            } else {
                showToast(
                    response?.error ?? "Failed to tailor resume. Please try again.",
                    "error"
                );
            }
            resetFab(fab);
        }
    );
}

function resetFab(fab: HTMLElement): void {
    fab.classList.remove("cv-fab-loading");
    const label = fab.querySelector(".cv-fab-label");
    if (label) label.textContent = "Optimize with CareerVelocity";
}

// ── Toast Notification ──────────────────────────────────────────────────────

function showToast(message: string, type: "success" | "error"): void {
    // Remove existing toast
    document.getElementById("cv-toast")?.remove();

    const toast = document.createElement("div");
    toast.id = "cv-toast";
    toast.className = `cv-toast cv-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add("cv-toast-exit");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Initialize ──────────────────────────────────────────────────────────────

// Wait for page to settle before injecting (SPAs like LinkedIn load async)
function waitForContent(): void {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
        attempts++;
        const scrapeResult = scrapeCurrentPage();

        if (scrapeResult || attempts >= maxAttempts) {
            clearInterval(interval);
            injectFloatingButton();
        }
    }, 500);
}

// LinkedIn uses client-side routing — reinject on navigation
if (window.location.href.includes("linkedin.com")) {
    const observer = new MutationObserver(() => {
        if (!document.getElementById("cv-optimize-fab")) {
            injectFloatingButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

waitForContent();
