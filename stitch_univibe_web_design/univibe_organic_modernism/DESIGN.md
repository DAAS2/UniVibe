---
name: UniVibe Organic Modernism
colors:
  surface: '#fff8f4'
  surface-dim: '#e2d8d1'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2ea'
  surface-container: '#f6ece5'
  surface-container-high: '#f1e6df'
  surface-container-highest: '#ebe1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#57423a'
  inverse-surface: '#352f2b'
  inverse-on-surface: '#f9efe8'
  outline: '#8a7269'
  outline-variant: '#dec0b6'
  surface-tint: '#a14010'
  primary: '#a14010'
  on-primary: '#ffffff'
  primary-container: '#f47d4a'
  on-primary-container: '#622000'
  inverse-primary: '#ffb598'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b57d'
  on-tertiary-container: '#003f29'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb598'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fff8f4'
  on-background: '#1f1b17'
  surface-variant: '#ebe1da'
  warm-bg: '#FFFBF7'
  sunset-gradient: 'linear-gradient(135deg, #F47D4A 0%, #8B5CF6 100%)'
  mellow-yellow: '#FEF3C7'
  soft-clay: '#F97316'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  chat-bubble:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1200px
---

## Brand & Style

The design system is built on the philosophy of **"Anti-Corporate Modernism."** It rejects the sterile, clinical aesthetics of traditional university portals in favor of a "warm, curious friend" persona. The target audience is Gen Z students transitioning from high school to university—a demographic that values authenticity over high-gloss marketing.

The style is a mix of **Minimalism** and **Tactile Modernism**. It prioritizes heavy whitespace and clear typography but softens the edges with organic gradients, "fuzzy" shadows, and conversational layouts. The UI should feel like a living journal or a supportive chat, encouraging exploration through a hopeful and low-pressure visual language.

**Key Principles:**
- **Authenticity over Polish:** Use slightly irregular or hand-drawn elements (like personality tags) to break the "perfect" grid.
- **Warmth:** Avoid pure blacks or cold grays. Every neutral is tinted with a hint of warmth.
- **Narrative Flow:** Onboarding and dashboards should feel like a continuous conversation, not a series of forms.

## Colors

The palette moves away from institutional blues toward a "Sunset & Soil" theme. 

- **Primary (Sunset Orange):** Represents energy, optimism, and the "vibe" of a new beginning. Used for primary actions and status highlights.
- **Secondary (Soft Purple):** Evokes introspection, creativity, and the "future self." Used for secondary buttons and AI-driven narrative elements.
- **Tertiary (Gentle Green):** Used sparingly for growth-related indicators like "Micro-Skill" progress and career milestones.
- **Neutral (Warm Bark):** A deep, warm gray used for text to maintain readability without the harshness of pure black.

**Application Notes:**
- **Backgrounds:** Use `warm-bg` (#FFFBF7) as the base surface. Pure white should only be used for card interiors to create a subtle lift.
- **Onboarding:** Utilize the `sunset-gradient` for full-screen immersive states to signal a "special" transitionary space.

## Typography

The typography strategy balances high-energy "Modern Geometric" for headlines and "Warm Humanist" for body text.

- **Headlines:** Plus Jakarta Sans provides a friendly, optimistic, and slightly rounded look that feels contemporary and approachable.
- **Body & Labels:** Be Vietnam Pro is used for its exceptional readability and "inviting" character. It feels more personal and less "systematic" than Inter or Helvetica.

**Hierarchy Guidance:**
- **Conversational UI:** Use `chat-bubble` for all AI-generated questions.
- **Narratives:** "A Day In Your Life" sections should use `body-lg` with generous line-height to feel like a comfortable read.
- **Impact:** Use `display-hero` sparingly on the landing page and the start/end of onboarding paths.

## Layout & Spacing

This design system uses a **Fluid Layout Model** with a strong emphasis on "safe breathing room."

- **Desktop:** 12-column grid. Career Pathways and Dashboards use a 3-column card-based distribution.
- **Mobile:** Single-column vertical stack with a 16px side margin.
- **Onboarding:** Centered narrow column (max-width 600px) to simulate a mobile chat experience even on desktop, focusing the user's attention.

**Spacing Rhythm:**
Use a base-4 system. Components should generally use `24px` (6 units) for internal padding to maintain the "airy" and "unpressured" feel requested in the product narrative.

## Elevation & Depth

To achieve an "authentic, not clinical" feel, depth is conveyed through **Tonal Layers** and **Tinted Shadows** rather than high-contrast elevations.

- **The Base:** The lowest layer is the `warm-bg`.
- **The Cards:** Interactive cards use a white background with a very soft, diffused shadow tinted with the secondary purple (`rgba(139, 92, 246, 0.08)`).
- **Active States:** When a card is selected (e.g., a Career Path), it shouldn't just lift; it should gain a subtle 2px border of the Primary color to feel "grounded" but highlighted.
- **Glassmorphism:** Use semi-transparent blurs (20px) for navigation bars and overlay modals to maintain the sense of "space" and context.

## Shapes

The shape language is **Rounded**, favoring softness over rigid geometry.

- **Cards:** Use `rounded-lg` (1rem) for standard containers.
- **Buttons & Inputs:** Use `rounded-lg` (0.5rem) to ensure they feel like distinct interactive objects.
- **Personality Tags:** Use "Pill" shapes (full radius) to make them feel like collectible badges or physical stickers.
- **Chat Bubbles:** Use an asymmetric rounding—1rem on all corners except the bottom-left (for AI) or bottom-right (for User) to create a clear "tail" or origin point.

## Components

### Buttons
- **Primary:** Filled with the primary sunset orange. No sharp corners. Text is white.
- **Secondary:** Outlined with a 2px stroke of the secondary purple. 
- **Ghost:** Warm gray text with a mellow-yellow background on hover.

### Cards (The "UniVibe Unit")
- Every card should have a 1px border of `rgba(74, 68, 63, 0.1)` to define it against the warm background without adding visual weight.
- Career Pathway cards use dashed connecting lines to show branching logic, emphasizing non-linearity.

### Inputs & Chat
- Text inputs should not have a bottom border only (which feels corporate). They should be fully enclosed containers with `warm-bg` backgrounds that are slightly darker than the page surface.
- The AI "Orb" avatar should be a CSS-animated gradient sphere that pulses slowly during "active thinking" states.

### Personality Tags
- High-contrast text on soft, pastel versions of the brand colors (e.g., "Creative Connector" on a soft peach background). These should look like physical labels.

### Progress Indicators
- Instead of a clinical bar, use a series of "Sun" icons or soft dots that fill in with color as the user progresses through onboarding.