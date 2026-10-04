// =========================================
// SMH COLLECTION
// REAL AUTHENTICATION + ROLE ROUTING
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("SMH Collection Auth loaded.");

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  const messageBox = document.getElementById("authMessage");

  function showMessage(message, type = "error") {
    if (!messageBox) {
      if (message) {
        alert(message);
      }
      return;
    }

    messageBox.textContent = message;
    messageBox.className = "auth-message";

    if (message) {
      messageBox.classList.add(type);
    }
  }

  // -----------------------------------------
  // CHECK SUPABASE
  // -----------------------------------------

  if (typeof window.supabase === "undefined") {
    console.error("Supabase library is missing.");
    showMessage(
      "Authentication service could not load. Please refresh the page."
    );
    return;
  }

  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient is missing.");
    showMessage(
      "Supabase connection could not be initialized."
    );
    return;
  }

  // -----------------------------------------
  // ROLE ROUTING
  // -----------------------------------------

  async function routeUser() {
    try {
      const {
        data: { user },
        error: sessionError
      } = await supabaseClient.auth.getUser();

      if (sessionError) {
        throw sessionError;
      }

      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const {
        data: profile,
        error: profileError
      } = await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active, avatar_url"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile.is_active) {
        await supabaseClient.auth.signOut();

        showMessage(
          "Your account has been deactivated. Please contact SMH Collection support."
        );

        return;
      }

      console.log("Authenticated profile:", profile);

      if (profile.role === "admin") {
        window.location.href = "admin-dashboard.html";
        return;
      }

      if (profile.role === "seller") {
        window.location.href = "seller-dashboard.html";
        return;
      }

      if (profile.role === "buyer") {
        window.location.href = "buyer-dashboard.html";
        return;
      }

      throw new Error(
        "Your account has an invalid account role."
      );

    } catch (error) {
      console.error("Role routing error:", error);

      showMessage(
        error.message ||
        "Unable to load your account."
      );
    }
  }

  // -----------------------------------------
  // SIGN UP
  // -----------------------------------------

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

        signupButton.disabled = true;
        signupButton.textContent =
          "Creating account...";

        try {

          const {
            data,
            error
          } =
            await supabaseClient.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName
                }
              }
            });

          if (error) {
            throw error;
          }

          if (!data.user) {
            throw new Error(
              "Account creation failed."
            );
          }

          showMessage(
            "Account created successfully. Redirecting to login...",
            "success"
          );

          signupForm.reset();

          setTimeout(() => {
            window.location.href = "login.html";
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
  }

  // -----------------------------------------
  // LOGIN
  // -----------------------------------------

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
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();

        const password =
          document
            .getElementById("loginPassword")
            .value;

        if (!email) {
          showMessage(
            "Please enter your email address."
          );
          return;
        }

        if (!password) {
          showMessage(
            "Please enter your password."
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
              email,
              password
            });

          if (error) {
            throw error;
          }

          if (!data.user) {
            throw new Error(
              "Login failed."
            );
          }

          showMessage(
            "Login successful. Loading your account...",
            "success"
          );

          await routeUser();

        } catch (error) {

          console.error(
            "Login error:",
            error
          );

          showMessage(
            error.message ||
            "Unable to sign in."
          );

        } finally {

          loginButton.disabled = false;
          loginButton.textContent =
            "Sign In";
        }
      }
    );
  }

  // -----------------------------------------
  // GOOGLE AUTHENTICATION
  // -----------------------------------------

  const googleButtons =
    document.querySelectorAll(
      "#googleSignUp, #googleLogin"
    );

  googleButtons.forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        try {

          button.disabled = true;

          const originalHTML =
            button.innerHTML;

          button.innerHTML =
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

          button.disabled = false;

          button.innerHTML =
            "<span>Continue with Google</span>";
        }
      }
    );
  });

  // -----------------------------------------
  // AUTH SESSION CALLBACK
  // -----------------------------------------

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "Auth event:",
        event
      );

      if (
        event === "SIGNED_IN" &&
        session
      ) {

        const currentPage =
          window.location.pathname
            .split("/")
            .pop();

        if (
          currentPage === "login.html" ||
          currentPage === "signup.html" ||
          currentPage === ""
        ) {
          await routeUser();
        }
      }
    }
  );

});