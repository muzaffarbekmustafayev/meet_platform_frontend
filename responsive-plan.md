# Meetra — Responsive Design Plan

## Breakpoint strategiyasi

Tailwind standart breakpointlari ishlatiladi, lekin loyiha uchun aniq chegara belgilanadi:

| Nom       | px       | Qurilma                          |
|-----------|----------|----------------------------------|
| `xs`      | 0–479    | Kichik mobil (iPhone SE, 12 mini)|
| `sm`      | 480–639  | Katta mobil (iPhone 14, Galaxy S)|
| `md`      | 640–767  | Kichik planshet (iPad mini, Fold)|
| `lg`      | 768–1023 | iPad, iPad Air, iPad Pro 11"     |
| `xl`      | 1024–    | Laptop, Desktop                  |

> Hozirgi `tailwind.config.js` da faqat standart breakpointlar bor.  
> `xs` va `tablet` custom breakpoint qo'shish kerak.

---

## 1. tailwind.config.js — Custom breakpointlar qo'shish

**Muammo:** `xs` breakpoint yo'q, `768px` (iPad) uchun alohida chegara yo'q.

```js
// tailwind.config.js
theme: {
  extend: {
    screens: {
      xs: '480px',      // katta mobil
      tablet: '768px',  // iPad/planshet (lg dan oldin)
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui'],
    },
  },
},
```

---

## 2. AuthPage.jsx

### Hozirgi holat
- `min-h-[500px] md:min-h-[660px]` — mobilda balandlik to'g'ri chiqmaydi
- `hidden md:flex` dekorativ panel — mobilda yo'q, bu to'g'ri
- `p-8 md:p-12` — mobilda padding juda katta
- Login/Register o'tish animatsiyasi mobilda `translate-x-10` ishlashi noaniq

### Muammolar va yechimlar

| Muammo | Hozir | Kerak |
|--------|-------|-------|
| Forma padding | `p-8 md:p-12` | `p-5 sm:p-8 md:p-12` |
| Input font | `text-sm` | `text-base` (mobil uchun — iOS zoom oldini olish) |
| Submit tugma | `py-3` | `py-3.5` (teri tekinligini oshirish — 44px minimum) |
| Forma container | `rounded-[2.5rem]` | `rounded-2xl sm:rounded-[2.5rem]` |
| Sahifa padding | `p-4 sm:p-8` | `p-3 xs:p-5 sm:p-8` |
| Dekorativ panel | `md:flex` | `lg:flex` (iPad portrait da ham yashirin tursin) |

### iPad uchun
- iPad portrait (768px): Dekorativ panelni `lg:` ga ko'chirish — shu vaqt faqat forma ko'rinadi, kengroq va qulay bo'ladi
- iPad landscape (1024px): Desktop ko'rinish — ikki ustunli

---

## 3. Dashboard.jsx — Sidebar + Main

### Hozirgi holat
- Sidebar: `md:relative md:translate-x-0` — 640px dan desktop holatiga o'tadi
- Mobile: `fixed` drawer, overlay bilan
- Main content: `flex-1 overflow-y-auto`

### Muammolar va yechimlar

**Sidebar:**
| Breakpoint | Hozir | Kerak |
|------------|-------|-------|
| Mobile (`< 640px`) | Drawer, `w-64` | To'g'ri ✓ |
| Tablet iPad (`640–1023px`) | Desktop ko'rinish, `w-60` | `md:w-56` — biroz torroq |
| Desktop (`1024px+`) | `w-60` | Collapsible `w-16/w-60` ✓ |

**TopHeader:**
- LanguageToggle + ThemeToggle hozir har doim ko'rinadi
- Mobilda (`< 480px`) bu ikki toggle overflow qilishi mumkin
- **Yechim:** Mobilda faqat icon ko'rinishi (`compact` prop) — `xs:` breakpoint orqali

```jsx
// TopHeader.jsx
<LanguageToggle compact={isMobile} />   // window.innerWidth < 480
<ThemeToggle compact={isMobile} />
```

**Dashboard kartochkalari:**
| Breakpoint | Hozir | Kerak |
|------------|-------|-------|
| Mobile | `grid-cols-2` | `grid-cols-1 xs:grid-cols-2` |
| Tablet | `md:grid-cols-4` | `md:grid-cols-2 lg:grid-cols-4` |
| Desktop | `md:grid-cols-4` | ✓ |

**Uchrashuvlar ro'yxati (recent meetings):**
- Hozir `grid-cols-1 md:grid-cols-2` — OK
- Mobilda har bir karta juda baland — `p-8 sm:p-10` ni `p-5 sm:p-8 sm:p-10` ga o'girish

**Profil / Sidebar qo'shimcha:**
- `lg:grid-cols-3` — iPad da ham 1 ustun chiqadi — `tablet:grid-cols-2 lg:grid-cols-3` kerak

---

## 4. RoomPage.jsx — Asosiy muammo joyi

Bu sahifa eng murakkab. Uch qism bor: **TopBar + Main + BottomBar**.

### 4.1 Top Bar (`h-14`)

**Muammo:** Mobilda o'ng tomonda juda ko'p element sig'maydi.

| Element | Hozir | Kerak |
|---------|-------|-------|
| Timer | `hidden md:flex` | `hidden sm:flex` |
| Participant count | `hidden md:flex` | `hidden sm:flex` |
| Role badge | `hidden sm:flex` | ✓ |
| Security info | `hidden sm:flex` | `hidden lg:flex` — katta qurilmalar uchun |
| Network info | `hidden md:flex` | `hidden lg:flex` |
| Screen share button | Ko'rinadi | `hidden sm:flex` — kichik mobildan yashirin |
| View mode toggle | `hidden md:flex` | `hidden tablet:flex` |
| Language toggle | `compact` | ✓ — already compact |

**Mobil top bar (< 480px) bo'lishi kerak:**
```
[● LIVE] [Uchrashuv nomi......] [👥 n] [UZ/RU] 
```

### 4.2 Video Grid (Main Area)

**Speaker view (`stageUser` bor):**
- Hozir: `flex-col lg:flex-row` — mobilda vertikal, desktopda gorizontal
- **Muammo:** Tablet (768–1023px) da ham `flex-col` — sidebar juda baland bo'lib ketadi
- **Yechim:** `flex-col tablet:flex-row` (768px dan gorizontal)

**Thumbnail sidebar:**
- Hozir: `flex-1 lg:max-w-[240px]`
- Mobilda pastda gorizontal scroll bo'lishi kerak (vertikal emas)
- **Yechim:**
  - Mobile: `flex flex-row overflow-x-auto gap-2 max-h-[120px]`
  - Tablet+: `flex flex-col overflow-y-auto max-w-[180px] tablet:max-w-[220px] lg:max-w-[240px]`

**Grid view:**
| Ishtirokchilar | Hozir | Kerak |
|---------------|-------|-------|
| 1-2 | `grid-cols-1 sm:grid-cols-2` | ✓ |
| 3-4 | `grid-cols-2` | `grid-cols-2` ✓ |
| 5-9 | `grid-cols-2 sm:grid-cols-3` | `grid-cols-2 tablet:grid-cols-3` |
| 10+ | `grid-cols-2 sm:grid-cols-4` | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |

**Video tile minimum balandligi:**
- Hozir `min-h-[160px]` — mobilda OK lekin IPad landscape da katta bo'lishi mumkin
- `min-h-[140px] sm:min-h-[160px]` qilish yaxshiroq

### 4.3 Chat/Participants Sidebar

**Hozirgi holat:**
- Mobile: `absolute inset-y-0 right-0 w-full z-50` — to'liq ekranli overlay ✓
- Desktop: `lg:static lg:w-[360px]`
- **Muammo:** Tablet (768–1023px) da ham `w-full` overlay — juda katta

**Yechim:**
```jsx
// Hozir:
className="absolute inset-y-0 right-0 w-full z-50 lg:static lg:w-[360px]"

// Kerak:
className="absolute inset-y-0 right-0 w-full xs:w-80 z-50 tablet:static tablet:w-[300px] lg:w-[360px]"
```
Tablet da sidebar panel o'ng tomonda statik, `300px` kenglikda.

### 4.4 Waiting Room Toasts

- Hozir: `w-[320px]` — mobilda ekrandan chiqib ketadi
- **Yechim:** `w-[calc(100vw-2rem)] max-w-[320px]`

### 4.5 Bottom Controls

**Hozirgi muammo:** Mobildan ko'p tugmalar yashirilgan, `MoreHorizontal` menyu ishlaydi — lekin wrap bo'lganda `min-h-[4.5rem]` yetarli emas.

**Yechim — 3 holat:**

- **Mobile (< 640px):** Faqat Mic + Video + Chat + People + More tugmalari. Balandlik: `h-16` fixed.
- **Tablet (640–1023px):** Mic + Video + Ekran + Qo'l + Chat + People + Chiqish. `h-18`
- **Desktop (1024px+):** Hamma tugmalar. `h-20` ✓

```jsx
// Har bir breakpointda ko'rinadigan tugmalar:
// Mobile:   [Mic] [Video] | [Chat] [People] [More] | [Chiqish-mobile]
// Tablet:   [Mic] [Video] | [Ekran] [Qo'l] | [Chat] [People] | [Chiqish]
// Desktop:  [ID] [Mic] [Video] | [Ekran] [Yozish] [Qo'l] | [Sozlama] [Chat] [People] | [Chiqish]
```

---

## 5. ChatPanel.jsx

### Muammolar

| Element | Hozir | Kerak |
|---------|-------|-------|
| Bubble max-width | `max-w-[78%]` | `max-w-[85%] sm:max-w-[78%]` — mobilda biroz keng |
| Input font-size | `text-sm` | `text-base` (iOS zoom oldini olish) |
| Attach button | Ko'rinadi | `hidden xs:flex` — juda kichik mobilda yashirin |
| Header padding | `px-4 py-3.5` | `px-3 py-3 sm:px-4 sm:py-3.5` |

---

## 6. Video.jsx (tile)

### Muammolar

| Element | Hozir | Kerak |
|---------|-------|-------|
| Avatar size (stage) | `w-24 h-24` | `w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24` |
| Stage text | `text-3xl` | `text-2xl sm:text-3xl` |
| Bottom bar padding | `px-3 py-2` | `px-2 py-1.5 sm:px-3 sm:py-2` |
| Fullscreen button | Ko'rinadi | touch qurilmalarda yashirin |

---

## 7. RoomSettingsModal.jsx va ConfirmModal.jsx

- Modal container: `max-w-md w-full` — mobilda `mx-4` kerak bo'lishi mumkin
- **Yechim:** `mx-4 sm:mx-auto` qo'shish

---

## Amalga oshirish tartibi (Priority)

### 🔴 1-navbat — Critical (darhol)
1. `tailwind.config.js` ga `xs` va `tablet` breakpoint qo'shish
2. **RoomPage** — Chat/Participants sidebar tablet uchun: `xs:w-80 tablet:static tablet:w-[300px]`
3. **RoomPage** — Speaker view: `flex-col tablet:flex-row` (768px dan gorizontal)
4. **RoomPage** — Thumbnail sidebar mobilda: gorizontal scroll
5. **RoomPage** — Waiting toasts: `w-[calc(100vw-2rem)] max-w-[320px]`
6. **Input font-size** — `text-base` (iOS keyboard zoom oldini olish)

### 🟡 2-navbat — Important (bir hafta ichida)
7. **TopHeader** — Mobilda `compact` toggle (`xs:` breakpoint bilan)
8. **RoomBottomControls** — Tablet uchun o'rta holat (screen share, raise hand ko'rinsin)
9. **Dashboard** — `tablet:grid-cols-2 lg:grid-cols-4` action kartochkalari
10. **AuthPage** — `lg:flex` dekorativ panel (iPad portrait da yashirin)
11. **ChatPanel** — Bubble width, input font-size

### 🟢 3-navbat — Polish (keyinroq)
12. **Video.jsx** — Avatar o'lchamlar responsive
13. **RoomPage grid** — 10+ ishtirokchi uchun `sm:grid-cols-3 lg:grid-cols-4`
14. **RoomSettingsModal** — Mobil padding
15. **Touch targets** — Barcha tugmalar min `44x44px` bo'lishi (`min-h-[44px] min-w-[44px]`)

---

## iOS / Android maxsus qoidalar

```css
/* index.css ga qo'shish */

/* iOS keyboard ochilganda viewport sakramasin */
@supports (-webkit-touch-callout: none) {
  .h-screen { height: -webkit-fill-available; }
}

/* Input zoom oldini olish (iOS 16-) */
input, select, textarea {
  font-size: 16px; /* 16px dan kichik bo'lsa iOS zoom qiladi */
}

/* Touch scroll smooth */
.overflow-y-auto, .overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}

/* Safe area (notch / home indicator) */
.room-bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
.room-top-bar {
  padding-top: env(safe-area-inset-top);
}
```

---

## Test qilish checklist

Har bir sahifani quyidagi qurilmalarda tekshirish:

| Qurilma | Ekran | Browser DevTools |
|---------|-------|-----------------|
| iPhone SE | 375×667 | `375px` |
| iPhone 14 | 390×844 | `390px` |
| iPhone 14 Pro Max | 430×932 | `430px` |
| Samsung Galaxy S23 | 360×800 | `360px` |
| iPad mini (portrait) | 768×1024 | `768px` |
| iPad Air (portrait) | 820×1180 | `820px` |
| iPad Pro 11" (portrait) | 834×1194 | `834px` |
| iPad Pro 12.9" (landscape) | 1366×1024 | `1366px` |
| MacBook 13" | 1280×800 | `1280px` |
| Desktop FHD | 1920×1080 | `1920px` |

### Tekshiriladigan holatlar (RoomPage)
- [ ] 2 ishtirokchi, mobil portrait
- [ ] 6 ishtirokchi, iPad portrait
- [ ] Chat panel ochiq, mobil
- [ ] Chat panel ochiq, iPad landscape
- [ ] Screen share faol, tablet
- [ ] Waiting room toast, mobil

---

## Qo'shimcha tavsiyalar

**`useMediaQuery` hook yozish:**
```jsx
// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

// Ishlatish:
const isMobile = useMediaQuery('(max-width: 479px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
```

**Portrait/Landscape aniqlash (RoomPage uchun):**
```jsx
const isLandscape = useMediaQuery('(orientation: landscape)');
// Mobil landscape da thumbnail sidebar gorizontal bo'lsin
```
