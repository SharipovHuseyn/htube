async function getVideosWithProgress() {
    const response = await fetch('http://localhost:7070/get-videos-with-progress', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        console.error("Ошибка при получении списка видео");
        return;
    }

    const data = await response.json();
    const videoItemsEx = document.getElementById('videoItemsEx');

    videoItemsEx.innerHTML = "";
    data.videoData.forEach(video => {
        const progressWrapper = document.querySelector('.progress-wrapper')
        const progressPercent = (video.watched_seconds / video.video_seconds) * 100;

        const progressStyle = progressPercent > 0 ? '' : 'style="display: none;"';

        const videoDuration = formatVideoTime(video.video_seconds);
        videoItemsEx.innerHTML += `
            <a href="/watch?query=${video.filename}" class="pagesLink">
                <div class="videoItem exPosition" id="${video.id}">
                    <div class="video-view-container">
                        <img class="pictureVideo" src="/uploads/banners/${video.banner}" alt="video">
                        <div class="video-duration">${videoDuration}</div>
                        <div class="progress-wrapper" ${progressStyle}>
                            <div class="progress-video-view" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>
                    <div>
                        <div class="videoData-block">
                            <p class="videoData">2.7 M views</p>
                            <p class="videoData">a month ago</p>
                        </div>
                        <p class="videoHeader">${video.title}</p>
                        <div class="goToChannel">
                            <h5 class="videoData">Football</h5>
                            <img class="iconSize15 confirmed" src="../components/icons/icons8-провереноj-100 8.png" alt="">
                        </div>
                    </div>
                </div>
            </a>`;
    });
}

async function getExploreVideo(){
    const response = await fetch('/get-explore-video')

    if(!response.ok){
        console.error("Ошибка при получении списка видео");
        return;
    }

    const data = await response.json()

    console.log(data)
}

getExploreVideo()

document.addEventListener("DOMContentLoaded", getVideosWithProgress);