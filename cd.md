Here is the clean, focused master prompt to update the static iOS splash images with the **SmartStock** label centered near the bottom.

---

### Master Prompt for Your AI Agent

> **Task:** Update iOS PWA splash screens to include the centered "SmartStock" brand label near the bottom of the launch image (matching the native Android PWA launch style).
> ---
> 
> 
> ### Root Cause & Objective
> 
> 
> iOS Safari does not dynamically render text onto PWA launch screens from `manifest.json`. The app name must be drawn directly into the static Apple startup images stored in `public/splash/`.
> ---
> 
> 
> ### Requirements
> 
> 
> **Option A: CLI Asset Generator (Automated)**
> Run `pwa-asset-generator` using your source logo to regenerate the iOS portrait splash screens with a white background and proper logo placement:
> ```bash
> npx pwa-asset-generator public/apple-touch-icon.png public/splash \
>   -b "#ffffff" \
>   --splash-only \
>   --portrait-only \
>   -p "calc(50vh - 100px) calc(50vw - 40px)"
> 
> ```
> 
> 
> *(Adjust background hex `-b` to match your exact brand background color).*
> **Option B: Manual Image Edit / SVG Canvas**
> If updating the splash screen assets directly:
> 1. Edit the iOS startup images in `public/splash/` (specifically `apple-splash-1125-2436.png` for iPhone X / XS).
> 2. Keep the app logo centered in the upper/middle viewport.
> 3. Add the text **"SmartStock"** centered horizontally near the bottom of the canvas (styled with a clean sans-serif font, medium weight, matching your brand typography color).
> 
> 

---

