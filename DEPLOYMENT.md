# RouteLogs — інструкція з розгортання (handoff для розробника)

> Статичний маркетинговий сайт RouteLogs. Зараз працює на Railway:
> https://routelogs.up.railway.app — цей документ описує, як перенести його
> на будь-який інший хостинг без втрати поведінки (безпека, кеш, SEO).

---

## 1. Архітектура за 30 секунд

- **Чисті HTML + CSS + vanilla JS** (без фреймворків). Сторінки: `index.html`,
  `privacy.html`, `terms.html`, `404.html`.
- **Білд** (`build.mjs`, Node ≥ 20): мініфікує та content-hash'ить
  `styles.css` → `styles-<hash>.css`, `app.js` → `app-<hash>.js`, мініфікує HTML,
  підставляє домен у токен `%%SITE_URL%%`, копіює статичні файли → видає **`/dist`**.
- **Сервінг**: `Caddyfile` — єдине джерело правди для заголовків безпеки,
  кешування, стиснення, чистих URL і 404.
- **Docker** (`Dockerfile`, multi-stage): Node збирає `/dist` → Caddy роздає.
  Образи запінені за digest, фінальний контейнер працює від non-root.
- Жодного бекенда, БД чи секретів. Шрифти самохостяться (`/fonts`), Calendly
  вантажиться лениво при кліку.

## 2. Змінні середовища (всі — опційні)

| Змінна | Призначення | Дефолт |
|---|---|---|
| `SITE_URL` | **Build-time.** Підставляється в canonical / Open Graph / sitemap.xml / robots.txt / security.txt. Міняєш домен → перезбираєш. | `https://routelogs.up.railway.app` |
| `PORT` | **Run-time.** Порт, на якому слухає Caddy. | `8080` |

⚠️ `SITE_URL` діє **на етапі збірки** (запікається у файли), не на рантаймі.

## 3. Швидкий старт — Docker (рекомендований шлях)

```bash
docker build --build-arg SITE_URL=https://YOUR-DOMAIN.com -t routelogs-site .
docker run -d -p 8080:8080 -e PORT=8080 routelogs-site
curl -sI http://localhost:8080/   # перевірити 200 + заголовки
```

Поведінка з коробки: усі security-заголовки, zstd/gzip, immutable-кеш для
хешованих ресурсів, `/privacy`·`/terms` як чисті URL, брендована 404 зі
статусом 404.

**TLS:** `Caddyfile` зібраний під TLS-термінацію на edge (`auto_https off`) —
як на Railway/за reverse-proxy/CDN. Якщо контейнер дивиться в інтернет
безпосередньо і є домен — у `Caddyfile` заміни `:{$PORT:8080}` на
`your-domain.com` і прибери `auto_https off` — Caddy сам отримає сертифікат
Let's Encrypt.

## 4. Альтернатива — будь-який статичний хостинг (nginx/Apache/CDN)

```bash
npm ci
SITE_URL=https://YOUR-DOMAIN.com npm run build   # → ./dist
# вивантажити вміст ./dist у корінь хостингу
```

Але тоді **поведінку `Caddyfile` треба відтворити вручну**. Мінімальний
еквівалент для nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;
  root /var/www/routelogs/dist;

  gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;

  # --- security headers (точна копія Caddyfile) ---
  add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https://*.calendly.com; font-src 'self' https://assets.calendly.com; style-src 'self' 'unsafe-inline' https://assets.calendly.com; script-src 'self' https://assets.calendly.com; frame-src https://calendly.com; connect-src 'self' https://*.calendly.com; upgrade-insecure-requests" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), idle-detection=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), web-share=(), xr-spatial-tracking=(), browsing-topics=(), interest-cohort=()" always;
  add_header Cross-Origin-Opener-Policy "same-origin" always;
  add_header Cross-Origin-Resource-Policy "same-origin" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Permitted-Cross-Domain-Policies "none" always;
  server_tokens off;

  # --- кеш ---
  location ~ ^/(styles|app)-[a-f0-9]+\.(css|js)$ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location /fonts/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location ~ \.(png|svg|ico)$|^/(site\.webmanifest|robots\.txt|sitemap\.xml)$ { add_header Cache-Control "public, max-age=86400"; }
  location / {
    add_header Cache-Control "public, max-age=0, must-revalidate";
    try_files $uri $uri.html =404;     # чисті URL: /privacy → privacy.html
  }
  error_page 404 /404.html;            # брендована 404 зі справжнім 404
}
```
(Нюанс nginx: `add_header` у `location` скасовує заголовки рівня `server` —
у реальному конфізі продублюй security-блок або винеси в include.)

## 5. Поточна інфраструктура (для міграції/вимкнення)

- **GitHub:** `oleksandr-hontar-bagroup/routelogs-site`, продакшн-гілка `main`.
- **Railway:** проєкт `routelogs-site`, сервіс `web` — **авто-деплой з `main`
  активний**. Поки сервіс живий, кожен пуш у `main` деплоїться на
  `routelogs.up.railway.app`. Після переїзду — відключи repo у Railway
  (Service → Settings → Disconnect) або видали сервіс, щоб не було двох
  продакшнів.
- Git-історія повна — в архіві є `routelogs-site.bundle`
  (`git clone routelogs-site.bundle routelogs-site`).

## 6. Нюанси, на які варто звернути увагу

1. **`SITE_URL` — найважливіше.** Забудеш — canonical/OG/sitemap вкажуть на
   Railway-домен. Завжди збирай з реальним доменом.
2. **HSTS має `includeSubDomains; preload`.** Якщо на цільовому домені є інші
   сабдомени без HTTPS — вони зламаються. Або прибери ці директиви в
   `Caddyfile`, або переконайся, що весь домен на TLS. До hstspreload.org
   подавайся лише коли впевнений — це фактично незворотньо.
3. **CSP жорстка.** Будь-який новий сторонній скрипт/стиль (аналітика, чат
   тощо) без додавання origin у CSP буде мовчки заблокований. Джерело правди —
   `Caddyfile`.
4. **Шрифти самохостяться** — Google Fonts CDN не підключати (CSP його й не
   пропустить). Усе у `/fonts` + `@font-face` у `styles.css`.
5. **Calendly:** URL — плейсхолдер (`app.js` → `CALENDLY_URL`, позначено
   коментарем). Вантажиться лениво при першому кліці «Request a Demo»;
   фолбек — нова вкладка.
6. **Login/Sign up — фронтенд-мок** (без бекенда), показує стан «доступ
   розгортається». Demo-форма теж нікуди не POST'ить — валідує й відкриває
   Calendly з префілом.
7. **404 мусить віддавати статус 404** (не 200) — інакше SEO-шкода. У Docker
   це вже так; на іншому хостингу перевір.
8. **`scripts/` (gen:fonts, gen:assets) для деплою не потрібні** — це one-off
   генератори; їхні результати закомічені. `npm ci` ставить лише build-залежності
   (`--omit=optional` у Dockerfile).
9. **Dependabot** уже налаштований (`.github/dependabot.yml`) — стежить за npm,
   Docker-digest'ами та Actions.
10. Заголовок `server: railway-hikari` на поточному сайті — від edge Railway;
    сам застосунок `Server` не світить (на новому хостингу його не буде).

## 7. Плейсхолдери — замінити перед/після запуску

- [ ] `SITE_URL` → реальний домен (при збірці)
- [ ] `CALENDLY_URL` в `app.js` → реальне посилання
- [ ] Телефон у футері (`tel:+10000000000`)
- [ ] Скриншоти продукту (всі підписані плейсхолдери)
- [ ] Ціни планів і цитата пілот-партнера
- [ ] Privacy/Terms — рев'ю юристом (позначено в самих сторінках)
- [ ] «Log in» → реальний застосунок, коли з'явиться

## 8. Чекліст перевірки після деплою

```bash
D=https://YOUR-DOMAIN.com
curl -sI $D/                 # 200 + CSP/HSTS/nosniff/Permissions-Policy/COOP/CORP/XFO
curl -sI $D/privacy          # 200 (чистий URL)
curl -sI $D/no-such-page     # 404 (не 200!) + ті ж security-заголовки
curl -sI --compressed $D/styles-*.css   # Cache-Control: immutable + Content-Encoding
curl -s  $D/ | grep canonical           # href = реальний домен
curl -s  $D/robots.txt && curl -s $D/sitemap.xml | head   # обидва на реальний домен
```
Плюс: Lighthouse (очікувано 95–100 perf), securityheaders.com (очікувано A+),
мобільний прогін (меню-гамбургер, свайп-карусель прайсингу, ROI-калькулятор).

---
*Питання по коду — все самодокументоване: `README.md` (загальне),
`Caddyfile` (заголовки/кеш), `build.mjs` (збірка), `app.js` (інтерактив).*
