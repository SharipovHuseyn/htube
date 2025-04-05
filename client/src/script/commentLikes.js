function updateLikeUI(commentID, likeCount, likeStatus) {
    console.log(`updateLikeUI вызван с commentID: ${commentID}, likeCount: ${likeCount}, likeStatus: ${likeStatus}`);

    let commentBlock = document.getElementById(commentID);

    if (!commentBlock) {
        console.error(`Элемент с ID ${commentID} не найден`);
        return;
    }

    const likeCountElement = commentBlock.querySelector(".likeCount");
    const reactionLike = commentBlock.querySelector(".reactionLike img");
    const reactionDislike = commentBlock.querySelector(".reactionDislike img");

    if (!likeCountElement || !reactionLike || !reactionDislike) {
        console.error("Один или несколько элементов UI не найдены");
        return;
    }

    likeCountElement.textContent = likeCount;
    likeCountElement.style.display = likeCount === 0 ? "none" : "";
    console.log("likeCountElement обновлен:", likeCountElement.textContent);

    reactionLike.src = likeStatus === 1
        ? "../components/icons/on-like.png"
        : "../components/icons/off-like.png";
    
    reactionDislike.src = likeStatus === 0
        ? "../components/icons/on-dislike.png"
        : "../components/icons/off-dislike.png";

    console.log("reactionLike обновлен:", reactionLike.src);
    console.log("reactionDislike обновлен:", reactionDislike.src);
}

async function toggleReaction(commentID, reactionType) {
    console.log("toggleReaction")
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!commentID || reactionType === undefined || !videoID) {
        console.error("Некорректные данные для реакции");
        return;
    }

    try {
        const response = await fetch('/comment-reaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentID, reactionType, videoID })
        });

        if (!response.ok) {
            console.error('Ошибка при изменении лайка/дизлайка');
            return;
        }

        const data = await response.json();
        console.log("Ответ от сервера:", data);

        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
        }
        console.log(commentID, data.like_count, data.like_status)
        updateLikeUI(commentID, data.like_count, data.like_status);

    } catch (err) {
        console.error(`Ошибка при обработке ${reactionType}:`, err);
    }
}

async function getStatusCommentLikes() {
    console.log("getStatusCommentLikes")
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!videoID) {
        console.error("Ошибка: videoID отсутствует!");
        return;
    }

    try {
        const response = await fetch(`/get-likes-comments?query=${videoID}`);
        const data = await response.json();
        console.log("Данные лайков:", data);

        data.comment_likes.forEach(like => {
            setTimeout(() => updateLikeUI(like.comment_id, like.like_count, like.like_status), 500);
        });

    } catch (err) {
        console.error("Ошибка при загрузке данных лайков", err);
    }
}

async function getSubcommentLikes(parentCommentID) {
    console.log("getSubcommentLikes")
    if (!parentCommentID) {
        console.error("Не передан parentCommentID!");
        return;
    }

    try {
        const response = await fetch(`/get-likes-subcomments?commentID=${parentCommentID}`);
        const data = await response.json();
        console.log("Данные лайков подкомментариев:", data);

        data.subcomment_likes.forEach(like => {
            setTimeout(() => updateLikeUI(like.comment_id, like.like_count, like.like_status), 500);
        });

    } catch (err) {
        console.error("Ошибка при загрузке лайков подкомментариев", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getStatusCommentLikes();
})