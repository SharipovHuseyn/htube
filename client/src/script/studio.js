async function getStudioData(){
    const response = await fetch('/get-studio-data', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
    });
    
    const showDataEmpty = document.querySelector('.showDataEmpty');
    const data = await response.json();
    
    
    if (!response.ok || (data.success === false && data.message === "No videos in Studio")) {
        console.log('Error: No videos found');
    
        if (showDataEmpty) {
            showDataEmpty.innerHTML = "No videos in the Studio.";
        } else {
            console.error("showDataEmpty is not defined");
        }
        return;
    }

    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
    } else {
        console.log('Data received:', data);
    }

    try{
        const StudioVideos = document.getElementById('StudioVideos')
    
    for(let i = 0; i < data.studio.length; i++){

        const videoDetails = await fetchVideoDetails(data.studio[i].filename);

        StudioVideos.innerHTML += `
        <div class="ContentEditorBlock" id="${data.studio[i].id}">
            <div class="headImgContentEditor">
                <img class="imgContentEditor" src="/uploads/banners/${data.studio[i].banner}" alt="${data.studio[i].title}">
            </div>
            <div class="headsContentEditor">
                <h4 class="headContentEditor">${data.studio[i].title}</h4>
                <p class="subtitleContentEditor">${data.studio[i].discription}</p>
            </div>
            <div class="dataContentEditor">
                <ul class="listsDataContentEditor">
                    <li class="listDataContentEditor">${timeAgo(data.studio[i].uploaded_at)} <p class="publishedDataContentEditor">Published</p></li>
                    <li class="listDataContentEditor">${videoDetails.views} views</li>
                    <li class="listDataContentEditor">${videoDetails.comments} comments</li>
                    <li class="listDataContentEditor">${videoDetails.likes} likes</li>
                </ul>
            </div>
            <div class="iconsContentEditor">
                <div class="iconContentEditor">
                    <button class="functionStudioBtn" onclick="linkToVideo(${data.studio[i].filename})">
                    <img class="iconSize20" src="../components/icons/icons8-external-link-100 1.png" alt="external-link">
                    </button>
                </div>
                <div class="iconContentEditor">
                    <button class="functionStudioBtn" onclick="editingVideo(${data.studio[i].id})">
                        <img class="iconSize15" src="../components/icons/icons8-редактировать-100 1.png" alt="editor">
                    </button>
                </div>
                <div class="iconContentEditor">
                    <button class="functionStudioBtn" type="submit" onclick="deleteVideo(${data.studio[i].id}, '${data.studio[i].filename}', '${data.studio[i].banner}')">
                        <img class="iconSize20" src="../components/icons/icons8-удалить-100 1.png" alt="delete">
                    </button>
                </div>
            </div>
        </div>
        <hr></hr>`
    }
    }catch(err){
        console.error(err)
    }
}

async function deleteVideo(videoID, videoPath, videoBanner){
    if(!videoID || !videoPath || !videoBanner){
        console.warn('Not found videoID, videoPath, videoBanner')
        return;
    }

    try{
        const response = await fetch('/delete-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoID, videoPath, videoBanner}),
        })
    
        if(!response.ok){
            console.error('Error when finding data');
            return;
        }
    
        const data = await response.json()
        
        console.log(data)

        if(data.success == true){
            showSuccess("Video deleted successfully!")
        }

    }catch(err){
        console.error(err)
    }
}

async function editingVideo(videoID) {
    const video = document.getElementById(videoID);
    if (!video) return console.error(`No element found with id "${videoID}"`);

    const titleElement = video.querySelector(".headContentEditor");
    const descriptionElement = video.querySelector(".subtitleContentEditor");
    const headsContentEditor = video.querySelector('.headsContentEditor');

    if (!titleElement || !descriptionElement || !headsContentEditor) {
        return console.error("Title or description element not found");
    }

        const isEditing = video.classList.contains("editing-mode");

    if (isEditing) {
        const inputTitle = document.getElementById(`input-title-${videoID}`);
        const inputDescription = document.getElementById(`input-description-${videoID}`);

        titleElement.textContent = inputTitle.value;
        descriptionElement.textContent = inputDescription.value;

        const saveStudioBtn = video.querySelector(".saveButton");
        if (saveStudioBtn) saveStudioBtn.remove();

        video.classList.remove("editing-mode");
    } else {
        video.classList.add("editing-mode");

        const originalTitle = titleElement.textContent.trim();
        const originalDescription = descriptionElement.textContent.trim();

        let saveStudioBtn = video.querySelector(".saveButton");
        if (!saveStudioBtn) {
            saveStudioBtn = document.createElement('button');
            saveStudioBtn.textContent = 'Save';
            saveStudioBtn.classList.add("saveButton");
            headsContentEditor.appendChild(saveStudioBtn);
        }

        function replaceWithInput(element, isTextArea = false, inputId, originalValue) {
            if (!element) return;
            const inputElement = isTextArea ? document.createElement("textarea") : document.createElement("input");
            inputElement.classList.add("commentEditInput");
            inputElement.value = originalValue;
            inputElement.id = inputId;
            element.innerHTML = "";
            element.appendChild(inputElement);
        }

        replaceWithInput(titleElement, false, `input-title-${videoID}`, originalTitle);
        replaceWithInput(descriptionElement, true, `input-description-${videoID}`, originalDescription);

        saveStudioBtn.onclick = async function () {
            const newTitle = document.getElementById(`input-title-${videoID}`).value.trim();
            const newDescription = document.getElementById(`input-description-${videoID}`).value.trim();

            if (newTitle === originalTitle && newDescription === originalDescription) {
                console.log("No changes detected.");
                return;
            }

            try {
                const response = await fetch('/update-video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoID, newTitle, newDescription })
                });

                if (!response.ok) throw new Error('Error saving changes');

                console.log('Changes saved successfully');

                titleElement.textContent = newTitle;
                descriptionElement.textContent = newDescription;

                saveStudioBtn.remove();
                video.classList.remove("editing-mode");
            } catch (err) {
                console.error("Failed to save changes:", err);
            }
        };
    }
}

async function saveChanges(videoID) {
    const newTitle = document.getElementById(`input-title-${videoID}`).value;
    const newDescription = document.getElementById(`input-description-${videoID}`).value;

    const response = await fetch('/update-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoID, newTitle, newDescription })
    });

    if (!response.ok) {
        console.error('Error saving changes');
        return;
    }

    console.log('Changes saved successfully');
}

async function fetchVideoDetails(videoID) {
    try {
        const response = await fetch(`/video-details/${videoID}`);
        const data = await response.json();

        if (!data.success) {
            console.error("Error:", data.message);
            return { views: 0, comments: 0, likes: 0 };
        }

        return {
            views: data.video.views,
            comments: data.video.comments,
            likes: data.video.likes
        };
    } catch (error) {
        console.error("Failed to fetch video details:", error);
        return { views: 0, comments: 0, likes: 0 };
    }
}


window.onload = ()=>{
    getStudioData()
}
