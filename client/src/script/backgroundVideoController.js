const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const lampVideo = document.querySelector('#lampVideo');

let glowInterval = null;
let glowEnabled = false;

function getAverageColor(x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height).data;

    let r = 0, g = 0, b = 0;
    const pixelCount = imageData.length / 4;

    for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
    }

    const avgR = Math.floor(r / pixelCount);
    const avgG = Math.floor(g / pixelCount);
    const avgB = Math.floor(b / pixelCount);

    const dimFactor = 0.6; // Уменьшаем яркость на 30%

    const dimR = Math.floor(avgR * dimFactor);
    const dimG = Math.floor(avgG * dimFactor);
    const dimB = Math.floor(avgB * dimFactor);

    return `rgba(${dimR}, ${dimG}, ${dimB}, 0.3)`;
}

function updateGlow() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const edgeSize = 20;

    const topColor = getAverageColor(0, 0, width, edgeSize);
    const bottomColor = getAverageColor(0, height - edgeSize, width, edgeSize);
    const leftColor = getAverageColor(0, 0, edgeSize, height);
    const rightColor = getAverageColor(width - edgeSize, 0, edgeSize, height);

    const topLeftColor = getAverageColor(0, 0, edgeSize, edgeSize);
    const topRightColor = getAverageColor(width - edgeSize, 0, edgeSize, edgeSize);
    const bottomLeftColor = getAverageColor(0, height - edgeSize, edgeSize, edgeSize);
    const bottomRightColor = getAverageColor(width - edgeSize, height - edgeSize, edgeSize, edgeSize);

    videoContainer.style.boxShadow = `
        -5px -5px 10px ${topLeftColor},
        5px -5px 10px ${topRightColor},
        -5px 5px 10px ${bottomLeftColor},
        5px 5px 10px ${bottomRightColor},
        0px -10px 20px ${topColor},
        0px 10px 20px ${bottomColor},
        -10px 0px 20px ${leftColor},
        10px 0px 20px ${rightColor}
    `;
}

function startGlow() {
    if (!glowInterval) {
        glowInterval = setInterval(updateGlow, 500);
    }
}

function stopGlow() {
    if (glowInterval) {
        clearInterval(glowInterval);
        glowInterval = null;
        videoContainer.style.boxShadow = '';
    }
}

video.addEventListener('play', () => {
    glowEnabled = true;
    startGlow();
});

video.addEventListener('pause', stopGlow);
video.addEventListener('ended', stopGlow);

lampVideo.addEventListener('click', () => {
    if (glowInterval) {
        stopGlow();
        glowEnabled = false;
    } else {
        glowEnabled = true;
        startGlow();
    }
});
