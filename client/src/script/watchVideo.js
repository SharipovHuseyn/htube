document.addEventListener("DOMContentLoaded", async () => {
    const video = document.getElementById("video");
    let hls;
    let startTime = Date.now();
    let videoID; 

    function getVideoToWatch() {

        const params = new URLSearchParams(window.location.search);
        videoID = params.get("query");

        if (!videoID) {
            console.error("Ошибка: videoID не найден в URL!");
            return;
        }

        const videoSrc = `http://localhost:7070/videos/${videoID}/master.m3u8`;
        console.log("Видео загружается с URL:", videoSrc);

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = videoSrc;
            video.addEventListener("loadedmetadata", () => {
                video.play();
            });
        }
    }

    async function getVideoData(){
        const params = new URLSearchParams(window.location.search);
        videoID = params.get("query");
        const response = await fetch(`/get-video-data`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoID })
        });

        if (!response.ok) {
            console.log('Error while receiving video data');
        }

        const data = await response.json();
        const nameWatchVideo = document.querySelector('.nameWatchVideo');
        const textAboutAVideo = document.querySelector('.textAboutAVideo');
        const moreBtn = document.querySelector('.moreBtn');
        const dataChannel = document.querySelector('.DataChannel');
        const сhannelName = document.querySelector('.сhannelName');
        const сhannelAvatar = document.querySelector('.сhannelAvatar');
        
        dataChannel.addEventListener('click', ()=> {
            if(data.videoData.user_id){
                window.location.href = `/channel?query=${data.videoData.user_id}`
            }
        })

        if (data.videoData) {
            nameWatchVideo.textContent = data.videoData.title;
            document.title = data.videoData.title;
            сhannelName.textContent = data.videoData.slug
            сhannelAvatar.src = `uploads/avatars/${data.videoData.avatarImage}`

            const fullDescription = data.videoData.discription;
        
            if (fullDescription.length > 350) {
                textAboutAVideo.textContent = fullDescription.substr(0, 350) + "...";
                if (moreBtn) {
                    moreBtn.classList.remove('none');
                }
            } else {
                textAboutAVideo.textContent = fullDescription;
            }
        } else {
            console.error("No video data found");
        }
    }

    document.getElementById("imageQuality").addEventListener("change", function () {
        const currentTime = video.currentTime;
        const selectedQuality = this.value;
        const params = new URLSearchParams(window.location.search);
        videoID = params.get("query");

        if (!videoID) {
            console.error("Ошибка: Video ID не найден");
            return;
        }

        const newVideoSrc = `http://localhost:7070/videos/${videoID}/${selectedQuality}.m3u8`;

        if (hls) {
            hls.destroy();
            hls = new Hls();
            hls.loadSource(newVideoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.currentTime = currentTime;
                video.play();
            });
        } else {
            video.src = newVideoSrc;
            video.onloadedmetadata = () => {
                video.currentTime = currentTime;
                video.play();
            };
        }
    });

    function sendViewEndRequest() {
        if (!videoID) return;
    
        const currentTime = video.currentTime;
        const watchedTime = video.ended ? 0 : currentTime;
    
        console.log(`Время просмотра: ${watchedTime} сек.`);
    
        fetch(`/views`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_id: videoID,
                watched_seconds: watchedTime
            })
        })
        .then(response => response.json())
        .then(data => console.log('Ответ сервера:', data))
        .catch(error => console.error('Ошибка запроса:', error));
    }    

    async function getVideoProgress() {    
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get("query");
        
        if (!videoID) {
            console.error("Не удалось получить videoID из URL");
            return;
        }
        
        try {
            const response = await fetch(`/get-video-progress?query=${videoID}`);
        
            if (!response.ok) {
                console.log('Ошибка при получении прогресса видео');
                return;
            }
        
            const data = await response.json();
        
            if (data.progress) {
                console.log(`Восстановлено время видео: ${data.progress} сек.`);
                if (video) {
                    video.currentTime = data.progress;  // Устанавливаем время воспроизведения
                    console.log(`Видео начнется с ${data.progress} сек.`);
                }
            } else {
                console.log('Прогресс видео не найден');
            }
        } catch (error) {
            console.error('Произошла ошибка при запросе прогресса видео:', error);
        }
    }
    
    window.addEventListener("beforeunload", sendViewEndRequest);
    window.addEventListener("popstate", sendViewEndRequest);
    window.addEventListener("hashchange", sendViewEndRequest);

    getVideoData();
    getVideoToWatch();
    getVideoProgress();
});

window.onload = () => {
    getLikeStatus()
    getStatusSubscribe()
    getComments()
};