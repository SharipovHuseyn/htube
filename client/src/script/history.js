async function getHistoryData(){
    const historyContents = document.querySelector('.historyContents')

    const response = await fetch('/get-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    if(!response.ok){
        return console.log('Ошибка при запросе данных')
    }

    const { historyData } = await response.json()
    console.log(historyData)

    if(!historyData.length){
        document.querySelector('.showDataEmpty').textContent += "History is empty!"
        document.querySelector('.clearHistoryButton').classList.add('none')
    }

    historyData.forEach(history => {
        const progressWrapper = document.querySelector('.progress-wrapper')
        const progressPercent = (history.watched_seconds / history.video_seconds) * 100;

        const progressStyle = progressPercent > 0 ? '' : 'style="display: none;"';
        
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        const videoDuration = formatTime(history.video_seconds);
        
        const formatDate = (date) => {
            return `${date}`
        }
        const videoDate = formatDate(history.uploaded_at)

        historyContents.innerHTML += `
            <div class="historyContent" id="${history.view_id}">
                <a href="/watch?query=${history.filename}">
                    <div class="imgHistoryContent">
                        <div class="history-view-container">
                            <img class="headImgHistoryContent" src="/uploads/banners/${history.banner}" alt="${history.title}">
                            <div class="video-duration">${videoDuration}</div>
                            <div class="progress-wrapper" ${progressStyle}>
                                <div class="progress-video-view" style="width: ${progressPercent}%;"></div>
                            </div>
                        </div>
                    </div>
                </a>
                <a href="/watch?query=${history.filename}">
                    <div class="dataHistoryContents">
                        <div>
                            <h4 class="titleHistoryContent">${history.title}</h4>
                            <div class="goToChannel channelHistoryContent">
                                <h5 class="videoData">Football</h5>
                                <img class="iconSize15 confirmed" src="../components/icons/icons8-провереноj-100 8.png" alt="">
                            </div>
                        </div>
                        <ul class="dataHistoryContent">
                            <li class="listDataHistoryContent">2.7 M views</li>
                            <img class="iconDataHistoryContent" src="../components/icons/icons8-полная-остановка-24 2.png" alt="">
                            <li class="listDataHistoryContent">${timeAgo(videoDate)}</li>
                        </ul>
                    </div>
                </a>
                <div class="deleteViewVideoBlock">
                    <button  class="deleteViewVideo" onclick="deleteHistory(${history.view_id})">
                        <img class="deleteImage" src="../components/icons/icons8-effacer-100.png" alt="effacer">
                    </button>
                </div>
            </div>` 
    });
}

async function deleteHistory(ID) {
    if (ID === 'all') {
        const responseHistory = await fetch('/delete-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (responseHistory.ok) {
            document.querySelectorAll('.historyContent').forEach(el => el.classList.add('none'));
            document.querySelector('.showDataEmpty').textContent += "History is empty!"
        }
        return;
    }

    const responseHistory = await fetch('/delete-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ viewID: ID })
    });

    const historyContentID = document.getElementById(String(ID));
    const historyContent = document.querySelectorAll('.historyContent')

    if (responseHistory.ok && historyContentID) {
        historyContentID.classList.add('none');
    }
}


getHistoryData()