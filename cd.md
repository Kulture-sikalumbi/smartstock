Task: Fix PWA install prompt behavior, resolve the black iOS splash screen issue, and re-style the home page product category selector.

1. Category Selector Styling Fix
Convert the product category pills from standard flex-wrap/inline layout into a sleek, horizontal scrollable row with proper spacing and hide the scrollbar.

Requirements:

Wrap the category buttons in a container with horizontal scroll (overflow-x-auto flex whitespace-nowrap gap-2 scrollbar-hide py-2).

Ensure buttons maintain uniform height, padding (px-4 py-2), rounded pill borders (rounded-full), and smooth active state toggling.

Remove awkward wrapping so all categories stay on a clean, single scrollable line on mobile screens.

2. PWA Install Prompt Custom Banner
Mobile browsers (especially Safari on iOS) never trigger native popups automatically for installation without user interaction.

Requirements:

Capture the browser beforeinstallprompt event on Android/Desktop to trigger a custom sliding bottom banner ("Install SmartStock App for a faster experience").

For iOS Safari, render an explicit UI instruction banner detecting iOS (/iPhone|iPad|iPod/.test(navigator.userAgent)):
"To install SmartStock: tap the Share button  then select 'Add to Home Screen' ."

3. iOS Splash Screen Black Screen Fix
iOS Safari requires explicit <link rel="apple-touch-startup-image"> meta tags for different device resolutions, plus background color tags in standard Next.js metadata.

Requirements:

In app/layout.tsx (or HTML head), explicitly set the theme color to match your app background:

TypeScript
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default', // or 'black-translucent'
    title: 'SmartStock',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff', // Prevents black flash on load
};
Ensure apple-touch-icon.png is placed in /public and defined in manifest.json.
