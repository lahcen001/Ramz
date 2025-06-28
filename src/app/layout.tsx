import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import I18nProvider from "@/components/I18nProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ramz - Quiz App",
  description: "Interactive quiz platform with multi-language support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ramz Quiz",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Ramz Quiz",
    title: "Ramz - Interactive Quiz Platform",
    description: "Join interactive quizzes with multi-language support",
  },
  twitter: {
    card: "summary",
    title: "Ramz - Interactive Quiz Platform",
    description: "Join interactive quizzes with multi-language support",
  },
};

export function generateViewport() {
  return {
    themeColor: "#2563eb",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Ramz Quiz" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ramz Quiz" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2563eb" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Comprehensive Debugging Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🔧 DEBUG: Layout script loaded');
              
              // Global error handler for unhandled errors
              window.addEventListener('error', function(event) {
                console.error('🚨 Global Error:', {
                  message: event.message,
                  filename: event.filename,
                  lineno: event.lineno,
                  colno: event.colno,
                  error: event.error,
                  stack: event.error ? event.error.stack : null
                });
                
                // Check for chunk loading errors
                if (event.message && event.message.includes('ChunkLoadError')) {
                  console.error('🚨 CHUNK LOAD ERROR DETECTED:', event.message);
                  console.error('📍 Error location:', event.filename + ':' + event.lineno);
                  console.error('🔍 Stack trace:', event.error ? event.error.stack : 'No stack trace');
                }
              });
              
              // Global promise rejection handler
              window.addEventListener('unhandledrejection', function(event) {
                console.error('🚨 Unhandled Promise Rejection:', {
                  reason: event.reason,
                  promise: event.promise
                });
                
                // Check for chunk loading promise rejections
                if (event.reason && event.reason.toString().includes('ChunkLoadError')) {
                  console.error('🚨 CHUNK LOAD PROMISE REJECTION:', event.reason);
                }
              });
              
              // Monitor resource loading
              window.addEventListener('load', function() {
                console.log('🎯 Window loaded');
                
                // Check for failed resources
                const resources = performance.getEntriesByType('resource');
                resources.forEach(function(resource) {
                  if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
                    console.warn('⚠️ Failed to load resource:', resource.name);
                  }
                });
                
                // Log all loaded scripts
                const scripts = document.querySelectorAll('script[src]');
                console.log('📜 Loaded scripts:', Array.from(scripts).map(s => s.src));
                
                // Log all loaded stylesheets
                const styles = document.querySelectorAll('link[rel="stylesheet"]');
                console.log('🎨 Loaded stylesheets:', Array.from(styles).map(s => s.href));
              });
              
              // Monitor DOM changes
              if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
                // Wait for DOM to be ready
                function initObserver() {
                  if (document.head && document.body) {
                    const observer = new MutationObserver(function(mutations) {
                      mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                          mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                              if (node.tagName === 'SCRIPT') {
                                console.log('➕ Script added:', node.src || 'inline');
                                
                                // Monitor script loading
                                node.addEventListener('load', function() {
                                  console.log('✅ Script loaded successfully:', node.src || 'inline');
                                });
                                
                                node.addEventListener('error', function() {
                                  console.error('❌ Script failed to load:', node.src || 'inline');
                                });
                              }
                              
                              if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
                                console.log('➕ Stylesheet added:', node.href);
                                
                                // Monitor stylesheet loading
                                node.addEventListener('load', function() {
                                  console.log('✅ Stylesheet loaded successfully:', node.href);
                                });
                                
                                node.addEventListener('error', function() {
                                  console.error('❌ Stylesheet failed to load:', node.href);
                                });
                              }
                            }
                          });
                        }
                      });
                    });
                    
                    try {
                      observer.observe(document.head, { childList: true, subtree: true });
                      observer.observe(document.body, { childList: true, subtree: true });
                      console.log('🔍 MutationObserver initialized successfully');
                    } catch (e) {
                      console.warn('⚠️ MutationObserver failed to initialize:', e);
                    }
                  } else {
                    // Try again after a short delay
                    setTimeout(initObserver, 100);
                  }
                }
                
                // Initialize when DOM is loaded
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initObserver);
                } else {
                  initObserver();
                }
              }
              
              // Service Worker Registration with debugging
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  console.log('🔄 Registering service worker...');
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ SW registered successfully:', registration);
                    })
                    .catch(function(registrationError) {
                      console.error('❌ SW registration failed:', registrationError);
                    });
                });
              } else {
                console.warn('⚠️ Service workers not supported');
              }
              
              // Monitor network requests (if available)
              if ('PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver(function(list) {
                    list.getEntries().forEach(function(entry) {
                      if (entry.entryType === 'resource') {
                        console.log('🌐 Resource loaded:', {
                          name: entry.name,
                          duration: entry.duration,
                          transferSize: entry.transferSize,
                          responseStatus: entry.responseStatus
                        });
                        
                        // Check for failed requests
                        if (entry.responseStatus >= 400) {
                          console.error('❌ Resource failed:', entry.name, 'Status:', entry.responseStatus);
                        }
                      }
                    });
                  });
                  
                  observer.observe({ entryTypes: ['resource'] });
                } catch (e) {
                  console.warn('⚠️ PerformanceObserver not fully supported:', e);
                }
              }
              
              // Log browser and environment info
              console.log('🔍 Environment Info:', {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                connection: navigator.connection ? {
                  effectiveType: navigator.connection.effectiveType,
                  downlink: navigator.connection.downlink,
                  rtt: navigator.connection.rtt
                } : 'Not available'
              });
              
              console.log('🚀 DEBUG: All debugging handlers initialized');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <I18nProvider>
          {children}
          <PWAInstallPrompt />
        </I18nProvider>
      </body>
    </html>
  );
}
