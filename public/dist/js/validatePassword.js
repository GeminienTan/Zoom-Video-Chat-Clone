
var password = document.getElementById("password");
var confirm_password = document.getElementById("confirm_password");
var letter = document.getElementById("letter");
var capital = document.getElementById("capital");
var number = document.getElementById("number");
var length = document.getElementById("length");

  
// When the user clicks on the password field, show the message box
password.onfocus = function() {
  document.getElementById("validatePwd").style.display = "block";
}

// When the user clicks outside of the password field, hide the message box
password.onblur = function() {
  document.getElementById("validatePwd").style.display = "none";
}

// When the user starts to type something inside the password field
password.onkeyup = function() {
  // Validate lowercase letters
  var lowerCaseLetters = /[a-z]/g;
  if(password.value.match(lowerCaseLetters)) {  
    letter.classList.remove("invalid");
    letter.classList.add("valid");
  } else {
    letter.classList.remove("valid");
    letter.classList.add("invalid");
  }
  
  // Validate capital letters
  var upperCaseLetters = /[A-Z]/g;
  if(password.value.match(upperCaseLetters)) {  
    capital.classList.remove("invalid");
    capital.classList.add("valid");
  } else {
    capital.classList.remove("valid");
    capital.classList.add("invalid");
  }

  // Validate numbers
  var numbers = /[0-9]/g;
  if(password.value.match(numbers)) {  
    number.classList.remove("invalid");
    number.classList.add("valid");
  } else {
    number.classList.remove("valid");
    number.classList.add("invalid");
  }
  
  // Validate length
  if(password.value.length >= 8) {
    length.classList.remove("invalid");
    length.classList.add("valid");
  } else {
    length.classList.remove("valid");
    length.classList.add("invalid");
  }
}
confirm_password.onkeyup = function() {
    document.getElementById("confirmPwd").style.display = "block";

    if ($('#password').val() == $('#confirm_password').val()) {
      $('#confirmPwd').html('Matching').css('color', 'green');
    } else 

      $('#confirmPwd').html('Not Matching').css('color', 'red');
  };

