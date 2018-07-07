function togglee(n) {
    if (n == 1) {
        document.querySelector('.register-form').style.display = "none"
        document.querySelector('.login-form').style.display = "block";
    } else {
        document.querySelector('.register-form').style.display = "block"
        document.querySelector('.login-form').style.display = "none";
    }
}