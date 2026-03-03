// Regex patterns for password and email validation
const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
const emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

// Function to switch to registration section
function showSignup() {
    document.querySelector('.signup').classList.remove('hidden');
    document.querySelector('.login').classList.add('hidden');
}

// Function to switch to login section
function showLogin() {
    document.querySelector('.login').classList.remove('hidden');
    document.querySelector('.signup').classList.add('hidden');
}

// Function to register a new user
function registerUser() { 
    // Variables to check if the inputs are valid
    let nameCheck = false;
    let passwordCheck = false;
    let emailCheck = false;
    let confirmPasswordCheck = false;

    // Get the values from the inputs
    const regName = document.getElementById("regName").value;
    const regEmail = document.getElementById("regEmail").value;
    const regPass = document.getElementById("regPass").value;
    const confirmPass = document.getElementById("confirmPass").value;
    
    // An object to hold the registration data
    const registerData = {
        name: regName,
        password: regPass,
        email: regEmail,
    }
    
    // Checking if the name is valid by seeing if its between 3-20 characters long and seeing if its already in local storage
    if(regName.length >= 3 && regName.length <= 20) {
        if (localStorage.getItem(regName) !== null){ 
            alert("Name already taken!");
            nameCheck = false;
        }
        else {
            nameCheck = true;
        }
    } else {
        alert("Name must be 3-20 characters long");
    }

    // Checking if the password is valid with the regex above
    if(strongRegex.test(regPass)) {
        passwordCheck = true;
    } else {
        alert("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
    }

    // Checking if the email is valid with the regex above
    if(emailRegex.test(regEmail)) {
        emailCheck = true;
    } else {
        alert("Invalid email address!");
    }

    // Checking if passwords match
    if(regPass === confirmPass && regPass.length > 0) {
        confirmPasswordCheck = true;
    } else {
        alert("Passwords do not match!");
    }

    // Checking if all inputs are valid
    if (nameCheck && passwordCheck && emailCheck && confirmPasswordCheck) {
        // Converting the users data into JSON and storing it in local storage
        const registerDataStr = JSON.stringify(registerData);
        localStorage[registerData.name] = registerDataStr;
        alert("Account created successfully!");
        // Clear inputs
        document.getElementById("regName").value = "";
        document.getElementById("regEmail").value = "";
        document.getElementById("regPass").value = "";
        document.getElementById("confirmPass").value = "";
        // Switch to login section
        showLogin();
    }
}

// Function to log the user in
function loginUser() {
    // Get the values from the inputs
    const loginEmail = document.getElementById("loginEmail").value;
    const loginPass = document.getElementById("loginPass").value;

    // Check if email field is filled
    if (!loginEmail || !loginPass) {
        alert("Please fill in all fields!");
        return;
    }

    // Search for user by email
    let foundUser = null;
    let foundUserName = null;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const userObj = JSON.parse(localStorage[key]);
        if (userObj.email === loginEmail) {
            foundUser = userObj;
            foundUserName = key;
            break;
        }
    }

    // Checking if the user was found
    if (!foundUser) {
        alert("User not found!");
    } else {
        // Checking if the user typed the correct password
        if (loginPass === foundUser.password) {
            // Setting the current logged in user in session storage then sending the player to the game
            sessionStorage.setItem("loggedInUser", foundUserName);
            alert("Login successful!");
            // Clear inputs
            document.getElementById("loginEmail").value = "";
            document.getElementById("loginPass").value = "";
            setTimeout(() => {window.location.href = "game.html"}, 1000);
        } else {
            alert("Incorrect password!");
        }
    }
}