# KULON
> Devanka's Kulon: Multiplayer Survival Puzzle RPG<br>
- Live Demo: [Kulon](https://kulon.devanka.id/)
- Tools: [Kulon Map Editor](https://kulon.devanka.id/editor)
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

## KONFIGURASI ENV
1. Buat file `.env` dan salin isi dari file `.env.example`
2. Modifikasi file `.env` sesuai dengan kebutuhan config kamu

## KONFIGURASI CONFIG
1. Buka file `src/server/config.json`
2. Modifikasi sesuai kebutuhan
```javascript
{
  "webhook": false, // untuk monitoring kendala user - joined/left, exchange, donation, mail claims
  "update": false, // ganti saat sebelum start/restart server
  "saveVersion": "r5rrgdwo" // ganti saat sebelum restart server
}
```
> saat `webhook: true`, harap atur channel_id di `.env`

> saat `update: true`: jika terdapat user di dalam permainan, maka para user akan dipaksa untuk me-reload halaman tersebut setelah server direstart (berguna ketika menambah konten ingame, mengganti asset, atau ada masalah pada cloud savegame)

> saat `saveVersion` diperbarui: setelah player masuk ke dalam game untuk yang selanjutnya, maka player tersebut akan mengikuti tutorial kembali (berguna ketika ada masalah pada localstorage)

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
npm run imp:build
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