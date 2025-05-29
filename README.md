# KULON
> Devanka's Kulon: Multiplayer Survival Puzzle RPG<br>
- Live Demo: [Kulon](https://kulon.devanka.id/)
- Tools: [Kulon Map Editor](https://kulon.devanka.id/editor)

## INSTALASI
### Via Fork/Clone
Install semua dependencies dengan **NPM**
```shell
npm install
```
### Via Download
1. Extract dan masuk ke dalam folder `kulon-main`
2. Buka terminal dan arahkan ke dalam folder `kulon-main` tersebut
3. Install semua dependencies dengan **NPM**
```shell
npm install
```

## INITIAL ASSETS
Karena ukuran asset gambar dan audio yang tidak sedikit, harap download asset-asset tersebut melalui link ekternal berikut:
- Download [VIa Google Drive](https://drive.google.com/file/d/1MQnNpsrXLIvR9aspebHmfFhX91DwV2fy/view?usp=sharing)

Extract folder `assets`, `audio`, dan `images` dari yang sudah didownload tersebut ke dalam folder `./public`
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

## KONFIGURASI ENV
1. Buat file `.env` dan salin isi dari file `.env.example`
2. Modifikasi file `.env` sesuai dengan kebutuhan config kamu

## KONFIGURASI CONFIG
1. Buka file `src/server/config.json`
2. Modifikasi sesuai kebutuhan
```json
{
  "webhook": false,
  "update": false,
  "saveVersion": "r5rrgdwo"
}
```
> saat `webhook: true`, harap atur channel_id di `.env`. berguna untuk monitoring kendala player - joined/left, exchange, donation, mail claims

> saat `update: true`: jika terdapat player di dalam permainan, maka para player akan dipaksa untuk me-reload halaman tersebut setelah server direstart (berguna ketika menambah konten ingame, mengganti asset, atau ada masalah pada cloud savegame)

> saat `saveVersion` diperbarui: setelah player masuk ke dalam game untuk yang selanjutnya, maka player tersebut akan mengikuti tutorial kembali setelah server direstart (berguna ketika ada masalah pada localstorage)

## JALANKAN
### A. Development Mode
Buka 2 terminal atau 1 terminal dengan 2 tab
1. Watch Client Build
```shell
npm run dev:build
```
2. Watch Server Start
```shell
npm run dev:start
```
### B. Production Mode

#### Server Bundling, Assets Verifying, Client Bundling
```shell
npm run build
```
#### Start Server

##### B.1. Dengan NPM Script
```shell
npm run start
```
##### B.2. Dengan PM2 Script
```shell
pm2 start npm --name "kulon-app" -- start --max-memory-restart 8G
```
> Unit bisa dengan K (Kilobyte), M (Megabyte), G (Gigabyte)

## FITUR
1. Story Mode - Solo/Coop (Multiplayer)
2. Minigames - Versus (Mutiplayer)
3. Ingame Chat
4. Undangan Job (Ingame)
5. Inventory - Item pribadi
6. Sharing Inventory - Story Mode

## FITUR ADMIN
1. Menu Moderasi - Ban/Unban & Promote/Demote
2. Menu Teleport
3. Menu Bypass Job State Keys
4. Menu Kirim Surat + Rewards
