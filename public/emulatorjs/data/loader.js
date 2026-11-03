(async function() {
    const assetRevision = "4.2.1-n64-c-buttons-1";
    const scripts = [
        "emulator.js",
        "nipplejs.js",
        "shaders.js",
        "storage.js",
        "gamepad.js",
        "GameManager.js",
        "socket.io.min.js",
        "compression.js"
    ];

    const folderPath = (path) => path.substring(0, path.length - path.split('/').pop().length);
    let scriptPath = (typeof window.EJS_pathtodata === "string") ? window.EJS_pathtodata : folderPath((new URL(document.currentScript.src)).pathname);
    if (!scriptPath.endsWith('/')) scriptPath+='/';
    const withAssetRevision = (url) => url + (url.includes('?') ? '&' : '?') + 'v=' + assetRevision;

    function loadScript(file) {
        return new Promise(function (resolve, reject) {
            let script = document.createElement('script');
            script.src = function() {
                if ('undefined' != typeof EJS_paths && typeof EJS_paths[file] === 'string') {
                    return EJS_paths[file];
                } else if (file.endsWith("emulator.min.js")) {
                    return withAssetRevision(scriptPath + file);
                } else {
                    return withAssetRevision(scriptPath + "src/" + file);
                }
            }();
            script.onload = resolve;
            script.onerror = () => {
                filesmissing(file).then(e => resolve());
            }
            document.head.appendChild(script);
        })
    }

    function loadStyle(file) {
        return new Promise(function(resolve, reject) {
            let css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = function() {
                if ('undefined' != typeof EJS_paths && typeof EJS_paths[file] === 'string') {
                    return EJS_paths[file];
                } else {
                    return withAssetRevision(scriptPath + file);
                }
            }();
            css.onload = resolve;
            css.onerror = () => {
                filesmissing(file).then(e => resolve());
            }
            document.head.appendChild(css);
        })
    }

    async function filesmissing(file) {
        console.error("Failed to load " + file);
        let minifiedFailed = file.includes(".min.") && !file.includes("socket");
        if (minifiedFailed) {
            if (file === "emulator.min.js") {
                for (let i=0; i<scripts.length; i++) {
                    await loadScript(scripts[i]);
                }
            } else {
                await loadStyle('emulator.css');
            }
        }
    }

    if (('undefined' != typeof EJS_DEBUG_XX && true === EJS_DEBUG_XX)) {
        for (let i=0; i<scripts.length; i++) {
            await loadScript(scripts[i]);
        }
        await loadStyle('emulator.css');
    } else if (typeof window.EmulatorJS !== 'function') {
        await loadScript('emulator.min.js');
        await loadStyle('emulator.min.css');
    }

    function installMobileAudioUnlock() {
        if (typeof EmulatorJS !== 'function' || EmulatorJS.prototype.__ejsMobileAudioUnlockV3) return;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (!isIOS) return;

        const prototype = EmulatorJS.prototype;
        Object.defineProperty(prototype, '__ejsMobileAudioUnlockV3', {
            value: true,
            configurable: false,
            enumerable: false
        });

        prototype.checkStarted = function() {
            const emulator = this;
            const getAudioContexts = () => {
                const contexts = new Set();
                const addContext = (context) => {
                    if (context && typeof context.resume === 'function') contexts.add(context);
                };

                addContext(emulator.audio && emulator.audio.context);
                addContext(emulator.Module && emulator.Module.SDL2 && emulator.Module.SDL2.audioContext);
                addContext(
                    emulator.Module
                    && emulator.Module.AL
                    && emulator.Module.AL.currentCtx
                    && emulator.Module.AL.currentCtx.audioCtx
                );
                const sources = emulator.Module
                    && emulator.Module.AL
                    && emulator.Module.AL.currentCtx
                    && emulator.Module.AL.currentCtx.sources;
                if (sources && typeof sources.forEach === 'function') {
                    sources.forEach((source) => addContext(
                        source && source.gain && source.gain.context
                    ));
                }
                return contexts;
            };

            const showResumePromptIfNeeded = () => {
                if (!emulator.started || emulator.failedToStart) return;
                const contexts = getAudioContexts();
                const needsGesture = Array.from(contexts).some((context) => (
                    context.state === 'suspended' || context.state === 'interrupted'
                ));
                if (!needsGesture) return;

                const popupBody = emulator.createPopup("", {});
                const button = emulator.createElement("button");
                button.innerText = emulator.localization("Click to resume Emulator");
                button.classList.add("ejs_menu_button");
                button.style.width = "25%";
                button.style.height = "25%";
                button.style.background = "transparent";
                button.style.border = "0";
                button.style.outline = "none";
                button.style.boxShadow = "none";
                button.style.webkitAppearance = "none";
                button.style.webkitTapHighlightColor = "transparent";
                popupBody.appendChild(button);
                popupBody.style["text-align"] = "center";
                popupBody.style["font-size"] = "28px";

                const popup = emulator.currentPopup;
                if (!popup) return;
                popup.style.webkitTapHighlightColor = "transparent";
                popup.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    getAudioContexts().forEach((context) => {
                        if (context.state !== 'suspended' && context.state !== 'interrupted') return;
                        try {
                            const result = context.resume();
                            if (result && typeof result.catch === 'function') {
                                result.catch(() => {});
                            }
                        } catch (error) {}
                    });

                    emulator.closePopup();
                    if (emulator.menu && typeof emulator.menu.close === 'function') {
                        requestAnimationFrame(() => emulator.menu.close());
                    }
                }, { once: true });
            };

            const checkWhenAudioIsReady = (attempt) => {
                const hasOpenALSources = Boolean(
                    emulator.Module
                    && emulator.Module.AL
                    && emulator.Module.AL.currentCtx
                    && emulator.Module.AL.currentCtx.sources
                    && typeof emulator.Module.AL.currentCtx.sources.forEach === 'function'
                );
                if (hasOpenALSources || getAudioContexts().size > 0) {
                    setTimeout(showResumePromptIfNeeded, 300);
                    return;
                }
                if (attempt >= 120 || !emulator.started) return;
                setTimeout(() => checkWhenAudioIsReady(attempt + 1), 25);
            };
            checkWhenAudioIsReady(0);
        };
    }

    installMobileAudioUnlock();

    function installAsyncLifecycleGuards() {
        if (typeof EmulatorJS !== 'function' || EmulatorJS.prototype.__ejsAsyncLifecycleGuards) return;

        const prototype = EmulatorJS.prototype;
        Object.defineProperty(prototype, '__ejsAsyncLifecycleGuards', {
            value: true,
            configurable: false,
            enumerable: false
        });

        if (!Object.prototype.hasOwnProperty.call(prototype, 'gameManager')) {
            Object.defineProperty(prototype, 'gameManager', {
                value: Object.freeze({
                    simulateInput: function() {}
                }),
                writable: true,
                configurable: true,
                enumerable: false
            });
        }

        const originalStartGame = prototype.startGame;
        if (typeof originalStartGame === 'function') {
            prototype.startGame = function() {
                const result = originalStartGame.apply(this, arguments);
                if (this.textElem === null) {
                    this.textElem = this.createElement('span');
                }
                return result;
            };
        }
    }

    installAsyncLifecycleGuards();

    function installDetachedInstanceResizeGuard() {
        if (typeof EmulatorJS !== 'function' || EmulatorJS.prototype.__ejsDetachedResizeGuard) return;

        const prototype = EmulatorJS.prototype;
        const originalHandleResize = prototype.handleResize;
        if (typeof originalHandleResize !== 'function') return;

        Object.defineProperty(prototype, '__ejsDetachedResizeGuard', {
            value: true,
            configurable: false,
            enumerable: false
        });

        prototype.handleResize = function() {
            if (
                this.__cgzDisposed
                || !this.game
                || !this.game.parentElement
                || !this.elements
                || !this.elements.parent
                || !this.elements.parent.isConnected
            ) {
                return;
            }
            return originalHandleResize.apply(this, arguments);
        };
    }

    installDetachedInstanceResizeGuard();

    function installDecompressedCoreCache() {
        if (window.EJS_cacheDecompressedCores !== true || typeof indexedDB === 'undefined') return;
        if (typeof EmulatorJS !== 'function' || EmulatorJS.prototype.__ejsDecompressedCoreCache) return;

        const prototype = EmulatorJS.prototype;
        const originalCheckCompression = prototype.checkCompression;
        if (typeof originalCheckCompression !== 'function') return;

        Object.defineProperty(prototype, '__ejsDecompressedCoreCache', {
            value: true,
            configurable: false,
            enumerable: false
        });

        const databaseName = 'EmulatorJS-decompressed-core-cache';
        const storeName = 'cores';

        const openDatabase = () => new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, 1);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(storeName)) {
                    database.createObjectStore(storeName, { keyPath: 'key' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const readCachedCore = async (key) => {
            const database = await openDatabase();
            try {
                return await new Promise((resolve, reject) => {
                    const transaction = database.transaction(storeName, 'readonly');
                    const request = transaction.objectStore(storeName).get(key);
                    request.onsuccess = () => resolve(request.result ? request.result.files : null);
                    request.onerror = () => reject(request.error);
                });
            } finally {
                database.close();
            }
        };

        const writeCachedCore = async (key, files) => {
            const database = await openDatabase();
            try {
                await new Promise((resolve, reject) => {
                    const transaction = database.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    store.put({ key, files, savedAt: Date.now() });
                    transaction.oncomplete = resolve;
                    transaction.onerror = () => reject(transaction.error);
                    transaction.onabort = () => reject(transaction.error);
                });
            } finally {
                database.close();
            }
        };

        const fingerprintCore = async (data, emulator) => {
            const prefix = [
                emulator.ejs_version || 'unknown',
                emulator.getCore ? emulator.getCore() : emulator.config.system,
                data.byteLength
            ].join(':');

            if (window.crypto && window.crypto.subtle) {
                const digest = await window.crypto.subtle.digest('SHA-256', data);
                const digestText = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
                return prefix + ':' + digestText;
            }

            let hash = 2166136261;
            const step = Math.max(1, Math.floor(data.byteLength / 4096));
            for (let index = 0; index < data.byteLength; index += step) {
                hash ^= data[index];
                hash = Math.imul(hash, 16777619);
            }
            return prefix + ':' + (hash >>> 0).toString(16);
        };

        prototype.checkCompression = async function(data, message, fileCallback) {
            const coreMessage = this.localization('Decompress Game Core');
            const isGameCore = (message === coreMessage || message === 'Decompress Game Core') && data instanceof Uint8Array && !fileCallback;
            if (!isGameCore) {
                return originalCheckCompression.call(this, data, message, fileCallback);
            }

            let cacheKey;
            try {
                cacheKey = await fingerprintCore(data, this);
                const cachedFiles = await readCachedCore(cacheKey);
                if (
                    cachedFiles &&
                    Object.keys(cachedFiles).some(file => file.endsWith('.wasm')) &&
                    Object.keys(cachedFiles).some(file => file.endsWith('.js'))
                ) {
                    return cachedFiles;
                }
            } catch (error) {
                console.warn('Could not read decompressed EmulatorJS core cache', error);
            }

            const files = await originalCheckCompression.call(this, data, message, fileCallback);
            if (cacheKey && files) {
                try {
                    await writeCachedCore(cacheKey, files);
                } catch (error) {
                    console.warn('Could not save decompressed EmulatorJS core cache', error);
                }
            }
            return files;
        };
    }

    installDecompressedCoreCache();

    const config = {};
    config.gameUrl = window.EJS_gameUrl;
    config.dataPath = scriptPath;
    config.system = window.EJS_core;
    config.biosUrl = window.EJS_biosUrl;
    config.gameName = window.EJS_gameName;
    config.color = window.EJS_color;
    config.adUrl = window.EJS_AdUrl;
    config.adMode = window.EJS_AdMode;
    config.adTimer = window.EJS_AdTimer;
    config.adSize = window.EJS_AdSize;
    config.alignStartButton = window.EJS_alignStartButton;
    config.VirtualGamepadSettings = window.EJS_VirtualGamepadSettings;
    config.buttonOpts = window.EJS_Buttons;
    config.volume = window.EJS_volume;
    config.defaultControllers = window.EJS_defaultControls;
    config.startOnLoad = window.EJS_startOnLoaded;
    config.fullscreenOnLoad = window.EJS_fullscreenOnLoaded;
    config.filePaths = window.EJS_paths;
    config.loadState = window.EJS_loadStateURL;
    config.cacheLimit = window.EJS_CacheLimit;
    config.cheats = window.EJS_cheats;
    config.defaultOptions = window.EJS_defaultOptions;
    config.gamePatchUrl = window.EJS_gamePatchUrl;
    config.gameParentUrl = window.EJS_gameParentUrl;
    config.netplayUrl = window.EJS_netplayServer;
    config.gameId = window.EJS_gameID;
    config.backgroundImg = window.EJS_backgroundImage;
    config.backgroundBlur = window.EJS_backgroundBlur;
    config.backgroundColor = window.EJS_backgroundColor;
    config.controlScheme = window.EJS_controlScheme;
    config.threads = window.EJS_threads;
    config.disableCue = window.EJS_disableCue;
    config.startBtnName = window.EJS_startButtonName;
    config.softLoad = window.EJS_softLoad;
    config.screenRecording = window.EJS_screenRecording;
    config.externalFiles = window.EJS_externalFiles;
    config.disableDatabases = window.EJS_disableDatabases;
    config.disableLocalStorage = window.EJS_disableLocalStorage;
    config.forceLegacyCores = window.EJS_forceLegacyCores;
    config.noAutoFocus = window.EJS_noAutoFocus;
    config.videoRotation = window.EJS_videoRotation;
    config.shaders = Object.assign({}, window.EJS_SHADERS, window.EJS_shaders ? window.EJS_shaders : {});

    if (typeof window.EJS_language === "string" && window.EJS_language !== "en-US") {
        try {
            let path;
            if ('undefined' != typeof EJS_paths && typeof EJS_paths[window.EJS_language] === 'string') {
                path = EJS_paths[window.EJS_language];
            } else {
                path = scriptPath+"localization/"+window.EJS_language+".json";
            }
            config.language = window.EJS_language;
            config.langJson = JSON.parse(await (await fetch(path)).text());
        } catch(e) {
            config.langJson = {};
        }
    }

    window.EJS_emulator = new EmulatorJS(EJS_player, config);
    if (window.EJS_forceTouchControls === true) {
        window.EJS_emulator.touch = true;
    }
    window.EJS_adBlocked = (url, del) => window.EJS_emulator.adBlocked(url, del);
    if (typeof window.EJS_ready === "function") {
        window.EJS_emulator.on("ready", window.EJS_ready);
    }
    if (typeof window.EJS_onGameStart === "function") {
        window.EJS_emulator.on("start", window.EJS_onGameStart);
    }
    if (typeof window.EJS_onLoadState === "function") {
        window.EJS_emulator.on("loadState", window.EJS_onLoadState);
    }
    if (typeof window.EJS_onSaveState === "function") {
        window.EJS_emulator.on("saveState", window.EJS_onSaveState);
    }
    if (typeof window.EJS_onLoadSave === "function") {
        window.EJS_emulator.on("loadSave", window.EJS_onLoadSave);
    }
    if (typeof window.EJS_onSaveSave === "function") {
        window.EJS_emulator.on("saveSave", window.EJS_onSaveSave);
    }
})();
