// Depositphotos Authentication Check with robust validation

(function() {
    try {
        console.log("Checking authentication status...");
        
        // Check for login form elements indicating not authenticated
        const loginForm = document.querySelector('.auth_login-form, .login-form, form[action*="login"]');
        const passwordField = document.querySelector('input[type="password"][name*="pass"], input[type="password"]');
        const loginButtons = document.querySelectorAll('button[type="submit"], .login-btn, .signin-btn');
        let loginButton = null;
        for (var btnIdx = 0; btnIdx < loginButtons.length; btnIdx++) {
            const btnText = loginButtons[btnIdx].textContent || '';
            if (btnText.match(/login|sign\s*in/i)) {
                loginButton = loginButtons[btnIdx];
                break;
            }
        }
        
        // Check if user is not authenticated
        if (loginForm || (passwordField && loginButton)) {
            console.log("User not authenticated - marking assets as unauthorized");
            for (var i = 0; i < assets.length; i++) {
                assets[i].markUnauthorized();
            }
            return;
        }
        
        // Check for explicit unauthorized/forbidden messages
        const errorMessages = document.querySelectorAll('.error-message, .alert-error, .unauthorized-message');
        for (var j = 0; j < errorMessages.length; j++) {
            const errorText = errorMessages[j].textContent || '';
            if (errorText.match(/unauthorized|forbidden|access denied|please log in/i)) {
                console.log("Unauthorized message detected");
                for (var k = 0; k < assets.length; k++) {
                    assets[k].markUnauthorized();
                }
                return;
            }
        }
        
        // Check if we're on the wrong page
        if (window.location.href.indexOf('files/unfinished') < 0) {
            console.log("Not on unfinished files page, redirecting...");
            
            // Check if destination exists
            const targetUrl = 'https://depositphotos.com/files/unfinished/page1.html';
            window.location.href = targetUrl;
            return;
        }
        
        // Check for page load errors
        const pageNotFound = document.querySelector('.error-404, .page-not-found, .not-found');
        if (pageNotFound) {
            console.error("Target page not found (404)");
            for (var m = 0; m < assets.length; m++) {
                assets[m].markNotFound();
            }
            return;
        }
        
        // User is authenticated and on correct page
        console.log("Authentication successful - user is logged in");
        for (var n = 0; n < assets.length; n++) {
            assets[n].markDone();
        }
        
    } catch (error) {
        console.error("Error during authentication check:", error);
        // On error, mark as failed to be safe
        for (var p = 0; p < assets.length; p++) {
            assets[p].markFailed('Authentication check failed: ' + error.message);
        }
    }
})();