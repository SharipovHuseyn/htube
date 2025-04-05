async function getComments() {
    const commentsBlock = document.querySelector('.commentsBlock');
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!videoID) {
        console.error("Ошибка: videoID отсутствует!");
        return;
    }

    try {
        const response = await fetch(`/get-comments?query=${videoID}`);

        if (!response.ok) {
            console.error('Ошибка при получении комментариев');
            return;
        }

        const data = await response.json();
        data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (data.comments.length === 0) {
            commentsBlock.innerHTML += '<p class="showDataEmpty">No comments!</p>';
        }

        data.comments.forEach(item => {
            const commentBlock = document.createElement("div");
            commentBlock.classList.add("commentBlock");
            commentBlock.id = item.id;

            commentBlock.innerHTML = `
                <div class="aboutTheAuthorComment">
                    <div>
                        <img class="сhannelAvatar" src="uploads/avatars/${item.avatarImage}" alt="${item.slug}">
                    </div>
                    <div>
                        <div class="commentHead">
                            <div class="сhannelData">
                                <h5 class="сhannelName">${item.slug}</h5>
                            </div>
                            <p class="timeTheCommentPublished">${timeAgo(item.created_at)}</p>
                        </div>
                        <div class="textCommentBlock">
                            <p class="textComment">${escapeHTML(item.content)}</p> 
                        </div>
                    </div>
                </div>
                <div class="editorCommentBtn">
                    <button class="answerCommentBtn" onclick="showSubcommentInput(${item.id})">Reply</button>
                     <button class="like-commentBtn" id="reactionLike" onclick="toggleReaction(${item.id}, 'like')">                   
                        <img class="like-comment" src="../components/icons/off-like.png" alt='like'>
                    </button>
                        <p class="likeCount"></p>
                    <button class="like-commentBtn" id="reactionDislike" onclick="toggleReaction(${item.id}, 'dislike')">
                        <img class="like-comment" src="../components/icons/off-dislike.png" alt='dislike'>
                    </button>
                </div>
                <div class="addCommentBlock addSubcommentBlock none">
                    <div>
                        <input class="inputComment inputSubcomment" type="text" placeholder="Enter comment:">
                    </div>
                    <div>
                        <button class="addCommentBtn" onclick="addSubcomment(${item.id})">Comment</button>
                    </div>
                </div>
               <div class="answersBlock ${item.replies_count > 0 ? "" : "none"}">
                    <button class="answersBtn" onclick="loadSubcomments(${item.id})">
                        <img class="subcommnetImage" src="../components/icons/icons8-развернуть-50.png">
                        Answers <p class="answersCount">${item.replies_count}</p>
                    </button>
                </div>
            `;

            if (item.user_id == data.userID) {
                const editorCommentBtn = commentBlock.querySelector(".editorCommentBtn");
                editorCommentBtn.innerHTML += `
                    <button class="saveCommentBtn" onclick="saveComment(${item.id})">Save</button>
                    <button class="deleteCommentBtn" onclick="deleteComment(${item.id})">Delete</button>
                `;

                commentBlock.querySelector('.textComment')
                    .addEventListener("click", () => commentTextToInput(item.id));
            }

            commentsBlock.appendChild(commentBlock);
        });

    } catch (err) {
        console.error("Ошибка при загрузке комментариев:", err);
    }
}

async function addComment() {
    const inputComment = document.getElementById('inputComment').value.trim();
    if (inputComment !== '') {
        const comment = await uploadComment(inputComment);
    }
}

async function addSubcomment(commentID) {
    const commentBlock = document.getElementById(commentID);
    if (!commentBlock) {
        console.error("Комментарий не найден!");
        return;
    }

    const inputField = commentBlock.querySelector(".inputSubcomment");
    if (!inputField) {
        console.error("Поле ввода подкомментария не найдено!");
        return;
    }

    const commentText = inputField.value.trim();
    if (!commentText) {
        console.error("Текст подкомментария не может быть пустым!");
        return;
    }

    try {
        await uploadSubcomment(commentText, commentID);
        inputField.value = "";

        const subcommentBlock = commentBlock.querySelector(".addSubcommentBlock");
        if (subcommentBlock) {
            subcommentBlock.classList.add("none");
        }

        // Обновляем количество подкомментариев
        const answersCount = commentBlock.querySelector(".answersCount");
        if (answersCount) {
            const currentCount = parseInt(answersCount.textContent) || 0;
            answersCount.textContent = currentCount + 1;
        }

        // Загружаем подкомментарии
        await loadSubcomments(commentID);

    } catch (err) {
        console.error("Ошибка при добавлении подкомментария:", err);
    }
}

async function uploadComment(comment) {
    const inputComment = document.getElementById('inputComment');
    const commentsBlock = document.querySelector('.commentsBlock');
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    const response = await fetch('/add-comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoID, comment })
    });

    if (!response.ok) {
        const errorMessage = await response.json();
        console.error("Ошибка при добавлении комментария:", errorMessage.message || response.statusText);
        return;
    }

    const data = await response.json();

    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
    }

    inputComment.value = "";

    const newCommentHTML = createCommentHTML(data.comment);
    commentsBlock.insertAdjacentHTML('afterbegin', newCommentHTML);

    if (commentsBlock.querySelector('.showDataEmpty')) {
        commentsBlock.querySelector('.showDataEmpty').classList.add('none');
    }

    return data.comment;
}

function createCommentHTML(comment) {
    return `
        <div class="commentBlock" id="${comment.id}">
            <div class="aboutTheAuthorComment">
                <div>
                    <img class="сhannelAvatar" src="uploads/avatars/${comment.avatarImage}" alt="${comment.slug}">
                </div>
                <div>
                    <div class="commentHead">
                        <div class="сhannelData">
                            <h5 class="сhannelName">${comment.slug}</h5>
                        </div>
                        <p class="timeTheCommentPublished">${timeAgo(comment.created_at)}</p>
                    </div>
                    <div class="textCommentBlock">
                        <p class="textComment">${escapeHTML(comment.content)}</p>
                    </div>
                </div>
            </div>
            <div class="editorCommentBtn">
                <button class="answerCommentBtn" onclick="showSubcommentInput(${comment.id})">Reply</button>
                <button class="like-commentBtn" id="reactionLike" onclick="toggleReaction(${comment.id}, 'like')">
                    <img class="like-comment" src="../components/icons/off-like.png" alt='like'>
                </button>
                <p class="likeCount"></p>
                <button class="like-commentBtn" id="reactionDislike" onclick="toggleReaction(${comment.id}, 'dislike')">
                    <img class="like-comment" src="../components/icons/off-dislike.png" alt='dislike'>
                </button>
                <button class="saveCommentBtn" onclick="saveComment(${comment.id})">Save</button>
                <button class="deleteCommentBtn" onclick="deleteComment(${comment.id})">Delete</button>
            </div>
            <div class="addCommentBlock addSubcommentBlock none">
                <div>
                    <input class="inputComment inputSubcomment" type="text" placeholder="Enter comment:">
                </div>
                <div>
                    <button class="addCommentBtn" onclick="addSubcomment(${comment.id})">Comment</button>
                </div>
            </div>
            <div class="answersBlock ${comment.replies_count > 0 ? "" : "none"}">
                <button class="answersBtn" onclick="loadSubcomments(${comment.id})">
                    <img class="subcommnetImage" src="../components/icons/icons8-развернуть-50.png">
                    <span class="answersText">Answers</span>
                    <span class="answersCount">${comment.replies_count}</span>
                </button>
                <div class="subcommentsContainer none"></div>
            </div>
        </div>
    `;
}

let originalText = '';

function commentTextToInput(commentID) {
    const comment = document.getElementById(commentID);
    const textComment = comment.querySelector('.textComment');
    
    const existingInput = textComment.querySelector('input');
    
    if (existingInput) {
        return;
    }

    const currentText = textComment.textContent || textComment.innerText;
    
    originalText = currentText;

    const inputElement = document.createElement('input');
    inputElement.classList.add('commnetEditInput')
    inputElement.type = 'text';
    inputElement.value = currentText;

    textComment.innerHTML = '';
    textComment.appendChild(inputElement);
}

async function saveComment(commentID) {
    const comment = document.getElementById(commentID);
    const textComment = comment.querySelector('.textComment');
    const inputElement = textComment.querySelector('input');
    
    if (inputElement) {
        const updatedText = inputElement.value;

        if (updatedText === originalText) {
            textComment.innerHTML = '';
            textComment.textContent = originalText;
            return;
        }

        await editComment(commentID, updatedText);
    }
}

async function editComment(commentID, updatedText) {
    try {
        const response = await fetch('/edit-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                commentID: commentID,
                updatedText: updatedText
            })
        });

        if (!response.ok) {
            console.error('Ошибка при сохранении комментария');
            return;
        }

        const data = await response.json()

        if (data.commentEdit === true) {
            const comment = document.getElementById(commentID);
            const textComment = comment.querySelector('.textComment');
            const inputElement = textComment.querySelector('input');
            
            if (inputElement) {
                textComment.innerHTML = '';
                textComment.textContent = updatedText;
            }
        }

        const comment = document.getElementById(commentID);
        const textComment = comment.querySelector('.textComment');
        textComment.innerHTML = updatedText;
    } catch (err) {
        console.error('Ошибка при отправке запроса:', err);
    }
}

function showSubcommentInput(commentID) {
    const commentBlock = document.getElementById(commentID);
    if (!commentBlock) {
        console.error("Комментарий не найден!");
        return;
    }

    const subcommentBlock = commentBlock.querySelector(".addSubcommentBlock");
    
    if (subcommentBlock) {
        subcommentBlock.classList.toggle("none");

        if (!subcommentBlock.classList.contains("none")) {
            const inputField = subcommentBlock.querySelector(".inputSubcomment");
            if (inputField) inputField.focus();
        }
    }
}

///////////////////
async function loadSubcomments(commentID) {
    if (!commentID) {
        console.error("Not found commentID");
        return;
    }

    try {
        const response = await fetch(`/get-subcomment?commentID=${commentID}`);
        if (!response.ok) {
            console.error(`Ошибка при получении подкомментариев: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log("Ответ сервера:", data);

        const commentBlock = document.getElementById(commentID);
        if (!commentBlock) {
            console.error("Комментарий не найден в DOM");
            return;
        }

        let answersBlock = commentBlock.querySelector(".answersBlock");
        if (!answersBlock) {
            answersBlock = document.createElement("div");
            answersBlock.classList.add("answersBlock");
            commentBlock.appendChild(answersBlock);
        }

        let subcommentsContainer = answersBlock.querySelector(".subcommentsContainer");
        if (!subcommentsContainer) {
            subcommentsContainer = document.createElement("div");
            subcommentsContainer.classList.add("subcommentsContainer");
            answersBlock.appendChild(subcommentsContainer);
        } else {
            subcommentsContainer.innerHTML = "";
        }

        if (!data.subcomments || data.subcomments.length === 0) {
            console.log("Нет подкомментариев");
            return;
        }

        data.subcomments.forEach(comment => {
            const subComment = document.createElement("div");
            subComment.classList.add("commentBlock");
            subComment.id = comment.id;
            subComment.innerHTML = `
                <div class="aboutTheAuthorComment">
                    <div>
                        <img class="сhannelAvatar" src="uploads/avatars/${comment.avatarImage}" alt="${comment.slug}">
                    </div>
                    <div>
                        <div class="commentHead">
                            <div class="сhannelData">
                                <h5 class="сhannelName">${comment.slug}</h5>
                            </div>
                            <p class="timeTheCommentPublished">${timeAgo(comment.created_at)}</p>
                        </div>
                        <div class="textCommentBlock">
                            <p class="textComment">${escapeHTML(comment.content)}</p>
                        </div>
                    </div>
                </div>
                <div class="editorCommentBtn">
                    <button class="answerCommentBtn" onclick="showSubcommentInput(${comment.id})">Reply</button>
                    <button class="like-commentBtn" onclick="toggleReaction(${comment.id}, 'like')">
                        <img class="like-comment" src="../components/icons/off-like.png" alt="like">
                    </button>
                    <p class="likeCount"></p>
                    <button class="like-commentBtn" onclick="toggleReaction(${comment.id}, 'dislike')">
                        <img class="like-comment" src="../components/icons/off-dislike.png" alt="dislike">
                    </button>
                </div>
            `;

            if (comment.user_id == data.userID) {
                const editorCommentBtn = subComment.querySelector(".editorCommentBtn");
                editorCommentBtn.innerHTML += `
                    <button class="saveCommentBtn" onclick="saveComment(${comment.id})">Save</button>
                    <button class="deleteCommentBtn" onclick="deleteComment(${comment.id})">Delete</button>
                `;

                subComment.querySelector(".textComment").addEventListener("click", () => commentTextToInput(comment.id));
            }

            subcommentsContainer.appendChild(subComment);
        });
        
        // Загружаем лайки подкомментариев
        getSubcommentLikes(commentID);

        let answersBtn = answersBlock.querySelector(".answersBtn");
        if (!answersBtn) {
            answersBtn = document.createElement("button");
            answersBtn.classList.add("answersBtn");
            answersBlock.appendChild(answersBtn);
        }
        answersBtn.innerHTML = `<img class="subcommnetImage" src="../components/icons/icons8-свернуть-50.png"> Hide`;
        answersBtn.onclick = () => {
            subcommentsContainer.classList.toggle("hidden");
            answersBtn.innerHTML = subcommentsContainer.classList.contains("hidden")
                ? `<img class="subcommnetImage" src="../components/icons/icons8-развернуть-50.png"> Answers ${data.subcomments.length}`
                : `<img class="subcommnetImage" src="../components/icons/icons8-свернуть-50.png"> Hide`;
        };

    } catch (err) {
        console.error("Ошибка загрузки подкомментариев:", err);
    }
}

function toggleSubcommentsDisplay(container, button, count) {
    container.classList.toggle("hidden");
    button.innerHTML = container.classList.contains("hidden")
        ? `<img class="subcommnetImage" src="../components/icons/icons8-развернуть-50.png"> Answers (${count})`
        : `<img class="subcommnetImage" src="../components/icons/icons8-свернуть-50.png"> Hide (${count})`;
}

async function uploadSubcomment(comment, commentID) {
    const params = new URLSearchParams(window.location.search);
    const videoID = params.get("query");

    if (!comment || !commentID || !videoID) {
        console.warn("Не найден: comment or commentID or videoID");
        return;
    }

    try {
        const response = await fetch('/add-subcomment', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment, commentID, videoID })
        });

        if (!response.ok) {
            console.error("Ошибка при отправке подкомментария");
            return;
        }

        const data = await response.json();
        console.log("Ответ сервера:", data);

        const commentBlock = document.getElementById(commentID);
        if (!commentBlock) {
            console.error("Комментарий не найден!");
            return;
        }

        let answersBlock = commentBlock.querySelector(".answersBlock");
        if (!answersBlock) {
            answersBlock = document.createElement("div");
            answersBlock.classList.add("answersBlock");
            commentBlock.appendChild(answersBlock);
        }

        let subcommentsContainer = answersBlock.querySelector(".subcommentsContainer");
        if (!subcommentsContainer) {
            subcommentsContainer = document.createElement("div");
            subcommentsContainer.classList.add("subcommentsContainer");
            answersBlock.appendChild(subcommentsContainer);
        }

        subcommentsContainer.insertAdjacentHTML("afterbegin", createCommentHTML(data.subcomment));

        let answersBtn = answersBlock.querySelector(".answersBtn");
        if (!answersBtn) {
            answersBtn = document.createElement("button");
            answersBtn.classList.add("answersBtn");
            answersBlock.appendChild(answersBtn);
        }

        let count = subcommentsContainer.children.length;
        answersBtn.innerHTML = `<img class="subcommnetImage" src="../components/icons/icons8-свернуть-50.png"> Hide (${count})`;
        answersBtn.onclick = () => toggleSubcommentsDisplay(subcommentsContainer, answersBtn, count);

    } catch (err) {
        console.error("Ошибка при добавлении подкомментария:", err);
    }
}

async function deleteComment(commentID) {
    if (!commentID) {
        console.error("commentID not found!");
        return false;
    }

    try {
        const response = await fetch('/delete-comment', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentID })
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            console.error("Ошибка при удалении:", errorMessage.message || response.statusText);
            return;
        }

        const comment = document.getElementById(commentID);
        if (comment) {
            const parentComment = comment.closest(".commentBlock");
            comment.remove();

            if (parentComment) {
                let answersBlock = parentComment.querySelector(".answersBlock");
                let subcommentsContainer = parentComment.querySelector(".subcommentsContainer");

                if (answersBlock && subcommentsContainer) {
                    let answersBtn = answersBlock.querySelector(".answersBtn");
                    let count = subcommentsContainer.children.length;
                    if (answersBtn) {
                        answersBtn.innerHTML = `<img class="subcommnetImage" src="../components/icons/icons8-свернуть-50.png"> Hide (${count})`;
                        if (count === 0) {
                            answersBtn.innerHTML = `<img class="subcommnetImage" src="../components/icons/icons8-развернуть-50.png"> Answers (0)`;
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error("Ошибка при удалении комментария:", err);
    }
}