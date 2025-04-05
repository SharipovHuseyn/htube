let likeStatus = null;
let likeCount = 0;

async function getLikeStatus() {
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!videoID) {
        console.error("Ошибка: videoID или userID отсутствуют!");
        return;
    }

    try {
        const response = await fetch(`/get-like-status?videoID=${videoID}`);
        const data = await response.json();

        if (data.like_count === undefined) {
            console.error("Ошибка при получении количества лайков");
            return;
        }

        likeStatus = data.like_status;
        likeCount = data.like_count;
        
        updateLikeUI(likeStatus, likeCount);
    } catch (error) {
        console.error("Ошибка при получении статуса лайка:", error);
    }
}

function toggleLike() {
    if (likeStatus === 1) {
        likeStatus = null;
        likeCount -= 1;
    } else if (likeStatus === 0) {
        likeStatus = 1;
        likeCount += 1;
    } else {
        likeStatus = 1;
        likeCount += 1;
    }
    updateLikeUI(likeStatus, likeCount);
}

function toggleDislike() {
    if (likeStatus === 0) {
        likeStatus = null;
    } else if (likeStatus === 1) {
        likeStatus = 0;
        likeCount -= 1;
    } else {
        likeStatus = 0;
    }
    updateLikeUI(likeStatus, likeCount);
}

function updateLikeUI(status, count) {
    const likeImg = document.getElementById("likeImage");
    const dislikeImg = document.getElementById("dislikeImage");
    const likeCounter = document.getElementById("countLike");

    if (status === 1) {
        likeImg.src = "../components/icons/icons8-liked.png";
        dislikeImg.src = "../components/icons/icons8-dislike.png";
    } else if (status === 0) {
        likeImg.src = "../components/icons/icons8-like.png";
        dislikeImg.src = "../components/icons/icons8-disliked.png";
    } else {
        likeImg.src = "../components/icons/icons8-like.png";
        dislikeImg.src = "../components/icons/icons8-dislike.png";
    }

    likeCounter.textContent = formatLikes(count);
}

window.addEventListener("beforeunload", async () => {
    const params = new URLSearchParams(window.location.search);
    const videoID = Number(params.get("query"));

    if (!videoID) return;

    try {
        await fetch('/update-likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoID, likeStatus })
        });
    } catch (error) {
        console.error("Ошибка при сохранении лайков:", error);
    }
});