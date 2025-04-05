const dropZone = document.getElementById('dropZone');
const videoUpload = document.getElementById('videoUpload');
const progressBar = document.getElementById('loadingUploadVideo');
const onUploadVideo = document.getElementById('onUploadVideo');
const offUploadVideo = document.getElementById('offUploadVideo');

let userData = [];

function addUserData(key, value) {
    userData[key] = value;
    console.log(userData);
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorText.textContent = message;

    errorDiv.classList.remove('show');

    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);

    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const successText = document.getElementById('success-text');

    successText.textContent = message;

    successDiv.classList.remove('show');

    setTimeout(() => {
        successDiv.classList.add('show');
    }, 10);

    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length) {
        handleFiles(files);
    }
});

videoUpload.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length) {
        handleFiles(files);
    }
});

function handleFiles(files) {
    const file = files[0];
    if (file.type.startsWith('video/')) {
        simulateUpload(file);
    } else {
        showError('Please upload a valid video file.');
    }
}

function simulateUpload(file) {
    onUploadVideo.classList.remove('none');
    offUploadVideo.classList.add('none');
    uploadVideo(file); // Здесь вызывается функция для загрузки видео
}

document.getElementById('videobanner').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageContainer = document.getElementById('imagePreview');
            imageContainer.innerHTML = `
            <img src="${e.target.result}" alt="Uploaded Image" />
            <p class="imageTitles">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }
});

async function uploadVideo(file) {
    const formData = new FormData();
    formData.append('video', file);
    console.log('Start uploading video...');

    // Отправляем файл на сервер
    const response = await fetch('http://localhost:7070/uploadVideo', {
        method: 'POST',
        body: formData,
    });

    if (response.ok) {
        const { taskId, redirectUrl, duration } = await response.json()
        addUserData('filename', taskId)
        console.log(`Upload started with task ID: ${taskId}`);
        if (duration) {
            addUserData('video_seconds', duration)
        }
        await checkProcessingStatus(taskId)
        if(redirectUrl){
            window.location.href  = redirectUrl
        }
    } else {
        console.error('Ошибка загрузки файла');
        showError('Ошибка загрузки файла');
    }
}

function uploadDataBtn(bool){
    const uploadSettingsBtn = document.getElementById('uploadSettings-btn')
    uploadSettingsBtn.disabled = bool
    uploadSettingsBtn.style.background = 'var(--color-red)'
}

async function checkProcessingStatus(taskId) {
    let isProcessingComplete = false;
    while (!isProcessingComplete) {
        const statusResponse = await fetch(`http://localhost:7070/uploadStatus/${taskId}`);
        const statusData = await statusResponse.json();

        if (statusResponse.ok) {
            console.log(`Processing status: ${statusData.status}`);
            updateProgressBar(statusData.progress, statusData.resolution);

            if (statusData.status === 'complete') {
                console.log('Processing complete!');
                showSuccess('Все видео обработаны!');
                isProcessingComplete = true;
                uploadDataBtn(false)
            }
        } else {
            console.error('Ошибка при получении статуса обработки');
            showError('Ошибка при получении статуса обработки');
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

function updateProgressBar(percent, resolution) {
    const progressBar = document.getElementById('loadingUploadVideo');
    const progressText = progressBar.querySelector('.progressPercent');
    const progress = progressBar.querySelector('.progress-bar');

    if (progressText) {
        progressText.textContent = percent+'%';
    }

    if (progress) {
        progress.style.width = percent + '%';
    }
}

const tagContainer = document.getElementById('tagContainer');
const input = document.getElementById('videotags');

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.trim() !== '') {
        event.preventDefault();
        addTag(input.value.trim());
        input.value = '';
    }
    if (event.key === 'Backspace' && input.value === '') {
        removeLastTag();
    }
});

function addTag(tagText) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${tagText}<span class="remove-tag">&times;</span>`;

    const removeTagBtn = tag.querySelector('.remove-tag');
    removeTagBtn.addEventListener('click', () => tag.remove());

    tagContainer.insertBefore(tag, input);
}

function removeLastTag() {
    const tags = tagContainer.querySelectorAll('.tag');
    if (tags.length > 0) {
        tags[tags.length - 1].remove();
    }
}

async function videoDataValidation() {
    const title = document.getElementById('videotitle').value;
    const description = document.getElementById('videodiscription').value;
    const banner = document.getElementById('videobanner');
    const tags = document.querySelectorAll('.tag');

    let arrTags = [];
    tags.forEach(p => arrTags.push(p.textContent));

    addUserData('title', title);
    addUserData('discription', description);
    addUserData('tags', arrTags);

    if (!title) {
        showError('Fill in the title of the video.');
        return false;
    } else if (!description) {
        showError('Fill in the description of the video.');
        return false;
    } else if (!banner.files.length) {
        showError('Fill in the banner of the video.');
        return false;
    }

    // Загрузка баннера
    const formData = new FormData();
    formData.append('banner', banner.files[0]);

    try {
        const bannerResponse = await fetch('http://localhost:7070/upload-banner', {
            method: 'POST',
            body: formData,
        });

        if (!bannerResponse.ok) {
            throw new Error('Failed to upload banner');
        }

        const bannerData = await bannerResponse.json();
        addUserData('banner', bannerData.filename);

        // Формируем `dataUser`
        const dataUser = {
            title: userData['title'],
            discription: userData['discription'],
            banner: userData['banner'],
            filename: userData['filename'],
            uploaded_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            video_seconds: userData['video_seconds'] || 0,
        };

        const tags = userData['tags'];

        const videoResponse = await fetch('http://localhost:7070/upload-data-video', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUser, tags }),
        });

        if (!videoResponse.ok) {
            throw new Error('Failed to upload video data');
        }

        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred while uploading the data.');
    }
}