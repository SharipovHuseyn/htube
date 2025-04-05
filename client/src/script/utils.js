function createMessageElement(type) {
    let messageField = document.querySelector('.messageField');
    if (!messageField) {
        messageField = document.createElement('div');
        messageField.classList.add('messageField');
        document.body.prepend(messageField);     
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(`${type}-message`, 'message');
    
    const img = document.createElement('img');
    img.classList.add(`${type}-image`);
    img.src = `/components/icons/icons8-${type}-100.png`;
    img.alt = type;
    
    const textSpan = document.createElement('span');
    textSpan.classList.add(`${type}-text`);
    
    messageDiv.appendChild(img);
    messageDiv.appendChild(textSpan);
    messageField.appendChild(messageDiv);
    
    return { messageDiv, textSpan };
}

function showMessage(type, message) {
    let container = document.querySelector(`.${type}-message`);
    let textSpan;
    
    if (!container) {
        ({ messageDiv: container, textSpan } = createMessageElement(type));
    } else {
        textSpan = container.querySelector(`.${type}-text`);
    }

    textSpan.textContent = message;
    container.classList.remove('show');
    
    setTimeout(() => {
        container.classList.add('show');
    }, 10);

    setTimeout(() => {
        container.classList.remove('show');
    }, 3000);
}

function showError(message) {
    showMessage('error', message);
}

function showSuccess(message) {
    showMessage('success', message);
}

function escapeHTML(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function timeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    
    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
        return `${years} year${years === 1 ? '' : 's'} ago`;
    } else if (months > 0) {
        return `${months} month${months === 1 ? '' : 's'} ago`;
    } else if (days > 0) {
        return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
        return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
    }
}

function formatSubscribers(subscribeCount) {
    if (subscribeCount >= 1_000_000) {
        return (subscribeCount / 1_000_000).toFixed(1) + " млн subscribers";
    } else if (subscribeCount >= 1_000) {
        return (subscribeCount / 1_000).toFixed(1) + " тыс. subscribers";
    } else {
        return subscribeCount + " subscribers";
    }
}

function formatLikes(count) {
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1) + " млн";
    } else if (count >= 1_000) {
        return (count / 1_000).toFixed(1) + " тыс.";
    } else {
        return count;
    }
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach((stepDiv) => {
        stepDiv.classList.remove('activepage');
    });
    document.getElementById(`step${step}`).classList.add('activepage');
    showSuccess('Succsess')
}


function hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

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

function addUserData(key, value) {
    userData[key] = value;
    console.log(userData)
}

const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function linkToVideo(link){
    window.location.href = '/watch?query=' + link;
}