const video = document.getElementById('video');
const videoContainer = document.querySelector('.video-container');
const playPauseBtn = document.getElementById('playPause');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const watchedBar = document.getElementById('watchedBar');
const timeDisplay = document.getElementById('time');
const volumeSlider = document.getElementById('volume');
const fullscreenBtn = document.getElementById('fullscreen');
const overlayIcon = document.getElementById('overlayIcon');
const overlay_icon = document.querySelector('.overlay-icon')

const controls = document.querySelector(".controls");

let hideControlsTimeout;
let isCursorOverVideo = false;

function hideControls() {
    if (!video.paused && isCursorOverVideo) {
        controls.classList.add("hidden");
        videoContainer.style.cursor = "none"; // Скрытие курсора
    }
}

function showControls() {
    controls.classList.remove("hidden");
    videoContainer.style.cursor = "default"; // Возвращаем курсор
    resetHideControlsTimer();
}

function resetHideControlsTimer() {
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(hideControls, 5000); // 5 секунд бездействия
}

videoContainer.addEventListener("mouseenter", () => {
    isCursorOverVideo = true;
    showControls();
});

videoContainer.addEventListener("mouseleave", () => {
    isCursorOverVideo = false;
    hideControls();
});

videoContainer.addEventListener("mousemove", showControls);
videoContainer.addEventListener("click", showControls);
video.addEventListener("pause", showControls);
video.addEventListener("play", resetHideControlsTimer);

hideControlsTimeout = setTimeout(hideControls, 5000);

let isDragging = false;

const showOverlayIcon = (icon) => {
    overlayIcon.textContent = icon;
    overlayIcon.classList.add('show');
    setTimeout(() => overlayIcon.classList.remove('show'), 500);
};

overlay_icon.addEventListener('click', ()=>{
    playPauseBtn.click()
})

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const updateProgress = () => {
    const percentage = (video.currentTime / video.duration) * 100;
    progress.style.width = `${percentage}%`;
    watchedBar.style.width = `${Math.max(parseFloat(watchedBar.style.width || 0), percentage)}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
};

const setProgress = (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * video.duration;
    video.currentTime = newTime;
};

playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<img class="iconSize20 iconBackgorundNone" src="../components/icons/icons8-пауза-100.png" alt="pause">';
        showOverlayIcon('▶');
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<img class="iconSize20 iconBackgorundNone" src="../components/icons/icons8-play-100 1.png" alt="play">';
        showOverlayIcon('⏸');
    }
});

video.addEventListener('click', () => {
    playPauseBtn.click();
    video.focus();
});

video.addEventListener('timeupdate', updateProgress);

progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    setProgress(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) setProgress(e);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

volumeSlider.addEventListener('input', () => {
    video.volume = volumeSlider.value;
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        video.parentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
})

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
    }

    switch (e.key) {
        case ' ':
            playPauseBtn.click();
            e.preventDefault();
            break;
        case 'ArrowRight':
            video.currentTime = Math.min(video.currentTime + 5, video.duration);
            e.preventDefault();
            break;
        case 'ArrowLeft':
            video.currentTime = Math.max(video.currentTime - 5, 0);
            e.preventDefault();
            break;
        case 'f':
        case 'F':
        case 'А':
        case 'а':
            fullscreenBtn.click();
            e.preventDefault();
            break;
        case 'ArrowUp':
            video.volume = Math.min(video.volume + 0.1, 1);
            volumeSlider.value = video.volume;
            e.preventDefault();
            break;
        case 'ArrowDown':
            video.volume = Math.max(video.volume - 0.1, 0);
            volumeSlider.value = video.volume;
            e.preventDefault();
            break;
    }
});
