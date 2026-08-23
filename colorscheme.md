# Student Hub --- UI Theme & Design Direction

## AI Design/Implementation Prompt

> **Use this document as the visual design source of truth for the
> Student Hub.** Do not redesign the visual language from scratch.
> Preserve the design direction described below unless a product
> requirement explicitly conflicts with it.

------------------------------------------------------------------------

# 1. Product Context

The Student Hub is a student-focused platform for discovering and
managing opportunities such as:

-   Hackathons
-   Competitions
-   Workshops
-   Clubs and extracurricular activities
-   Volunteering
-   Academic events
-   Other student opportunities

The core product experience is:

``` text
PROFILE
   ↓
DISCOVER
   ↓
SAVE
   ↓
TRACK
   ↓
REMEMBER
   ↓
ACT
   ↓
COMPLETE
```

The UI therefore needs to feel like a **real SaaS dashboard**, not a
generic student website.

It should be:

-   Professional
-   Clean
-   Modern
-   Information-dense without feeling crowded
-   Friendly enough for students
-   Easy to scan
-   Consistent
-   Subtle rather than flashy

------------------------------------------------------------------------

# 2. Primary Visual Inspiration

The primary structural inspiration is the **intelOS-style dashboard
aesthetic**.

Use this style for:

-   Dashboard structure
-   Sidebar navigation
-   Navigation hierarchy
-   Information density
-   Cards
-   Borders
-   Icon placement
-   Typography hierarchy
-   Spacing
-   Data presentation
-   Search/filter interfaces
-   Status indicators

The secondary inspiration is the **Epieos-style visual branding**.

Borrow from that style:

-   Warm/deep red accent
-   Strong but restrained CTA buttons
-   Generous whitespace
-   Clean branding
-   Subtle background treatment
-   Occasional strong typographic emphasis

## Design rule

``` text
intelOS STRUCTURE
+
Epieos RED BRANDING
=
Student Hub
```

Do NOT copy either interface literally.

The goal is to create a distinct Student Hub product using the same
design principles.

------------------------------------------------------------------------

# 3. Current Color Variant: RED

The first implementation should use the **red theme**.

The design system should eventually support:

``` text
RED
GREEN
BLUE
```

but **only implement/use RED for now**.

The semantic structure should make it possible to introduce the other
variants later without rewriting the entire UI.

------------------------------------------------------------------------

# 4. Color Palette

## Primary

``` css
--primary: #D8322A;
--primary-hover: #C82D27;
```

The primary red should be warm and slightly muted.

Avoid extremely bright red such as:

``` text
#FF0000
```

The red should feel:

-   Professional
-   Confident
-   Modern
-   Slightly warm
-   Not aggressive

------------------------------------------------------------------------

## Text

``` css
--text-primary: #0F172A;
--text-secondary: #64748B;
--text-muted: #94A3B8;
```

Use near-black/navy text instead of pure black everywhere.

Primary headings should be dark and high contrast.

Secondary information should use gray.

Do not make large amounts of text red.

------------------------------------------------------------------------

## Background

``` css
--background: #F7F9FC;
--surface: #FFFFFF;
--surface-muted: #F1F5F9;
```

The overall page should be a very subtle cool off-white.

Cards should generally be pure white.

This creates depth without requiring heavy shadows.

------------------------------------------------------------------------

## Borders

``` css
--border: #E2E8F0;
--border-strong: #CBD5E1;
```

Prefer borders over large shadows for separating UI elements.

------------------------------------------------------------------------

## Semantic colors

These are allowed in addition to the red brand color:

``` css
--success: #16A34A;
--warning: #F59E0B;
--danger: #DC2626;
--info: #2563EB;
```

Use semantic colors only when their meaning requires them.

Examples:

``` text
Green → Verified / Registered / Completed
Amber → Deadline approaching / Attention needed
Red → Urgent deadline / destructive state
Blue → Informational state
```

The primary brand remains RED.

------------------------------------------------------------------------

# 5. Theme Architecture

Implement the design tokens so future themes are easy to add.

Conceptually:

``` css
[data-theme="red"] {
  --primary: #D8322A;
  --primary-hover: #C82D27;
}
```

Later:

``` css
[data-theme="green"] {
  --primary: ...;
}

[data-theme="blue"] {
  --primary: ...;
}
```

Do not hard-code the red value throughout individual components.

Components should consume semantic variables:

``` text
var(--primary)
var(--primary-hover)
var(--text-primary)
var(--surface)
var(--border)
```

------------------------------------------------------------------------

# 6. Typography

Use **Inter** as the primary font.

``` css
font-family: 'Inter', sans-serif;
```

The interface should have a clean SaaS/product-dashboard typography
system.

## Typography hierarchy

### Page title

``` text
28px
700 weight
slightly tight letter spacing
```

Example:

``` text
Dashboard
```

### Section title

``` text
18px
600–650 weight
```

Example:

``` text
Recommended for you
```

### Card title

``` text
15–16px
600 weight
```

### Body

``` text
14px
400 weight
```

### Metadata

``` text
13px
400–500 weight
secondary gray
```

------------------------------------------------------------------------

# 7. Letter Spacing

The typography should feel compact and intentional.

Large headings:

``` css
letter-spacing: -0.02em;
```

Section headings:

``` css
letter-spacing: -0.01em;
```

Normal body text:

``` css
letter-spacing: 0;
```

Do not use exaggerated letter spacing.

Avoid:

``` css
letter-spacing: 0.1em;
```

for normal UI text.

------------------------------------------------------------------------

# 8. Layout Philosophy

Use a structured dashboard layout.

Desktop concept:

``` text
┌──────────────────────────────────────────────────────────────┐
│                         TOP NAV                               │
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│    SIDEBAR     │              MAIN CONTENT                   │
│                │                                             │
│ Dashboard      │                                             │
│ Discover       │                                             │
│ Saved          │                                             │
│ Calendar       │                                             │
│ Notifications  │                                             │
│                │                                             │
│ Profile        │                                             │
│                │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

The sidebar should remain visually quiet.

The main content gets the majority of visual attention.

------------------------------------------------------------------------

# 9. Sidebar

Use a clean, narrow professional sidebar.

Navigation items should contain:

``` text
[icon] Dashboard
[icon] Discover
[icon] Saved
[icon] Calendar
[icon] Notifications
```

Then a lower section:

``` text
[icon] Profile
[icon] Settings
```

## Active navigation

The active item should use the red theme.

Example:

``` text
┌─────────────────────┐
│  ◉  Dashboard       │
└─────────────────────┘
```

Use a very light red background rather than a giant red block.

For example:

``` css
background: rgba(216, 50, 42, 0.08);
color: var(--primary);
```

The active state should be obvious but restrained.

------------------------------------------------------------------------

# 10. Icons

Use **Lucide Icons** or another single consistent outline icon library.

Do NOT mix unrelated icon styles.

Recommended characteristics:

``` text
Outline icons
18–20px
Consistent stroke width
Simple geometry
```

Example:

``` tsx
<Calendar />
<Bookmark />
<Bell />
<Trophy />
<Search />
<User />
<MapPin />
<Clock />
<CheckCircle />
```

Recommended default:

``` css
width: 18px;
height: 18px;
stroke-width: 1.8;
```

Icons should never overpower the text.

------------------------------------------------------------------------

# 11. Icon Placement

Use consistent alignment.

Example:

``` text
[icon]  Label
```

Recommended gap:

``` text
8–12px
```

Icons should sit vertically centered with their corresponding text.

Do not place large decorative icons randomly around cards.

Icons are primarily functional navigation and information indicators.

------------------------------------------------------------------------

# 12. Cards

Cards should resemble a professional SaaS dashboard.

Basic card:

``` css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 10px;
```

Use a very subtle shadow:

``` css
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.03),
  0 4px 12px rgba(15, 23, 42, 0.025);
```

The card should look like it is sitting slightly above the page.

It should NOT look like a floating glassmorphism panel.

------------------------------------------------------------------------

# 13. Shadow Philosophy

Shadows should be almost invisible.

Hierarchy:

``` text
PAGE
  ↓
CARD
  ↓
DROPDOWN / MODAL
  ↓
PRIMARY CTA
```

The UI should primarily use:

``` text
background contrast
+
borders
+
tiny shadows
```

rather than huge shadows.

Avoid:

``` css
box-shadow: 0 20px 50px rgba(...);
```

on normal cards.

Avoid colored glowing shadows.

------------------------------------------------------------------------

# 14. Border Radius

Use moderate rounded corners.

Suggested system:

``` css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
```

Cards:

``` text
10–14px
```

Inputs/buttons:

``` text
8–10px
```

Status pills can be more rounded.

Do not make every element fully pill-shaped.

------------------------------------------------------------------------

# 15. Buttons

Primary button:

``` css
background: var(--primary);
color: #FFFFFF;
border-radius: 8px;
font-weight: 600;
```

Use a subtle shadow:

``` css
box-shadow:
  0 3px 8px rgba(216, 50, 42, 0.18);
```

Example:

``` text
[ Save Opportunity ]
```

The primary red should be reserved for important actions.

Secondary button:

``` text
white background
thin border
dark text
```

Example:

``` text
[ View Details ]
```

Do not make every button red.

------------------------------------------------------------------------

# 16. Student Opportunity Cards

The most important card in the application is an opportunity card.

Recommended structure:

``` text
┌───────────────────────────────────────────────┐
│ 🏆  AI Hackathon                 ✓ Verified   │
│                                               │
│ Build innovative AI solutions with teams      │
│ from across Nepal.                            │
│                                               │
│ 📍 Kathmandu   💰 Free   👥 2–4 participants  │
│                                               │
│ Registration closes                           │
│ Sep 4, 2026                    🔴 3 days left │
│                                               │
│ [ ♡ Save ]                  [ View Details → ] │
└───────────────────────────────────────────────┘
```

The exact content can vary, but the hierarchy should remain:

``` text
TITLE
DESCRIPTION
METADATA
DEADLINE
ACTIONS
```

------------------------------------------------------------------------

# 17. Deadline Visual Language

Deadlines are one of the most important pieces of information in the
Student Hub.

Use semantic urgency.

### Normal

``` text
Registration closes Sep 15
```

### Approaching

``` text
3 days left
```

Use amber or a restrained red depending on urgency.

### Urgent

``` text
Tomorrow
```

### Immediate

``` text
Today
```

Do not make every deadline red.

Red should communicate urgency, not simply "this is a date."

------------------------------------------------------------------------

# 18. Verification

Opportunity cards can contain a small status indicator:

``` text
✓ Verified
```

Use green.

Example:

``` text
AI Hackathon                    ✓ Verified
```

Keep the badge small.

It should not dominate the opportunity title.

------------------------------------------------------------------------

# 19. Dashboard Hierarchy

The dashboard should answer:

> **What should I pay attention to right now?**

Recommended layout:

``` text
Dashboard

Good morning, Alex.

┌─────────────────────────────────────────────┐
│ DEADLINE RADAR                              │
│ 3 opportunities need attention              │
└─────────────────────────────────────────────┘

Recommended for you

[ Opportunity ] [ Opportunity ] [ Opportunity ]

Saved opportunities

[ Opportunity ] [ Opportunity ]

Upcoming

[ Timeline / Events ]
```

The most urgent information should appear near the top.

------------------------------------------------------------------------

# 20. Recommended For You

Recommendation cards should explain why something is relevant.

Example:

``` text
AI Hackathon

94% match

✓ Matches your AI interest
✓ You are eligible
✓ Kathmandu
✓ Free
```

Do not use unexplained AI scores.

The student should understand why an opportunity was recommended.

------------------------------------------------------------------------

# 21. Notification Design

Notification indicators should be small.

Example:

``` text
🔔 3
```

The badge can use the primary red.

Notification cards should be clean:

``` text
┌───────────────────────────────────────────┐
│ ⏰  Deadline tomorrow                     │
│                                           │
│ AI Hackathon registration closes tomorrow │
│                                           │
│ View opportunity →                        │
└───────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 22. Search and Filters

Search should follow the same professional dashboard language.

Input:

``` css
background: #FFFFFF;
border: 1px solid var(--border);
border-radius: 8px;
```

Focus:

``` css
border-color: var(--primary);
box-shadow: 0 0 0 3px rgba(216, 50, 42, 0.08);
```

Filters should be compact.

Example:

``` text
[All] [Hackathons] [Competitions] [Workshops] [Clubs]
```

Do not make filters enormous pill buttons.

------------------------------------------------------------------------

# 23. Tables / Dense Information

If a table is needed, use the same principles:

-   White surface
-   Thin borders
-   Small icons
-   Inter
-   Compact rows
-   Clear hierarchy
-   Minimal shadows

Avoid excessive decoration.

------------------------------------------------------------------------

# 24. Empty States

Empty states should feel helpful rather than dead.

Example:

``` text
             [ Bookmark icon ]

             No saved opportunities

Save an opportunity and it will appear here.

             [ Discover opportunities ]
```

Use a muted icon.

Use the red primary only for the action.

------------------------------------------------------------------------

# 25. Mobile

The desktop dashboard structure should adapt rather than simply shrink.

On mobile:

``` text
┌──────────────────────────┐
│ Logo              🔔 👤  │
├──────────────────────────┤
│                          │
│ Dashboard                │
│                          │
│ Deadline Radar           │
│                          │
│ [ Opportunity Card ]     │
│                          │
│ [ Opportunity Card ]     │
│                          │
└──────────────────────────┘
```

The sidebar can become a bottom navigation or mobile drawer.

Maintain:

-   Same colors
-   Same typography
-   Same icons
-   Same card system
-   Same spacing principles

------------------------------------------------------------------------

# 26. Responsive Behavior

Desktop:

``` text
Sidebar + Main Content
```

Tablet:

``` text
Collapsed Sidebar + Main Content
```

Mobile:

``` text
Top Bar + Main Content + Bottom Navigation
```

Do not allow cards to become excessively narrow.

Stack information when necessary.

------------------------------------------------------------------------

# 27. What the UI Should Feel Like

The intended emotional result is:

``` text
Professional
       +
Trustworthy
       +
Organized
       +
Modern
       +
Student-friendly
```

It should NOT feel:

``` text
Corporate enterprise software
       OR
Generic school portal
       OR
Gaming dashboard
       OR
Neon AI startup
       OR
Glassmorphism template
```

------------------------------------------------------------------------

# 28. Avoid These Design Mistakes

Do NOT:

-   Use gradients everywhere
-   Use giant shadows
-   Use glassmorphism everywhere
-   Use neon colors
-   Use multiple icon libraries
-   Use random icon sizes
-   Make every button red
-   Make every card heavily rounded
-   Make every status a pill
-   Use excessive animations
-   Use huge typography throughout the dashboard
-   Mix many font families
-   Use pure black for every piece of text
-   Use red for information that isn't urgent/actionable

------------------------------------------------------------------------

# 29. Animation

Animations should be subtle.

Allowed:

``` text
Hover
Focus
Button press
Sidebar transition
Dropdown
Modal
Notification appearance
```

Recommended duration:

``` text
150–250ms
```

Use easing that feels smooth and professional.

Avoid:

-   Bouncing cards
-   Excessive page transitions
-   Constant animated gradients
-   Floating decorative objects

The dashboard should feel fast.

------------------------------------------------------------------------

# 30. Visual Hierarchy Rules

When everything is visually important, nothing is important.

Use this hierarchy:

``` text
1. Urgent deadline / primary action
2. Opportunity title
3. Important metadata
4. Description
5. Secondary information
```

Color hierarchy:

``` text
RED
→ actions / urgency / active state

GREEN
→ success / verification

AMBER
→ attention

BLUE
→ information

GRAY
→ secondary content
```

------------------------------------------------------------------------

# 31. Example Design Tokens

``` css
:root {
  /* Brand */
  --primary: #D8322A;
  --primary-hover: #C82D27;
  --primary-soft: rgba(216, 50, 42, 0.08);

  /* Text */
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;

  /* Surfaces */
  --background: #F7F9FC;
  --surface: #FFFFFF;
  --surface-muted: #F1F5F9;

  /* Borders */
  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  /* Semantic */
  --success: #16A34A;
  --warning: #F59E0B;
  --danger: #DC2626;
  --info: #2563EB;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
```

------------------------------------------------------------------------

# 32. Implementation Prompt for an AI

Use the following prompt when asking another AI to build or redesign the
Student Hub UI:

> **Design and implement the Student Hub using this design system.**
>
> The visual structure should be inspired by a professional OSINT/SaaS
> dashboard: clean sidebar navigation, strong information hierarchy,
> compact outline icons, Inter typography, white cards on a cool
> off-white background, thin borders, moderate corner radii, and
> extremely subtle shadows.
>
> Use a warm/deep red as the current brand accent: `#D8322A`, with
> `#C82D27` as the hover/darker variant.
>
> The red must be used strategically for primary actions, active
> navigation, urgent deadlines, notification badges, and important
> emphasis. Do not turn the entire interface red.
>
> Use:
>
> -   Inter for typography
> -   Lucide-style outline icons
> -   `#F7F9FC` page background
> -   `#FFFFFF` card surfaces
> -   `#E2E8F0` borders
> -   `#0F172A` primary text
> -   `#64748B` secondary text
> -   Very subtle neutral shadows
> -   Moderate 8--14px corner radii
> -   Consistent 4/8/12/16/24/32px spacing
>
> The application should feel like a polished SaaS dashboard rather than
> a generic school portal.
>
> The Student Hub dashboard should prioritize:
>
> 1.  Deadline Radar
> 2.  Recommended opportunities
> 3.  Saved opportunities
> 4.  Upcoming events
> 5.  Notifications
>
> Opportunity cards should clearly show title, verification status,
> description, location, cost, eligibility/participation information,
> deadline, urgency, save action, and details action.
>
> Maintain strong alignment and consistent icon sizing throughout the
> interface.
>
> Avoid excessive gradients, glassmorphism, large shadows, neon colors,
> excessive rounded pills, unnecessary animations, and decorative UI
> that competes with the actual opportunity information.
>
> Build the color system using CSS variables/design tokens so that the
> red accent can later be replaced by green or blue without rewriting
> components.
>
> **The most important principle is:**
>
> `intelOS information architecture + Epieos red branding + Student Hub usability`.
>
> The final interface should feel trustworthy, organized, modern, and
> student-friendly.

------------------------------------------------------------------------

# 33. Final Design Principle

The Student Hub should look like a product students could realistically
use every day.

Not:

> "A hackathon project with pretty cards."

Instead:

> **"A personal opportunity management system."**

The visual system should make that believable.

``` text
INTELoS
Structure
Typography
Icons
Spacing
Cards
Dashboard

        +

EPIEOS
Red accent
Brand personality
Whitespace
Visual emphasis

        +

STUDENT HUB
Deadlines
Opportunities
Saved items
Notifications
Student profile
Personalization
```

## Target Result

**Clean enough to trust.**

**Dense enough to be useful.**

**Friendly enough for students.**

**Distinctive enough to feel like a real product.**
