// =========================================
// SMH COLLECTION
// REAL SUPABASE AUTHENTICATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // COMMON ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  const messageBox =
    document.getElementById("authMessage");


  // =========================================
  // CURRENT YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // MESSAGE HANDLER
  // =========================================

  function showMessage(message, type = "error") {

    if (!messageBox) {
      return;
    }

    messageBox.textContent = message;

    messageBox.className =
      "auth-message";

    if (message) {
      messageBox.classList.add(type);
    }

  }


  // =========================================
  // CHECK SUPABASE
  // =========================================

  if (
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase client is not available."
    );

    showMessage(
      "Authentication service is currently unavailable. Please try again later."
    );

    return;
  }


  // =========================================
  // SIGN UP
  // =========================================

  const signupForm =
    document.getElementById("signupForm");

  const signupButton =
    document.getElementById("signupButton");


  if (signupForm) {

    signupForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

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


        if (fullName.length < 2) {

          showMessage(
            "Please enter a valid full name."
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
        // LOADING STATE
        // =====================================

        signupButton.disabled = true;

        signupButton.textContent =
          "Creating account...";


        try {

          // ===================================
          // CREATE SUPABASE ACCOUNT
          // ===================================

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
                },

                emailRedirectTo:
                  `${window.location.origin}/account.html`

              }

            });


          if (error) {
            throw error;
          }


          // ===================================
          // SUCCESS
          // ===================================

          if (
            data.user &&
            !data.session
          ) {

            showMessage(
              "Account created successfully. Please check your email to confirm your account.",
              "success"
            );

            signupForm.reset();

          } else if (
            data.user &&
            data.session
          ) {

            showMessage(
              "Account created successfully. Redirecting...",
              "success"
            );


            setTimeout(() => {

              window.location.href =
                "account.html";

            }, 800);

          } else {

            throw new Error(
              "Your account could not be created. Please try again."
            );

          }

        } catch (error) {

          console.error(
            "Signup error:",
            error
          );


          showMessage(
            getAuthErrorMessage(error)
          );


        } finally {

          signupButton.disabled = false;

          signupButton.textContent =
            "Create Account";

        }

      }
    );

  }


  // =========================================
  // LOGIN
  // =========================================

  const loginForm =
    document.getElementById("loginForm");

  const loginButton =
    document.getElementById("loginButton");


  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        showMessage("");


        const email =
          document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();


        const password =
          document
            .getElementById("password")
            .value;


        if (!email || !password) {

          showMessage(
            "Please enter your email and password."
          );

          return;
        }


        loginButton.disabled = true;

        loginButton.textContent =
          "Signing in...";


        try {

          const {
            data,
            error
          } =
            await supabaseClient.auth.signInWithPassword({

              email: email,

              password: password

            });


          if (error) {
            throw error;
          }


          if (!data.session) {

            throw new Error(
              "Login could not be completed. Please try again."
            );

          }


          showMessage(
            "Login successful. Redirecting...",
            "success"
          );


          setTimeout(() => {

            window.location.href =
              "account.html";

          }, 700);


        } catch (error) {

          console.error(
            "Login error:",
            error
          );


          showMessage(
            getAuthErrorMessage(error)
          );


          loginButton.disabled = false;

          loginButton.textContent =
            "Sign In";

        }

      }
    );

  }


  // =========================================
  // GOOGLE AUTHENTICATION
  // =========================================

  const googleSignIn =
    document.getElementById("googleSignIn");

  const googleSignUp =
    document.getElementById("googleSignUp");


  async function signInWithGoogle(button) {

    if (!button) {
      return;
    }


    button.disabled = true;

    button.innerHTML =
      "<span>Connecting...</span>";


    try {

      const {
        error
      } =
        await supabaseClient.auth.signInWithOAuth({

          provider: "google",

          options: {

            redirectTo:
              `${window.location.origin}/account.html`

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
        getAuthErrorMessage(error)
      );


      button.disabled = false;


      button.innerHTML = `
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


  if (googleSignIn) {

    googleSignIn.addEventListener(
      "click",
      () => signInWithGoogle(googleSignIn)
    );

  }


  if (googleSignUp) {

    googleSignUp.addEventListener(
      "click",
      () => signInWithGoogle(googleSignUp)
    );

  }


  // =========================================
  // PASSWORD RESET
  // =========================================

  const forgotPassword =
    document.getElementById("forgotPassword");


  if (forgotPassword) {

    forgotPassword.addEventListener(
      "click",
      async () => {

        const emailInput =
          document.getElementById("email");


        if (!emailInput) {
          return;
        }


        const email =
          emailInput.value
            .trim()
            .toLowerCase();


        if (!email) {

          showMessage(
            "Enter your email address first."
          );

          emailInput.focus();

          return;
        }


        forgotPassword.disabled = true;

        forgotPassword.textContent =
          "Sending...";


        try {

          const {
            error
          } =
            await supabaseClient.auth
              .resetPasswordForEmail(
                email,
                {
                  redirectTo:
                    `${window.location.origin}/reset-password.html`
                }
              );


          if (error) {
            throw error;
          }


          showMessage(
            "Password reset instructions have been sent to your email.",
            "success"
          );


        } catch (error) {

          console.error(
            "Password reset error:",
            error
          );


          showMessage(
            getAuthErrorMessage(error)
          );

        } finally {

          forgotPassword.disabled = false;

          forgotPassword.textContent =
            "Forgot password?";

        }

      }
    );

  }


  // =========================================
  // AUTH ERROR HANDLER
  // =========================================

  function getAuthErrorMessage(error) {

    if (!error || !error.message) {

      return "Something went wrong. Please try again.";

    }


    const message =
      error.message.toLowerCase();


    if (
      message.includes("invalid login credentials")
    ) {

      return "Incorrect email or password.";

    }


    if (
      message.includes("email not confirmed")
    ) {

      return "Please confirm your email address before signing in.";

    }


    if (
      message.includes("user already registered")
    ) {

      return "An account with this email already exists.";

    }


    if (
      message.includes("password should be at least")
    ) {

      return "Your password must contain at least 8 characters.";

    }


    if (
      message.includes("invalid email")
    ) {

      return "Please enter a valid email address.";

    }


    if (
      message.includes("rate limit")
    ) {

      return "Too many attempts. Please wait a moment and try again.";

    }


    return error.message;

  }

});
