const showPassword = document.querySelectorAll('.showPassword')
const register = document.querySelector('.register')
const login = document.querySelector('.login')

let userData = []

function togglePassword(n) {
    const userpassword = document.querySelector('#userpasswordLogin');
    const userNewpassword = document.querySelector('#userNewpassword');
    const userRepeatedpassword = document.querySelector('#userRepeatedpassword');

    const userPass = [userpassword, userNewpassword, userRepeatedpassword]

    if (userPass[n].type === 'password') {
        userPass[n].type = 'text'; // Показываем пароль
        showPassword[n].innerHTML = '<img class="showPasswordImage" src="/components/icons/icons8-eye-100 (1).png" alt="eye">'
    } else {
        userPass[n].type = 'password'; // Скрываем пароль
        showPassword[n].innerHTML = '<img class="showPasswordImage" src="/components/icons/icons8-eye-100.png" alt="eye">'
    }
}

function loginPage() {
    history.pushState({ page: "login" }, "", "?login");
    register.classList.add('none')
    login.classList.remove('none')
    setActiveItem('login');
}

function registrationPage() {
    history.pushState({ page: "register" }, "", "?register");
    login.classList.add('none');
    register.classList.remove('none');
    setActiveItem('register');
}

function setActiveItem(page) {
    const items = document.querySelectorAll('.selectionItem');
    items.forEach(item => {
        item.classList.remove('active');
    });

    if (page === 'login') {
        items[0].classList.add('active');
    } else if (page === 'register') {
        items[1].classList.add('active');
    }
}

function loadPageFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('login')) {
        loginPage();
    } else if (params.has('register')) {
        registrationPage();
    } else {
        loginPage();
    }
}

window.onload = loadPageFromURL;

window.onpopstate = function (event) {
    if (event.state && event.state.page) {
        if (event.state.page === "login") {
            loginPage();
        } else if (event.state.page === "register") {
            registrationPage();
        }
    }
};

let registerWidgetId, loginWidgetId;

function onLoadRecaptcha() {
    registerWidgetId = grecaptcha.render('registerRecaptcha', {
        sitekey: '6Lf3kbQqAAAAACVmzGADMdJ6lDh43Ng3bBOcxssK',
        callback: onReCaptchaSuccessRegister
    });

    loginWidgetId = grecaptcha.render('loginRecaptcha', {
        sitekey: '6Lfer7MqAAAAAKt7pyqt6Wf25eIogvT6HsLjA_cp',
        callback: onReCaptchaSuccessLogin
    });
}

function onReCaptchaSuccessRegister(token) {
    console.log('Register reCAPTCHA token received:', token);
}

function onReCaptchaSuccessLogin(token) {
    console.log('Login reCAPTCHA token received:', token);
}

function previewFile() {
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    const placeholderText = document.getElementById('placeholderText');

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        placeholderText.style.display = 'none';
    };

    if (file) {
        reader.readAsDataURL(file)
    }

}

function validateStep1() {
    const username = document.getElementById('username').value.trim();
    const usersurname = document.getElementById('usersurname').value.trim();
  
    if (username === '' || usersurname === '') {
      showError('Please fill in both name and surname');
      return false;
    }

    addUserData('username', username)
    addUserData('usersurname', usersurname)

    hideError()
    return true
}

const username = document.querySelector('#username');
const usersurname = document.querySelector('#usersurname');
const useremail = document.querySelector('#useremail');
const userNewpassword = document.querySelector('#userNewpassword');
const userRepeatedpassword = document.querySelector('#userRepeatedpassword');
const fileInput = document.querySelector('#fileInput');
const userslug = document.querySelector('#userslug');

function getInputValues() {
  return {
    username: username.value.trim(),
    usersurname: usersurname.value.trim(),
    useremail: useremail ? useremail.value.trim() : '',
    userNewpassword: userNewpassword.value.trim(),
    userRepeatedpassword: userRepeatedpassword.value.trim(),
    fileInput: fileInput.value,
    userslug: userslug.value.trim(),
  };
}

async function validateStep2() {
    const useremail = document.getElementById('useremail').value.trim();
    const userNewpassword = document.getElementById('userNewpassword').value.trim();
    const userRepeatedpassword = document.getElementById('userRepeatedpassword').value.trim();

    if (useremail === '' || userNewpassword === '' || userRepeatedpassword === '') {
        showError('Please fill in all fields on this step.');
        return false;
    }

    if (userNewpassword.length < 7) {
        showError('Password must contain more than 8 characters.');
        return false;
    }

    if (userNewpassword !== userRepeatedpassword) {
        showError('Passwords do not match.');
        return false;
    }

    if (!validateEmailDomain(useremail)) {
        showError('The incorrect mail.');
        return false;
    }

    try {
        console.log('Email being sent:', useremail);
        const response = await fetch('http://localhost:7070/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: useremail }),
        });

        if (!response.ok) {
            throw new Error('Failed to send email to server');
        }

        const data = await response.json();
        console.log(data);

        if (!data.exists) {
            showError('Email does not exist.');
            return false;
        }
    } catch (error) {
        console.error('Error sending email:', error);
        showError('An error occurred while validating email.');
        return false;
    }

    addUserData('email', useremail)
    addUserData('password', userNewpassword)

    hideError();
    goToStep(3);
    return true;
}

function clearCodeInputs() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`code${i}`);
        if (input) {
            input.value = '';
        }
    }
}

function handleKeydown(event, currentInput, nextInputId) {
    if (event.key >= '0' && event.key <= '9') {
        if (nextInputId) {
            const nextInput = document.getElementById(nextInputId);
            if (nextInput) {
                setTimeout(() => nextInput.focus(), 10);
            }
        }
    } else if (event.key === 'Backspace') {
        const prevInput = currentInput.previousElementSibling;
        if (prevInput) {
            setTimeout(() => prevInput.focus(), 10);
        }
    } else {
        event.preventDefault();
    }
}


let countdownInterval;

function startCountdown() {
    const codeTime = document.querySelector('#codeTime');
    let [minutes, seconds] = codeTime.textContent.split(':').map(num => parseInt(num, 10));

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        if (seconds === 0) {
            if (minutes > 0) {
                minutes -= 1;
                seconds = 59;
            } else {
                clearInterval(countdownInterval); // Останавливаем таймер
                showError('Time is up! Returning to the previous step.');
                setTimeout(() => {
                    codeTime.textContent = '05:00';
                    goToStep(2);
                    hideError();
                    clearCodeInputs();
                }, 5000);
                return;
            }
        } else {
            seconds -= 1;
        }

        codeTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}


async function validateCode() {
    const code = [
        document.getElementById('code1').value,
        document.getElementById('code2').value,
        document.getElementById('code3').value,
        document.getElementById('code4').value,
        document.getElementById('code5').value,
        document.getElementById('code6').value
    ].join('');

    if (code.length !== 6) {
        showError('Please enter a valid code.');
        return false;
    }1

    try {
        console.log('Code being sent:', code);

        const response = await fetch('http://localhost:7070/check-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { message: 'Unknown error occurred' };
            }
            console.error(`Error ${response.status}: ${errorData.message}`);
            throw new Error(errorData.message || 'Failed to send code to server');
        }

        const data = await response.json();
        console.log(data);

        if (data.message === 'Verification code has expired.') {
            showError('Verification code has expired. Please request a new one.');
            return false;
        }

        if (!data.exists) {
            showError('Incorrect verification code.');
            return false;
        }

        console.log('Code verified successfully!');
        goToStep(4);
        return true;
    } catch (error) {
        console.error('Error sending code:', error);
        showError(error.message || 'An error occurred while validating the code.');
        return false;
    }
}

async function validateUserData() {
    const userslug = document.getElementById('userslug');
    const fileInput = document.getElementById('fileInput');
    
    if (!userslug.value) {
        showError('Сome up with a nickname for yourself.');
        return false;
    }

    const formData = new FormData();
    addUserData('slug', userslug.value)
    formData.append('avatar', fileInput.files[0]); // Загрузка аватарки

    try {
        const response = await fetch('http://localhost:7070/upload-avatar', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }

        const data = await response.json();
        console.log(data)

        addUserData('avatarImage', data.filename)

        if (data.success) {
            goToStep(5);
        } else {
            showError(data.message || 'Error occurred during upload');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred while uploading the avatar.');
    }
}


async function sendUserData() {
    
    const dataUser = {
        name: userData['username'],
        surname: userData['usersurname'],
        email: userData['email'],
        password: userData['password'],
        avatarImage: userData['avatarImage'],
        slug: userData['slug']
    };

    try {
        const response = await fetch('http://localhost:7070/upload-user-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ dataUser }) // Сериализация в JSON
        });

        if (!response.ok) {
            showError('Failed to upload user data');
            return;
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
            window.location.href = '/';
        } else {
            showError(data.message || 'Error occurred during upload');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred while uploading the user data.');
    }
}

async function validateLoginData(){
    const useremailLogin = document.getElementById('useremailLogin').value
    const userpasswordLogin = document.getElementById('userpasswordLogin').value

    if(!useremailLogin || !userpasswordLogin){
        showError('Please fill in all fields on this login.')
        return false;
    }else if(userpasswordLogin.length < 7){
        showError('Password must contain more than 8 characters.');
        return false;
    }else if (!validateEmailDomain(useremailLogin)) {
        showError('The incorrect mail.');
        return false;
    }

    const loginData = {
        email: useremailLogin,
        password: userpasswordLogin,
    }

    try{
        const response = await fetch('http://localhost:7070/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({loginData })
        })

        const data = await response.json();

        if (data.success) {
            window.location.href = '/';
            console.log(data.user)
        }else if(data.status == 401){
            showError(data.message)
            return false 
        } else {
            showError(data.message || 'Error occurred during upload');
            return false 
        }

    }catch (error){
        console.error('Error:', error);
        showError('An error occurred while uploading the user data.');
        return false 
    }

    return true
}

async function handleSubmit(formType) {
    const widgetId = formType === 'register' ? registerWidgetId : loginWidgetId;
    const token = grecaptcha.getResponse(widgetId)

    if (!token) {
        showError('Please complete the reCAPTCHA first!');
        return false;
    }

    try {
        const response = await fetch('/verify-recaptcha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                type: formType,
            }),
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('reCAPTCHA validated successfully!');
            return true;
        } else {
            showError('reCAPTCHA validation failed. Please try again.');
            grecaptcha.reset(widgetId);
            return false;
        }
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        showError('An error occurred while verifying reCAPTCHA.')
        return false;
    }
}