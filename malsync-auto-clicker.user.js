// ==UserScript==
// @name         MalSync Auto-Clicker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatisation des boutons MalSync.
// @author       Symswag
// @match        *://*.crunchyroll.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=anilist.co
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // =====================================================================
    // ⚙️ CONFIGURATION & SAUVEGARDE
    // =====================================================================
    const AL_BLUE = '#3db4f2';

    let msConfig = GM_getValue('ms_auto_config', {
        start: true,
        finish: true,
        rewatch_start: false,
        rewatch_finish: false,
        delay: 3,
        score: 10
    });

    let currentEpisodeId = null;
    let actedThisEpisode = {
        start: false,
        finish: false,
        rewatch_start: false,
        rewatch_finish: false
    };

    let pendingTimeouts = {};

    GM_addStyle(`
        #ms-auto-menu { position: absolute; bottom: 85px; right: 330px; z-index: 2147483647; background: rgba(14, 15, 18, 0.95); color: #fff; padding: 18px; border-radius: 8px; border: 1px solid rgba(61,180,242,0.2); width: 280px; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.7); display: none; backdrop-filter: blur(5px); }
        .ms-menu-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .ms-menu-header h3 { margin: 0; color: ${AL_BLUE}; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .ms-icon-btn { background: transparent; color: #aaa; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: color 0.2s; font-size: 18px;}
        .ms-icon-btn:hover { color: #fff; }

        .ms-row { margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #ddd;}
        .ms-row label { cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .ms-row input[type="checkbox"] { cursor: pointer; accent-color: ${AL_BLUE}; width: 14px; height: 14px; margin: 0; }

        .ms-pill-wrapper { display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; transition: all 0.2s; }
        .ms-pill-wrapper:focus-within { border-color: ${AL_BLUE}; box-shadow: 0 0 5px rgba(61,180,242,0.2); }
        .ms-pill-input { width: 40px !important; background: transparent !important; color: ${AL_BLUE} !important; border: none !important; padding: 4px 0 4px 6px !important; text-align: right; font-weight: bold; font-family: "Segoe UI", sans-serif; font-size: 13px; -moz-appearance: textfield; outline: none; }
        .ms-pill-input::-webkit-outer-spin-button, .ms-pill-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .ms-pill-label { color: #666; font-size: 11px; padding: 0 8px 0 4px; font-weight: bold; user-select: none; }

        .ms-status-text { font-size: 11px; color: #aaa; text-align: center; margin-top: 15px; font-style: italic; min-height: 15px;}
        .ms-highlight { color: ${AL_BLUE}; font-weight: bold; }
        #ms-main-btn:hover svg { fill: ${AL_BLUE}; }
    `);

    // =====================================================================
    // 🧠 LOGIQUE D'AUTOMATISATION MALSYNC
    // =====================================================================

    function getEpisodeId() {
        const match = window.location.pathname.match(/\/watch\/([^\/]+)/);
        return match ? match[1] : null;
    }

    function triggerClick(actionKey, flashClass, searchText, isFinish = false) {
        if (pendingTimeouts[actionKey]) return; // On attend déjà pour cette action

        updateStatus(`Détection <span class="ms-highlight">${actionKey.toUpperCase()}</span>. Clic dans ${msConfig.delay}s...`);

        pendingTimeouts[actionKey] = setTimeout(() => {
            // ⚠️ CORRECTION : On recherche le bouton à l'instant T du clic,
            // car MalSync peut recréer l'élément HTML pendant le délai d'attente.
            const flashes = document.querySelectorAll('.flash');
            const currentFlash = Array.from(flashes).find(f => f.classList.contains(flashClass) && (f.textContent || '').includes(searchText));

            if (currentFlash) {
                const currentYesBtn = currentFlash.querySelector('button.Yes');
                if (currentYesBtn) {

                    if (isFinish) {
                        const selectEl = currentFlash.querySelector('select#finish_score');
                        if (selectEl) {
                            let targetScore = parseInt(msConfig.score, 10);
                            if (targetScore <= 10) targetScore = targetScore * 10;

                            const optionExists = Array.from(selectEl.options).some(opt => parseInt(opt.value) === targetScore);
                            if (optionExists) {
                                selectEl.value = targetScore;
                                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }

                    currentYesBtn.click();
                    actedThisEpisode[actionKey] = true;
                    updateStatus(`<span class="ms-highlight">${actionKey.toUpperCase()}</span> validé !`);
                }
            } else {
                 // Si le popup n'existe vraiment plus (ex: tu as cliqué dessus toi-même entre temps)
                 updateStatus(`Action annulée : popup disparu.`);
            }

            delete pendingTimeouts[actionKey];
        }, msConfig.delay * 1000);
    }

    function checkMalSyncButtons() {
        const flashes = document.querySelectorAll('.flash');

        flashes.forEach(flash => {
            const textContent = flash.textContent || '';

            if (msConfig.start && !actedThisEpisode.start && flash.classList.contains('type-add') && textContent.includes('Commencer le visionnage')) {
                triggerClick('start', 'type-add', 'Commencer le visionnage', false);
            }
            else if (msConfig.finish && !actedThisEpisode.finish && flash.classList.contains('type-complete') && textContent.includes('Marquer comme terminé')) {
                triggerClick('finish', 'type-complete', 'Marquer comme terminé', true);
            }
            else if (msConfig.rewatch_start && !actedThisEpisode.rewatch_start && flash.classList.contains('type-add') && textContent.includes('Revoir cet anime')) {
                triggerClick('rewatch_start', 'type-add', 'Revoir cet anime', false);
            }
            else if (msConfig.rewatch_finish && !actedThisEpisode.rewatch_finish && flash.classList.contains('type-complete') && textContent.includes('Terminer le re-visionnage')) {
                triggerClick('rewatch_finish', 'type-complete', 'Terminer le re-visionnage', true);
            }
        });
    }

    // =====================================================================
    // 🖥️ INTERFACE UTILISATEUR
    // =====================================================================

    const SYNC_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" class="kat:w-24 kat:h-24 kat:@lg:w-40 kat:@lg:h-40 kat:shrink-0"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;

    function updateStatus(text) {
        const st = document.getElementById('ms-status');
        if (st) st.innerHTML = text;
    }

    function saveConfig() {
        GM_setValue('ms_auto_config', msConfig);
    }

    function initMenuAndButton() {
        let playerContainer = document.querySelector('video')?.parentElement?.parentElement;
        if (!playerContainer) return;

        if (!document.getElementById('ms-auto-menu')) {
            const stop = (e) => e.stopPropagation();

            const menu = document.createElement('div');
            menu.id = 'ms-auto-menu';
            menu.innerHTML = `
                <div class="ms-menu-header">
                    <h3>⚙️ MalSync Auto</h3>
                    <button class="ms-icon-btn" id="ms-close-menu">✖</button>
                </div>

                <div style="font-size: 13px; color: ${AL_BLUE}; margin-bottom: 10px; font-weight: bold;">Actions Automatiques</div>

                <div class="ms-row">
                    <label><input type="checkbox" id="ms-cb-start" ${msConfig.start ? 'checked' : ''}> Start Watching</label>
                </div>
                <div class="ms-row">
                    <label><input type="checkbox" id="ms-cb-finish" ${msConfig.finish ? 'checked' : ''}> Finish Watching</label>
                </div>
                <div class="ms-row">
                    <label><input type="checkbox" id="ms-cb-rstart" ${msConfig.rewatch_start ? 'checked' : ''}> Start Rewatching</label>
                </div>
                <div class="ms-row">
                    <label><input type="checkbox" id="ms-cb-rfinish" ${msConfig.rewatch_finish ? 'checked' : ''}> Finish Rewatching</label>
                </div>

                <hr style="border-color: rgba(255,255,255,0.05); margin: 15px 0;">

                <div class="ms-row" style="margin-bottom: 8px;">
                    <span style="color:#aaa;">Note auto (Finish)</span>
                    <div class="ms-pill-wrapper" title="Note à attribuer (de 1 à 10)">
                        <input type="number" class="ms-pill-input" id="ms-in-score" value="${msConfig.score}" min="1" max="10">
                        <span class="ms-pill-label">/10</span>
                    </div>
                </div>

                <div class="ms-row">
                    <span style="color:#aaa;">Délai avant clic</span>
                    <div class="ms-pill-wrapper" title="Temps d'attente avant le clic">
                        <input type="number" class="ms-pill-input" id="ms-in-delay" value="${msConfig.delay}" min="0">
                        <span class="ms-pill-label">sec</span>
                    </div>
                </div>

                <div class="ms-status-text" id="ms-status">En attente de détection MalSync...</div>
            `;
            playerContainer.appendChild(menu);
            menu.addEventListener('mousedown', stop); menu.addEventListener('click', stop);

            // Listeners
            document.getElementById('ms-close-menu').onclick = () => menu.style.display = 'none';

            document.getElementById('ms-cb-start').onchange = (e) => { msConfig.start = e.target.checked; saveConfig(); };
            document.getElementById('ms-cb-finish').onchange = (e) => { msConfig.finish = e.target.checked; saveConfig(); };
            document.getElementById('ms-cb-rstart').onchange = (e) => { msConfig.rewatch_start = e.target.checked; saveConfig(); };
            document.getElementById('ms-cb-rfinish').onchange = (e) => { msConfig.rewatch_finish = e.target.checked; saveConfig(); };

            document.getElementById('ms-in-score').onchange = (e) => {
                let val = parseInt(e.target.value);
                if(val > 10) val = 10;
                if(val < 1) val = 1;
                e.target.value = val;
                msConfig.score = val;
                saveConfig();
            };
            document.getElementById('ms-in-delay').onchange = (e) => { msConfig.delay = e.target.value; saveConfig(); };
        }

        if (!document.getElementById('ms-main-btn')) {
            const outer = document.createElement('div');
            outer.className = 'kat:relative';
            outer.style.display = 'flex';
            outer.style.alignItems = 'center';

            const inner = document.createElement('div'); inner.className = 'kat:relative';
            const btn = document.createElement('button');
            btn.id = 'ms-main-btn'; btn.type = 'button'; btn.title = "MalSync Auto-Clicker";
            btn.className = 'kat:flex kat:items-center kat:justify-center kat:h-44 kat:w-44 kat:@lg:h-64 kat:@lg:w-64 kat:opacity-75 kat:hover:opacity-100 kat:fill-icon-tertiary kat:hover:bg-neutral-700 kat:rounded-full kat:cursor-pointer';
            btn.innerHTML = SYNC_SVG;

            const block = (e) => { e.preventDefault(); e.stopPropagation(); };
            btn.addEventListener('click', (e) => {
                block(e);
                const menu = document.getElementById('ms-auto-menu');
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
            btn.addEventListener('mousedown', block);
            inner.appendChild(btn); outer.appendChild(inner);

            let target = document.querySelector('[data-testid="track-selection-button"]') ||
                         document.querySelector('[data-testid="settings-button"]');

            if (target) {
                let btnGroup = target.parentElement;
                while (btnGroup && btnGroup.children.length < 2 && btnGroup.tagName !== 'BODY') {
                    btnGroup = btnGroup.parentElement;
                }
                if (btnGroup) { btnGroup.insertBefore(outer, btnGroup.firstChild); }
                else { target.parentElement.insertBefore(outer, target); }
            }
        }
    }

    window.addEventListener('pointerdown', (e) => {
        const m = document.getElementById('ms-auto-menu');
        const b = document.getElementById('ms-main-btn');
        if (m?.style.display === 'block' && !m.contains(e.target) && !b?.contains(e.target)) {
            m.style.display = 'none';
        }
    }, true);

    // Boucle de vérification
    setInterval(() => {
        const id = getEpisodeId();
        if (!id) {
            currentEpisodeId = null;
            return;
        }

        if (id !== currentEpisodeId) {
            currentEpisodeId = id;
            actedThisEpisode = { start: false, finish: false, rewatch_start: false, rewatch_finish: false };
            Object.keys(pendingTimeouts).forEach(key => clearTimeout(pendingTimeouts[key]));
            pendingTimeouts = {};
            updateStatus("En attente de détection MalSync...");
        }

        initMenuAndButton();
        checkMalSyncButtons();

    }, 1000);

})();