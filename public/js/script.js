// Main frontend script
// Global initialization logic can live here
console.log('script.js loaded');

window.addEventListener('DOMContentLoaded', () => {
    // if the user is already logged in, send them to the main page
    fetch('/M01028229/login')
        .then(res => res.json())
        .then(data => {
            if (data.login) {
                // change destination if you have another landing page
                window.location.href = 'index.html';
            }
        })
        .catch(err => {
            console.error('Login status check failed', err);
        });
});
