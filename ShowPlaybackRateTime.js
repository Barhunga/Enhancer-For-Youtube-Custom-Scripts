(async () => {
    // Convert seconds to hh:mm:ss
    function formatTime(seconds) {
        const isNegative = seconds < 0;

        seconds = Math.floor(Math.abs(seconds));
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const time = h
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;

        return isNegative ? `-${time}` : time;
    }

    // Convert hh:mm:ss to seconds
    function parseTime(text) {
        const parts = text.split(":").map(Number);

        if (parts.length === 2)
            return parts[0] * 60 + parts[1];

        if (parts.length === 3)
            return parts[0] * 3600 + parts[1] * 60 + parts[2];

        return NaN;
    }

    const video = document.querySelector("video");
    const duration = document.querySelector(".ytp-time-duration");
    const current = document.querySelector(".ytp-time-current");
    const live = document.querySelector(".ytp-live-badge");
    
    if (!video || !duration || !current || !live) return;
    
    function updateDisplay(currentTime) {
        if (!isFinite(video.duration)) return;

        // if is a stream
        if (live.ariaLabel) {
            //if (live.disabled) // to check if at live -> or .ytp-live-badge-is-livehead
            live.textContent = `Live (${video.playbackRate}x)`;
            return;
        }
    
        const adjustedCurrent =
            (current.textContent.startsWith("-") ? -1 * (video.duration - currentTime) : currentTime) / video.playbackRate;
        const adjustedEnd =
            video.duration / video.playbackRate;

        duration.textContent =
            `${formatTime(video.duration)} (${formatTime(adjustedCurrent)}/${formatTime(adjustedEnd)}) ${video.playbackRate}x`;
    }

    function update() {
        updateDisplay(video.currentTime);
    }
    
    update();

    function updatePill(pill) {
        if (video.playbackRate === 1 || pill.textContent.endsWith(")"))
            return;
        
        pill.textContent = `${pill.textContent} (${formatTime(parseTime(pill.textContent) / video.playbackRate)})`;
    }
    
    video.addEventListener('timeupdate', update);
    video.addEventListener('ratechange', update);
    video.addEventListener('loadedmetadata', update);
    
    // Update while seeking
    const tooltip = document.querySelector(".ytp-fine-scrubbing-seek-time");
    const pill = document.querySelector(".ytp-tooltip-progress-bar-pill-time-stamp");
    const pillMini = await getPill();

    function getPill() {
        return new Promise(resolve => {
            const check = () => {
                const pillL = document.querySelector("efyt-progress-tooltip");
                if (pillL)
                    resolve(pillL);
                else
                    setTimeout(check, 250);
            }
            check();
        });
    }

    const observer = new MutationObserver(mutationRecords => {
        if (!isFinite(video.duration)) return;

        for (const record of mutationRecords) {
            if (record.addedNodes.length !== 1)
                continue;

            switch (record.target) {
                case pill:
                    updatePill(pill);
                    break;

                case tooltip:
                    const preview = parseTime(tooltip.textContent);

                    if (!isFinite(preview)) return;

                    updateDisplay(preview);
                    break;

                case pillMini:
                    updatePill(pillMini);
                    break;
            }
        }
    });
    if (tooltip) {
        observer.observe(tooltip, {
            childList: true,
        });
    }
    observer.observe(pill, {
        childList: true
    });
    observer.observe(pillMini, {
        childList: true,
    });
    
    // Cutoff feature
    /*let called = false;
    
    function resetPage() {
        called = false;
    }
    
    function setPlaySpeed() {
        if (!called) {
            called = true;
            setTimeout( () => {
                if (video.duration >= parseTime('10:00')) video.playbackRate = video.duration / parseTime('10:00'); // funny idea makes every video 10 mins 
            }, 200);
        }
    }
    video.addEventListener('play', setPlaySpeed);
    document.addEventListener("yt-navigate-finish", resetPage);*/
})();