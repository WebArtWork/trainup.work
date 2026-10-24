# TrainUp — відповіді для App Store Connect

Bundle ID: `work.trainup.app`, версія 1.0, iOS 15.0+, пристрої: **iPhone + iPad** (`TARGETED_DEVICE_FAMILY = 1,2`).
Застосунок виходить в Україні, тому в App Information → **Primary Language** поставте
**Ukrainian**. English (U.K.) можна залишити як додаткову локалізацію або видалити.

---

## ⚠️ Що виправити, перш ніж натискати «Add for Review»

1. **Вхід не працює в iOS-застосунку.** `signInWithPopup` у WKWebView (Capacitor) не відкриває
   вікно Google чи Apple. Рецензент не зможе увійти, і застосунок відхилять за правилом 2.1
   (App Completeness). Потрібен нативний вхід: `@capacitor-firebase/authentication`
   (Sign in with Apple + Google Sign-In), а потім `signInWithCredential` у Firebase.
   Це та сама проблема, що й в Android.
2. **Sign in with Apple мусить працювати нативно** (правило 4.8). Якщо є вхід через Google,
   має бути й рівноцінний варіант від Apple. Кнопка вже є, але вона теж працює через popup.
3. **Видалення акаунта й Apple-токени** (правило 5.1.1(v)). Видалення в застосунку вже є ✅,
   але для користувачів Sign in with Apple при видаленні треба ще відкликати токен через Apple
   REST API (`/auth/revoke`).
4. **Скріншоти для iPad обов'язкові**, бо збірка підтримує iPad. Можна або завантажити скріншоти
   iPad 13" (2064 × 2752), або в Xcode залишити тільки iPhone (`TARGETED_DEVICE_FAMILY = 1`).
5. **Шифрування (Export Compliance).** Додайте в `ios/App/App/Info.plist`
   `ITSAppUsesNonExemptEncryption` = `NO`: застосунок використовує тільки HTTPS. Тоді
   це питання не виникатиме при кожному завантаженні збірки.
6. **Email у політиці конфіденційності** досі порожній (`company.json` → `email`). Apple
   вимагає контакт для звернень, а для Support URL потрібна сторінка з контактами.
7. **Назва.** У `Info.plist` і в App Store Connect зараз «Train UpWork». Краще «TrainUp»
   (CFBundleDisplayName) і «TrainUp: Workout Planner» в App Information.
8. (Ризик) **Правило 4.2 Minimum Functionality.** Apple відхиляє «обгортки сайтів». На користь
   застосунку грає власна логіка плану, таймер і робота офлайн. Нативні нагадування
   (local notifications) додатково знизили б ризик.

---

## 1. App Information (General → App Information)
- **Name (≤30):** `TrainUp: Workout Planner`
- **Subtitle (≤30):** `Plans for your space & gear`
- **Primary category:** Health & Fitness
- **Secondary category:** Lifestyle (необов'язково)
- **Content Rights:** «No, it does not contain, show, or access third-party content»
- **Age Rating:** див. п. 5

## 2. Pricing and Availability
- Price: **Free (0)**
- Availability: усі країни. Магазин обладнання працює тільки в Україні, але решта застосунку
  працює всюди.
- In-App Purchases / Subscriptions: **немає**

## 3. App Privacy (Trust & Safety → App Privacy)
- **Privacy Policy URL:** https://trainup.work/privacy/
- **Do you or your third-party partners collect data from this app?** — **Yes**
- **Tracking:** для всіх типів даних — **No**. Реклами й ATT немає.

| Категорія Apple | Тип | Linked to user | Tracking | Purposes |
|---|---|---|---|---|
| Contact Info | Name | Yes | No | App Functionality |
| Contact Info | Email Address | Yes | No | App Functionality |
| Contact Info | Phone Number | Yes | No | App Functionality (доставка) |
| Contact Info | Physical Address | Yes | No | App Functionality (доставка) |
| Health & Fitness | Health | Yes | No | App Functionality, Product Personalization |
| Health & Fitness | Fitness | Yes | No | App Functionality, Product Personalization |
| Purchases | Purchase History | Yes | No | App Functionality |
| User Content | Other User Content (нотатки, справи) | Yes | No | App Functionality |
| Identifiers | User ID | Yes | No | App Functionality |

**Не позначати:** Location, Contacts, Photos/Videos, Audio, Browsing/Search History,
Device ID, Usage Data, Diagnostics, Financial Info (платіжних даних немає, оплата при отриманні),
Sensitive Info.

## 4. App Review Information (App Store → версія 1.0 → App Review Information)
- **Sign-in required:** ✅
- **User name / Password:** окремий тестовий Google-акаунт (створіть і введіть самостійно).
  Рецензент увійде через «Continue with Google».
- **Contact:** ім'я, телефон і email відповідальної людини
- **Notes:**
  > Sign in with the provided Google test account (or with your own Apple ID via
  > "Sign in with Apple"). After sign-in, complete the short setup (goal, level, equipment,
  > space) and a workout plan is generated automatically. There are no paid features or
  > in-app purchases. The equipment store sells physical goods with cash on delivery in
  > Ukraine only; you do not need to place an order. Account deletion: Profile → Data &
  > privacy → Delete account.

## 5. Age Rating (анкета)
На всі питання про контент (насильство, сексуальний контент, нецензурну лексику, алкоголь,
тютюн і наркотики, азартні ігри, жахи, медичні призначення) — **None**.
- Unrestricted Web Access — **No**
- User-Generated Content / Messaging and Chat — **No**
- Advertising — **No**
- Contests / Gambling / Loot boxes — **No**
- Parental Controls / Age Assurance — **No**
- Якщо анкета питає про **Health or Wellness Topics** — **Yes**: застосунок про тренування
  і не дає медичних порад.

Очікуваний рейтинг: **4+**. Якщо анкета дасть 9+ через питання про здоров'я, це нормально.

## 6. Version 1.0 — Product Page (English U.K.)

**Promotional Text (≤170, можна змінювати без перевірки):**
```
Tell TrainUp your goal, schedule, equipment and free space — get a realistic workout plan in a minute. No ads, no AI chats.
```

**Description:** той самий англійський опис, що й для Google Play
(`google-play-trainup.md` → розділ «English»).

**Keywords (≤100 символів, через кому без пробілів):**
```
workout,home workout,fitness,training plan,strength,exercise,routine,no equipment,gym,planner
```
(Назву й підзаголовок Apple індексує окремо, тому слова «TrainUp» тут немає.)

- **Support URL:** https://trainup.work/support/
- **Marketing URL:** https://trainup.work/
- **Version / Copyright:** `2026 TrainUp`
- **What's New:** для першої версії не потрібно

### Локалізація: Українська
- Name: `TrainUp: план тренувань`
- Subtitle (≤30): `Тренування під ваш простір`
- Promotional Text:
  `Вкажіть ціль, графік, обладнання й вільне місце — TrainUp складе реалістичний план тренувань за хвилину. Без реклами й чатів зі ШІ.`
- Description: український опис із `google-play-trainup.md`
- Keywords: `тренування,тренування вдома,фітнес,план тренувань,силові,вправи,без обладнання,спорт,зал`

## 7. Скриншоти
| Пристрій | Розмір (portrait) | Кількість | Статус |
|---|---|---|---|
| iPhone with Dynamic Island (medium display) | **1206 × 2622** (або 1179 × 2556) | 1–10 | готові: `store-screenshots/ios/iphone-uk-1206x2622/` |
| iPhone 6.9" | **1320 × 2868** | 1–10 (рекомендовано 3–5) | готові: українською `store-screenshots/ios/iphone-uk/`, англійською `store-screenshots/ios/iphone/` |
| iPad 13" | **2064 × 2752** | 1–10 | потрібні, якщо iPad не вимкнено |

Розміри для 6.5" і менших iPhone Apple масштабує сама з 6.9".

**Header asset** (5244 × 2950 / 3840 × 1646) — нова **необов'язкова** обкладинка сторінки.
Її можна пропустити, рецензія без неї пройде.

## 8. Build / Export Compliance
- Завантажте збірку з Xcode (Product → Archive → Distribute → App Store Connect) і виберіть
  її в розділі «Build» версії 1.0.
- Encryption: «None of the algorithms mentioned above» (тільки HTTPS)
  або `ITSAppUsesNonExemptEncryption = NO` у Info.plist.
