# 🎬 htube(YouTube Clone)
>Youtube clone | Full Stack project

**Полнофункциональный клон YouTube с системой видео, комментариев и подписок**

![Главная страница](./screenshots/home-page.png)

## ✨ Основные возможности

### 🎥 Видео хостинг
- Адаптивный стриминг (HLS) с поддержкой 480p/720p/1080p
- Прогресс просмотра для каждого видео
- Система лайков/дизлайков

### 💬 Социальные функции
- Комментарии с ответами и вложенностью
- Лайки/дизлайки для комментариев
- Подписки на каналы
- История просмотров

### 👤 Персонализация
- Гостевой режим
- Регистрация с подтверждением email
- Настройки профиля

## 🛠 Технологии

**Серверная часть:**
<div align="left">
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/FFmpeg-6.0-007808?logo=ffmpeg" alt="FFmpeg">
</div>

**Клиентская часть:**
<div align="left">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/HLS.js-1.2.0-FF6B00?logo=hls" alt="HLS.js">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3" alt="CSS3">
</div>

## 🚀 Быстрый старт

1. Клонируйте репозиторий:
```bash
git clone https://github.com/SharipovHuseyn/youtube-clone.git
cd htube/server/

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
  ./server/.env
```bash
SECRET_KEY_REGISTER = YOUR_REGISTER_KEY_RECAPTCHA
SECRET_KEY_LOGIN = YOUR_LOGIN_KEY_RECAPTCHA
PASSWORDGMAIL = YOUR_PASSWORD_GMAIL

DB_HOST = localhost
DB_USER = root
DB_PASSWORD = root
DB_DATABASE = htube
DB_PORT = 8889
```

4. Database setup:
- Create MySQL database
- Import structure from `htube.sql`

5. Run the server:
```bash
node server.js
```

Visit `http://localhost:7070` in your browser.

## Project Structure

```
├── client/               # Frontend assets
│   ├── src/              # Static files
│   └── pages/            # EJS templates
├── uploads/              # User uploads
│   ├── avatars/          # Profile pictures
│   ├── banners/          # Video thumbnails
│   └── videos/           # Processed video files
├── server.js             # Main application
├── htube.sql          # Database schema
└── .env.example          # Configuration template
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/uploadVideo` | POST | Upload and process video |
| `/watch` | GET | Stream video content |
| `/comments` | POST | Add new comment |
| `/subscribe` | POST | Subscribe to channel |
| `/history` | GET | Get watch history |

## Screenshots
![History Page](./screenshots/history-page.png)
![Studio Page](./screenshots/studio-page.png)
![Upload Video Page](./screenshots/upload-video-page.png)
![Upload Video](./screenshots/upload-video.png)
![Video Player](./screenshots/video-player.png)
