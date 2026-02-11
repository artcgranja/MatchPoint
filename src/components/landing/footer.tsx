"use client";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "/search", label: "Get Started" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 md:py-16 border-t border-border-hover">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start">
            <a href="/" className="group mb-4">
              <img
                src="/astro-logo.svg"
                alt="Astro Intelligence"
                className="logo-adaptive h-5 max-w-[100px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
              />
            </a>
            <p className="text-text-muted text-sm leading-relaxed text-center md:text-left max-w-xs">
              AI-powered corporate-startup matching platform. Find, evaluate, and
              connect with the best startup partners for your enterprise.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start">
            <h4 className="font-mono text-xs uppercase tracking-wider text-text-dim mb-4">
              Navigation
            </h4>
            <nav className="flex flex-col items-center md:items-start gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-muted hover:text-text transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <h4 className="font-mono text-xs uppercase tracking-wider text-text-dim mb-4">
              Connect
            </h4>
            <div className="flex flex-col items-center md:items-start gap-3">
              <a
                href="mailto:contact@astrointelligence.dev"
                className="text-sm text-text-muted hover:text-text transition-colors duration-300"
              >
                contact@astrointelligence.dev
              </a>
              <div className="flex items-center gap-3 mt-2">
                <a
                  href="https://www.linkedin.com/company/astro-intelligence-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-full border border-border-hover flex items-center justify-center text-text-muted hover:text-text hover:border-border-prominent hover:bg-surface-hover transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="mailto:contact@astrointelligence.dev"
                  aria-label="Email"
                  className="w-10 h-10 rounded-full border border-border-hover flex items-center justify-center text-text-muted hover:text-text hover:border-border-prominent hover:bg-surface-hover transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 md:mt-12 pt-6 border-t border-border-hover flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-text-muted">
            &copy; {currentYear} Astro Intelligence. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-text-muted">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-mono text-xs">Remote — Global</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
