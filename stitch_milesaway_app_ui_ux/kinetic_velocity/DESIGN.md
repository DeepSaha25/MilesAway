# Design System Strategy: The Kinetic Performance Engine

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Performance Engine."**

We are moving away from the static, boxy layouts of traditional fitness trackers. Instead, we are building a high-velocity, immersive environment that feels like a premium gaming HUD (Heads-Up Display) fused with elite athletic editorial. This system rejects the "flat" web; it embraces depth, motion, and intensity. Through intentional asymmetry—such as oversized display type overlapping translucent containers—we create a sense of forward momentum. This is not a utility; it is a digital adrenaline shot.

---

## 2. Colors & Surface Architecture
The palette is built on a foundation of absolute darkness (`neutral_color_hex`: #0F1112), allowing our "Neon Triple-Threat" to vibrate against the background.

### The "Neon Triple-Threat"
- **Primary:** Electric Blue (#00F2FF) for core interaction and energy.
- **Secondary:** Neon Green (#39FF14) for success states and secondary actions.
- **Tertiary:** Radiant Orange (#FF5F00) for high-intensity highlights and warnings.

### The "No-Line" Rule
**Borders are forbidden for structural sectioning.** We do not use 1px lines to separate content. Boundaries are defined exclusively through "Tonal Stepping." This creates a sophisticated, seamless flow that feels carved from a single block of obsidian.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, layered plates:
- **Base Layer:** `surface` (#0F1112) – The foundation.
- **Sectioning:** `surface-container-low` – Large background regions.
- **Interactive Cards:** `surface-container-high` or `surface-container-highest` – Use these to "lift" content toward the user.

### The "Glass & Gradient" Rule
To achieve the "Gaming Dashboard" aesthetic:
- **Glassmorphism:** Use for floating navigation bars or modal overlays. Apply `surface` at 60% opacity with a `24px` backdrop blur.
- **Signature Textures:** Linear gradients are mandatory for primary actions. Transition from `primary` (#00F2FF) to a lighter variant at a 135-degree angle.

---

## 3. Typography
The type system is designed to feel "Athletic Editorial"—high contrast, bold, and authoritative.

* **The Display Scale (Lexend):** Used for PRs (Personal Records), countdowns, and "Game Over" states. The wide, geometric stance of Lexend conveys technical precision.
* **The Heroic Headline:** `headline-lg` and `headline-md` (Lexend) should be used with tight letter-spacing (-2%) to mimic sports broadcasting graphics.
* **The Functional Body (Inter):** All utilitarian data—instructions, descriptions, and settings—reside in Inter. This ensures high-performance readability.
* **The Technical Label (Inter):** Labels used for metadata and specs.
* **Intentional Hierarchy:** Never pair two fonts of the same weight. If the Headline is Bold, the Body must be Regular.

---

## 4. Elevation & Depth
Depth in this system is a result of light and layering, not artificial structure.

* **The Layering Principle:** Stack your containers. An inner stat card should sit inside a workout module. The subtle shift in hex values provides all the "border" the eye needs.
* **Ambient Shadows:** We avoid heavy "drop" shadows. When an element must float, use a diffuse glow. The shadow color should be `primary` at 12% opacity with a `32px` blur.
* **The "Ghost Border" Fallback:** If a layout feels muddy, use the `outline-variant` at **15% opacity** to catch the light without breaking immersion.

---

## 5. Components

### Buttons (The Kinetic Triggers)
* **Primary:** Gradient fill, Maximum Roundedness (Pill-shaped, Token: 3), `title-md` typography.
* **Secondary:** Ghost style. No fill, `Ghost Border` (15% opacity), text color `primary`.
* **Haptic State:** On press, scale the button to 96% to simulate a physical "click."

### Performance Cards
* **Styling:** Use `surface-container-high`, Maximum Roundedness (Token: 3).
* **Constraint:** **No Dividers.** Separate the header from the body using a 24px vertical gap.

### Progress Orbs (Gamification)
* Instead of flat bars, use circular progress rings with `secondary` (#39FF14) neon glows. Use `full` roundedness for all progress indicators.

### Data Chips
* Small, high-intensity capsules. Background: `tertiary` (#FF5F00) at 20% opacity. Text: `tertiary`. This creates a "Hot State" for competitive metrics.

### Input Fields
* Minimalist "Underline" style or "Soft Wells." Use `surface-container-lowest` as the field background to create an "inset" look.

---

## 6. Do's and Don'ts

### Do
* **DO** use extreme scale. Make your "Main Goal" number massive (`display-lg`) and your "Unit" label small (`label-sm`).
* **DO** use "Neon Accents" sparingly. If everything is neon, nothing is neon.
* **DO** embrace "Normal" whitespace (Spacing Token: 2). High-performance UIs require breathing room to keep data from becoming overwhelming.

### Don'ts
* **DON'T** use pure #000000. It kills the depth. Use the `neutral_color_hex` palette to allow for subtle light simulation.
* **DON'T** use sharp or subtle corners. This system demands Maximum Roundedness (Token: 3) to feel modern and "liquid."
* **DON'T** use 100% opaque borders. It creates a "grid" feeling that traps the user's eye.