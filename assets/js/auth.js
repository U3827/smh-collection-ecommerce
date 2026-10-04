// =========================================
// SMH COLLECTION
// AUTHENTICATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("SMH Auth JS loaded.");

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // MESSAGE SYSTEM
  // =========================================

  const messageBox =
    document.getElementById("authMessage");

  function showMessage(message, type = "error") {

    if (!messageBox) {
      alert(message);
      return;
    }

    messageBox.textContent = message;

    messageBox.className = "auth-message";

    if (message) {
      messageBox.classList.add(type);
    }
  }


  // =========================================
  // CHECK SUPABASE
  // =========================================

  if (typeof window.supabase === "undefined") {

    console.error(
      "Supabase JavaScript library is missing."
    );

    showMessage(
      "Authentication service could not load. Please refresh the page."
    );

    return;
  }


  if (typeof supabaseClient === "undefined") {

    console.error(
      "supabaseClient is missing."
    );

    showMessage(
      "Supabase connection could not be initialized."
    );

    return;
  }


  console.log("Supabase client ready.");


  // =========================================
  // SIGN UP
  // =========================================

  const signupForm =
    document.getElementById("signupForm");

  const signupButton =
    document.getElementById("signupButton");


  if (signupForm) {

    console.log("Signup form found.");


    signupForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        console.log("Signup form submitted.");

        showMessage("");


        const fullName =
          document
            .getElementById("fullName")
            .value
            .trim();


        const email =
          document
            .getElementById("signupEmail")
            .value
            .trim()
            .toLowerCase();


        const password =
          document
            .getElementById("signupPassword")
            .value;


        const confirmPassword =
          document
            .getElementById("confirmPassword")
            .value;


        // =====================================
        // VALIDATION
        // =====================================

        if (!fullName) {

          showMessage(
            "Please enter your full name."
          );

          return;
        }


        if (!email) {

          showMessage(
            "Please enter your email address."
          );

          return;
        }


        if (password.length < 8) {

          showMessage(
            "Your password must contain at least 8 characters."
          );

          return;
        }


        if (password !== confirmPassword) {

          showMessage(
            "Passwords do not match."
          );

          return;
        }


        // =====================================
        // START SIGNUP
        // =====================================

        signupButton.disabled = true;

        signupButton.textContent =
          "Creating account...";


        try {

          console.log(
            "Sending signup request to Supabase..."
          );


          const {
            data,
            error
          } =
            await supabaseClient.auth.signUp({

              email: email,

              password: password,

              options: {

                data: {
                  full_name: fullName
                }

              }

            });


          console.log(
            "Supabase signup response:",
            data,
            error
          );


          if (error) {
            throw error;
          }


          if (!data.user) {

            throw new Error(
              "Supabase did not return a user."
            );

          }


          showMessage(
            "Account created successfully.",
            "success"
          );


          signupForm.reset();


          console.log(
            "User created:",
            data.user.id
          );


          // ===================================
          // REDIRECT TEMPORARILY
          // ===================================

          setTimeout(() => {

            window.location.href =
              "login.html";

          }, 1200);


        } catch (error) {

          console.error(
            "Signup error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to create your account."
          );


        } finally {

          signupButton.disabled = false;

          signupButton.textContent =
            "Create Account";

        }

      }
    );

  } else {

    console.error(
      "Signup form was not found."
    );

  }


  // =========================================
  // GOOGLE SIGN UP
  // =========================================

  const googleSignUp =
    document.getElementById("googleSignUp");


  if (googleSignUp) {

    googleSignUp.addEventListener(
      "click",
      async () => {

        try {

          googleSignUp.disabled = true;

          googleSignUp.innerHTML =
            "<span>Connecting...</span>";


          const {
            error
          } =
            await supabaseClient.auth
              .signInWithOAuth({

                provider: "google",

                options: {

                  redirectTo:
                    `${window.location.origin}/login.html`

                }

              });


          if (error) {
            throw error;
          }


        } catch (error) {

          console.error(
            "Google authentication error:",
            error
          );


          showMessage(
            error.message ||
            "Google authentication failed."
          );


          googleSignUp.disabled = false;

          googleSignUp.innerHTML = `
            <span
              class="google-icon"
              aria-hidden="true"
            >
              G
            </span>

            <span>
              Continue with Google
            </span>
          `;

        }

      }
    );

  }

});