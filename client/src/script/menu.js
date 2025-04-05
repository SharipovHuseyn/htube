async function foundUser() {
    const connectingBlock = document.querySelector('.connectingBlock');
    if (!connectingBlock) {
        console.error("Элемент #connectingBlock не найден!");
        return;
    }

    try {
        const response = await fetch('/get-user');
        if (!response.ok) throw new Error('Ошибка при запросе!');

        const data = await response.json();
        let menuHtml = "";

        if (data.success === true) {
            menuHtml = await fetch('../part/menuOnReg.ejs').then(res => res.text());
        } else {
            menuHtml = await fetch('../part/menuOffReg.ejs').then(res => res.text());
        }

        connectingBlock.insertAdjacentHTML('afterbegin', menuHtml)
        initMenuEvents();

    } catch (error) {
        console.error(error.message);
    }
}

function initMenuEvents() {
    const burgerBtn = document.querySelector('.burgerBtn');
    const headLogo = document.querySelector('.headLogo');
    const links = document.querySelectorAll('.link');
    const subtitle = document.querySelector('.subtitle');
    const menu = document.querySelector('.menu');

    if (burgerBtn) {
        let isMenuOpen = false;
        burgerBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            links.forEach(link => link.classList.toggle('none', isMenuOpen));
            headLogo?.classList.toggle('none', isMenuOpen);
            menu?.classList.toggle('remoteMenu', isMenuOpen);
            subtitle?.classList.toggle('none', isMenuOpen);
        });
    } else {
        console.error("Элемент .burgerBtn не найден!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    foundUser();
});