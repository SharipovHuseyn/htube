
let subscribeStatus = false;
let subscribeCount = 0;

async function getStatusSubscribe() {
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!videoID) {
        console.error("Ошибка: videoID отсутствует!");
        return;
    }

    try {
        const responseVideo = await fetch(`/get-video-data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoID })
        });

        if (!responseVideo.ok) {
            console.error("Ошибка при получении данных видео");
            return;
        }

        const videoinfo = await responseVideo.json();

        if (!videoinfo.videoData || videoinfo.videoData.length === 0) {
            console.error("Ошибка: данные видео не найдены");
            return;
        }

        const channelID = videoinfo.videoData.user_id;

        const responseSubscribe = await fetch(`/get-subscribe-status?channelID=${channelID}`);
        if (!responseSubscribe.ok) {
            console.error("Ошибка при получении статуса подписки");
            return;
        }

        const subscribeData = await responseSubscribe.json();

        subscribeCount = subscribeData.subscribe_count || 0;
        subscribeStatus = subscribeData.subscribe_status;

        updateSubscribeButton();

    } catch (error) {
        console.error("Ошибка при получении статуса подписки:", error);
    }
}

function updateSubscribeButton() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const countSubscribe = document.getElementById('countSubscribe');

    if (!subscribeBtn || !countSubscribe) {
        console.error("Ошибка: кнопка подписки или счётчик не найдены в DOM");
        return;
    }

    if (subscribeStatus) {
        subscribeBtn.classList.remove('subscribeBtnOff');
        subscribeBtn.classList.add('subscribedBtnOn');
        subscribeBtn.textContent = 'Subscribed';
    } else {
        subscribeBtn.classList.remove('subscribedBtnOn');
        subscribeBtn.classList.add('subscribeBtnOff');
        subscribeBtn.textContent = 'Subscribe';
    }

    countSubscribe.textContent = formatSubscribers(subscribeCount);    
}

async function subscribeToChannel() {
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!videoID) {
        console.error("Ошибка: videoID отсутствует!");
        return;
    }

    try {
        const responseVideo = await fetch(`/get-video-data`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoID })
        });

        if (!responseVideo.ok) {
            console.error("Ошибка при получении данных видео:", responseVideo.statusText);
            return;
        }

        const responseData = await responseVideo.json();
        const channelID = responseData.videoData?.user_id;

        if (!channelID) {
            console.error("Ошибка: channelID отсутствует!");
            return;
        }

        const response = await fetch(`/subscribe-to-channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelID })
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            console.error("Ошибка при подписке:", errorMessage.message || response.statusText);
            return;
        }

        const data = await response.json();

        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
        }

        subscribeStatus = !subscribeStatus;
        subscribeCount += subscribeStatus ? 1 : -1;

        updateSubscribeButton();

    } catch (error) {
        console.error("Ошибка при подписке:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener("click", subscribeToChannel);
    }
});