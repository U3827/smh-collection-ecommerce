// =========================================
// SMH COLLECTION
// Authentication
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginButton");
  const googleButton = document.getElementById("googleSignIn");
  const forgotPassword = document.getElementById("forgotPassword");
  const messageBox = document.getElementById("authMessage");


  // =========================================
  // MESSAGE HELPER
  // =========================================

  function showMessage(message, type = "error") {

    if (!messageBox) {
      return;
    }

    messageBox.textContent = message;

    messageBox.className = "auth-message";

    messageBox.classList.add(type);

  }


  // =========================================
  // LOGIN
  // =========================================

  if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

      event.preventDefault();

      const email = document
        .getElementById("email")
        .value
        .trim();

      const password = document
        .getElementById("password")
        .value;


      if (!email || !password) {

        showMessage(
          "Please enter your email and password."
        );

        return;
      }


      loginButton.disabled = true;
      loginButton.textContent = "Signing in...";

      showMessage("", "success");


      try {

        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
          });


        if (error) {
          throw error;
        }


        if (!data.session) {
          throw new Error(
            "Login was not completed. Please try again."
          );
        }


        showMessage(
          "Login successful. Redirecting...",
          "success"
        );


        setTimeout(() => {

          window.location.href = "account.html";

        }, 700);


      } catch (error) {

        console.error("Login error:", error);

        showMessage(
          error.message ||
          "Unable to sign in. Please check your details."
        );

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

      }

    });

  }


  // =========================================
  // GOOGLE SIGN-IN
  // =========================================

  if (googleButton) {

    googleButton.addEventListener("click", async () => {

      googleButton.disabled = true;
      googleButton.textContent = "Connecting...";


      try {

        const { error } =
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
          "Google sign-in error:",
          error
        );

        showMessage(
          error.message ||
          "Google sign-in could not be started."
        );

        googleButton.disabled = false;

        googleButton.innerHTML = `
          <span class="google-icon">G</span>
          <span>Continue with Google</span>
        `;

      }

    });

  }


  // =========================================
  // FORGOT PASSWORD
  // =========================================

  if (forgotPassword) {

    forgotPassword.addEventListener("click", async () => {

      const emailInput =
        document.getElementById("email");

      const email =
        emailInput.value.trim();


      if (!email) {

        showMessage(
          "Enter your email address first."
        );

        emailInput.focus();

        return;
      }


      forgotPassword.disabled = true;
      forgotPassword.textContent = "Sending...";


      try {

        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(
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
          error.message ||
          "Unable to send password reset email."
        );

      }


      forgotPassword.disabled = false;
      forgotPassword.textContent =
        "Forgot password?";

    });

  }


  // =========================================
  // CURRENT YEAR
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {

    currentYear.textContent =
      new Date().getFullYear();

  }

});
