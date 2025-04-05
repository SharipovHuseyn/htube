let username = document.getElementById('username')
let useremail = document.getElementById('useremail')
let userpassword = document.getElementById('userpassword')
let userslug = document.getElementById('userslug')
let userdiscription = document.getElementById('userdiscription')

function validateEmailDomain(email) {
    const allowedDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'mail.ru',
        'yandex.ru',
        'icloud.com',
    ];

    const domain = email.split('@')[1];
    if (!domain || !allowedDomains.includes(domain.toLowerCase())) {
        console.error('Invalid email domain');
        return false;
    }

    return true;
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

document.getElementById('bannerUploud').addEventListener('change', function(event) {
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


const showPassword = document.querySelectorAll('.showPassword')

function togglePassword() {
    const userpassword = document.getElementById('userpassword');


    if (userpassword.type === 'password') {
        userpassword.type = 'text'; // Показываем пароль
        showPassword.innerHTML = '<img class="showPasswordImage" src="/components/icons/icons8-eye-100 (1).png" alt="eye">'
    } else {
        userpassword.type = 'password'; // Скрываем пароль
        showPassword.innerHTML = '<img class="showPasswordImage" src="/components/icons/icons8-eye-100.png" alt="eye">'
    }
}

async function settingSendData(){
    const response = await fetch('/settings-get-user-data', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if(!response.ok){
        showError('Error when finding data')
    }

    const data = await response.json()
    if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
    }

    try{
        username.value = data.userData[0].name
        useremail.value = data.userData[0].email
        userslug.value = data.userData[0].slug
        userdiscription.value = data.userData.discription               
    }catch(err){
        console.error('Error: ', err)
    }
}

settingSendData()
