const regBtn = document.getElementById('regBtn');
const userAvatar = document.getElementById('userAvatar');
const avatarImagex = document.querySelector('.avatarImage');

async function examinationAuthentication() {
    try {
        const response = await fetch("/get-user-data", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Ошибка при запросе:', response.statusText);
        }

        const data = await response.json();

        if (data && data.user) {
            console.log('Данные пользователя найдены:', data.user);

            if (data.user.avatarImage && userAvatar) {
                userAvatar.classList.remove('none');
                regBtn.classList.add('none');
                avatarImagex.src = `/uploads/avatars/${data.user.avatarImage}`
                avatarImagex.alt = data.user.name
            }
        } else {
            console.log('Данные пользователя не найдены.');
            regBtn.classList.remove('none')
        }
    } catch (err) {
        console.error('Ошибка:', err);
    }
}

examinationAuthentication()