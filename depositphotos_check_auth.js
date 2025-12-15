if (document.querySelector('.auth_login-form') || document.querySelector('input[type="password"]')) {
    for (var i = 0; i < assets.length; i++) assets[i].markUnauthorized();
} else {
    if (window.location.href.indexOf('files/unfinished') < 0) {
        window.location.href = 'https://depositphotos.com/files/unfinished/page1.html';
    }
    for (var k = 0; k < assets.length; k++) assets[k].markDone();
}