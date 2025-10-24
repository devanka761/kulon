# KULON

- Live Demo: [Kulon](https://kulon.devanka.id/)

## INITIAL ASSETS
Ukuran asset gambar dan audio terlalu besar, bisa download manual lewat link eksternal berikut:
- Download [Via Google Drive](https://drive.google.com/file/d/1MQnNpsrXLIvR9aspebHmfFhX91DwV2fy/view?usp=sharing)

Extract folder `assets`, `audio`, dan `images` dari yang sudah didownload tersebut ke folder `./public`
#### Visual struktur folder asset:
```shell
public
├───assets
│   ├───characters
│   │   ├───Bodies
│   │   ├───Outfit
│   │   └─── ...
│   ├───items
│   │   ├───cloud
│   │   └─── ...
│   └─── ...
│       └─── ...
├───audio
│   ├───bgm
│   └───sfx
├───images
└───json
    ├───items
    ├───locales
    ├───main
    └─── ...
```

## INSTALL
### Via Fork/Clone
Instal semua dependencies pake **npm**
```shell
npm install
```
### Via Download
1. Extract dan masuk ke folder `kulon-main`
2. Buka terminal dan arahkan ke folder `kulon-main`
3. Instal semua dependencies pake **npm**
```shell
npm install
```

## CONFIG: .ENV
1. Copy file `.env.example` ke `.env`
2. Edit file `.env` sesuai kebutuhan


## CONFIG: PEER
Edit `src/config/peer.json` dengan kebutuhan konfigurasi **[RTCConfiguration](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection)** yang kamu mau. Biarin tetep `null` kalo ga mau pake konfigurasi tambahan
> contoh: `src/config/peer.example.json`

## CONFIG: DISCORD WEBHOOK
Edit `src/config/discord.json`, harap bijak kalo mau pake, khusus mode development
```javascript
{
  // kalo true, isi semua kebutuhan konfigurasi discord di `.env`
  // default false - biar ga bikin berat server
  "USE_WEBHOOK": false,

  // monitor aktivitas misi
  "DISCORD_MISSION": "000000000",

  // monitor aktivitas achievement
  "DISCORD_ACHIEVEMENT": "000000000",

  // monitor aktivitas surat sistem
  "DISCORD_MAIL": "000000000",

  // monitor aktivitas penukaran
  "DISCORD_EXCHANGE": "000000000",

  // monitor aktivitas username yang tersedia
  "DISCORD_USERNAME": "000000000",

  // monitor aktivitas online/offline user
  "DISCORD_USERLOG": "000000000",

  // monitor aktivitas development - callback/throw tambahan kalo ada error & crash
  "DISCORD_DEV": "000000000"
}
```

## RUN
### A. Development Mode
Buka 2 terminal atau 1 terminal dengan 2 tabs
1. Watch Client Build
```shell
npm run dev:build
```
2. Watch Server Start
```shell
npm run dev:start
```

### B. Production Mode

#### Bundle frontend dan compile backend
```shell
npm run build
```
#### Start Server

##### B.1. Dengan npm script
```shell
npm run start
```
##### B.2. Dengan pm2 script
```shell
pm2 start npm  --name "kulon-app" --max-memory-restart 8G -- start
```
> [!TIP]
> Unit bisa pake K(ilobyte), M(egabyte), G(igabyte)

## FITUR
1. Online Story Mode (Co-op/Solo)
2. Online Minigame (Co-op/Versus)
3. Friend List (Undangan Job Privat)
4. Pengaturan Audio, Kontrol, Notif, Bahasa
5. Surat (sistem hadiah), Achievement, Toko
6. Akun & tanpa akun - (Cloud Save)

## FITUR INTERNAL (hire me pls)
1. Game/Map Editor (in-app engine)
2. Moderasi - ban/unband/access bypass (in-app)
3. Micro-transaction + dashboard (in-app)