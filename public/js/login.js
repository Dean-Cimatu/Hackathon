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
    
    // An object to hold the registration data (include confirmPassword so server can re-validate)
    const registerData = {
        name: regName,
        password: regPass,
        confirmPassword: confirmPass,
        email: regEmail,
    }
    
    // Checking if the name is valid by seeing if its between 3-20 characters long
    if(regName.length >= 3 && regName.length <= 20) {
        nameCheck = true;
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
        // Send registration data to the server
        fetch('/M01028229/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.registered) {
                alert("Account created successfully!");
                // Clear inputs
                document.getElementById("regName").value = "";
                document.getElementById("regEmail").value = "";
                document.getElementById("regPass").value = "";
                document.getElementById("confirmPass").value = "";
                // Switch to login section
                showLogin();
            } else {
                alert(data.message || "Registration failed!");
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("An error occurred during registration. Please try again.");
        });
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

    // Create login data object
    const loginData = {
        email: loginEmail,
        password: loginPass
    };

    // Send login request to the server
    fetch('/M01028229/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.login) {
            alert("Login successful!");
            // Clear inputs
            document.getElementById("loginEmail").value = "";
            document.getElementById("loginPass").value = "";
            // Redirect to the main page after successful login
            setTimeout(() => {window.location.href = "index.html"}, 1000);
        } else {
            alert(data.message || "Login failed!");
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert("An error occurred during login. Please try again.");
    });
}