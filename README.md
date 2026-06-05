# MalSync Auto-Clicker 🚀

[![Version](https://img.shields.io/badge/version-1.2-blue.svg)](https://github.com/Symswag/)
[![Platform](https://img.shields.io/badge/platform-Crunchyroll-orange.svg)](https://www.crunchyroll.com/)

**MalSync Auto-Clicker** is a lightweight userscript designed to automate interactions with the [MalSync](https://malsync.moe/) extension popups directly on **Crunchyroll**. No more manual clicking to sync your anime progress at the beginning or end of an episode—this script takes care of it automatically based on your preferences!

---

## ✨ Features

* 🤖 **Full Automation:** Automatically clicks MalSync's confirmation buttons so you can stay immersed in your binge-watching.
* 📺 **Status Management:** Supports "Start Watching", "Finish Watching", as well as "Start Rewatching" and "Finish Rewatching" triggers.
* ⏱️ **Adjustable Delay:** Set a custom countdown (in seconds) before the auto-click triggers to prevent accidental or instant updates.
* ⭐ **Auto-Rating:** Define a default score (1 to 10) that will be automatically selected and submitted when finishing an anime.
* 🎨 **Integrated UI:** A sleek, dark-themed configuration panel (inspired by AniList colors) seamlessly injected directly into the Crunchyroll player controls.
* 💾 **Persistent Settings:** Your configurations are saved locally and carry over across browser sessions using Tampermonkey storage.

---

## 📸 Interface Preview

The script adds a custom synchronization icon right next to Crunchyroll's native player buttons (Settings/Subtitles). Clicking it toggles a clean overlay menu where you can:

* **Toggle switches** to enable or disable each automated action independently.
* **Input fields** to quickly adjust your default rating and click delay.
* **Real-time status text** at the bottom showing exactly what action the script is currently performing or waiting for.

---

## 🛠️ Installation

### Prerequisites
1. A userscript manager installed on your browser (e.g., [Tampermonkey](https://www.tampermonkey.net/), **Violentmonkey**, or **Greasemonkey**).
2. The **MalSync** browser extension installed and configured.

### Method 1: Direct Install (Recommended) ⚡
1. Click on the `malsync-auto-clicker.user.js` file inside this GitHub repository.
2. Click the **Raw** button at the top right of the code window.
3. Your userscript manager (like Tampermonkey) will automatically open and ask you to confirm the installation. Click **Install**.

### Method 2: Manual Install
1. Open your userscript manager dashboard and click **Create a new script**.
2. Copy the full code from the `malsync-auto-clicker.user.js` file.
3. Paste it into the editor and save (`Ctrl + S` / `Cmd + S`).

---

## ⚙️ Configuration Options

Once you open the built-in menu in the player:
* **Start Watching**: Automatically validates the "Commencer le visionnage" popup.
* **Finish Watching**: Automatically validates the "Marquer comme terminé" popup.
* **Note auto (Finish)**: The score (from 1 to 10) that will be automatically selected before submitting completion.
* **Délai avant clic**: The wait time in seconds before the script performs the click (Default: `3` seconds).

---

## 📝 Under the Hood

The script runs efficiently in the background using a 1-second interval loop (`setInterval`) to:
* Track your current episode ID and instantly reset states when you switch episodes.
* Safely re-inject the control button and configuration menu into Crunchyroll's video player layout.
* Monitor MalSync's dynamic popup elements (`.flash`) and handle edge cases where the extension recreates DOM nodes during the delay period.