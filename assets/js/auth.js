
/* =========================================
   SMH COLLECTION
   AUTHENTICATION + ROLE ROUTING
   PASSWORD RECOVERY
   GitHub Pages + Supabase
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("SMH Collection Auth loaded.");

  const currentYear = document.getElementById("currentYear");
  const messageBox = document.getElementById("authMessage");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  function showMessage(message, type = "error") {
    if (!messageBox) {
      if (message) alert(message);
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
    showMessage("Authentication service could not load. Please refresh.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient is missing.");
    showMessage("Supabase connection could not be initialized.");
    return;
  }

  // -----------------------------------------
  // SITE ROUTING
  // -----------------------------------------

  const siteBase = new URL(
    "/smh-collection-ecommerce/",
    window.location.origin
  );

  function goToPage(page) {
    window.location.assign(new URL(page, siteBase).href);
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

      if (sessionError) throw sessionError;

      if (!user) {
        goToPage("login.html");
        return;
      }

      const {
        data: profile,
        error: profileError
      } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email, role, is_active, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        showMessage(
          "Your account profile was not found. Please contact SMH Collection support."
        );
        return;
      }

      if (profile.is_active === false) {
        await supabaseClient.auth.signOut();

        showMessage(
          "Your account has been deactivated. Please contact support."
        );
        return;
      }

      console.log("Authenticated profile:", profile);

      if (profile.role === "admin") {
        goToPage("admin-dashboard.html");
      } else if (profile.role === "seller") {
        goToPage("seller-dashboard.html");
      } else if (profile.role === "buyer") {
        goToPage("buyer-dashboard.html");
      } else if (profile.role === "staff") {
        goToPage("staff-dashboard.html");
      } else {
        showMessage(
          "Your account role is not recognized. Please contact support."
        );
      }

    } catch (error) {
      console.error("Role routing error:", error);
      showMessage(error.message || "Unable to load your account.");
    }
  }

  // -----------------------------------------
  // SIGN UP
  // -----------------------------------------

  const signupForm = document.getElementById("signupForm");
  const signupButton = document.getElementById("signupButton");

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showMessage("");

      const fullName =
        document.getElementById("fullName")?.value.trim();

      const email =
        document.getElementById("signupEmail")?.value.trim().toLowerCase();

      const password =
        document.getElementById("signupPassword")?.value;

      const confirmPassword =
        document.getElementById("confirmPassword")?.value;

      if (!fullName || !email || !password || !confirmPassword) {
        showMessage("Please complete all required fields.");
        return;
      }

      if (password.length < 8) {
        showMessage("Your password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        return;
      }

      if (signupButton) {
        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";
      }

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Account creation failed.");
        }

        signupForm.reset();

        showMessage(
          "Account created successfully. Redirecting to login...",
          "success"
        );

        window.setTimeout(() => goToPage("login.html"), 1200);

      } catch (error) {
        console.error("Signup error:", error);
        showMessage(error.message || "Unable to create your account.");

      } finally {
        if (signupButton) {
          signupButton.disabled = false;
          signupButton.textContent = "Create Account";
        }
      }
    });
  }

  // -----------------------------------------
  // EMAIL + PASSWORD LOGIN
  // -----------------------------------------

  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginButton");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showMessage("");

      const email =
        document.getElementById("loginEmail")?.value.trim().toLowerCase();

      const password =
        document.getElementById("loginPassword")?.value;

      if (!email || !password) {
        showMessage("Please enter your email address and password.");
        return;
      }

      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";
      }

      try {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Login failed.");
        }

        showMessage("Login successful. Loading your account...", "success");
        await routeUser();

      } catch (error) {
        console.error("Login error:", error);
        showMessage(error.message || "Unable to sign in.");

      } finally {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = "Sign In";
        }
      }
    });
  }

  // -----------------------------------------
  // FORGOT PASSWORD
  // -----------------------------------------

  const forgotPasswordButton =
    document.getElementById("forgotPassword");

  if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async () => {
      showMessage("");

      const emailInput = document.getElementById("loginEmail");
      const email = emailInput?.value.trim().toLowerCase();

      if (!email) {
        showMessage("Enter your email address first.");
        emailInput?.focus();
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage("Please enter a valid email address.");
        emailInput?.focus();
        return;
      }

      const originalText = forgotPasswordButton.textContent;

      forgotPasswordButton.disabled = true;
      forgotPasswordButton.textContent = "Sending email...";

      try {
        const redirectTo = new URL(
          "reset-password.html",
          siteBase
        ).href;

        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo
          });

        if (error) throw error;

        showMessage(
          "If an account exists for this email, a reset email will be sent. Check your inbox and spam folder.",
          "success"
        );

      } catch (error) {
        console.error("Password recovery error:", error);

        showMessage(
          error.message ||
          "Unable to send the reset email. Please try again."
        );

      } finally {
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent = originalText;
      }
    });
  }

  // -----------------------------------------
  // GOOGLE SIGN-IN
  // -----------------------------------------

  const googleButtons = document.querySelectorAll(
    "#googleSignUp, #googleLogin"
  );

  googleButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const originalHTML = button.innerHTML;

      try {
        button.disabled = true;
        button.innerHTML = "<span>Connecting to Google...</span>";
        showMessage("");

        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: new URL("login.html", siteBase).href
          }
        });

        if (error) throw error;

      } catch (error) {
        console.error("Google authentication error:", error);

        showMessage(
          error.message ||
          "Google authentication failed. Please try again."
        );

        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    });
  });

  // -----------------------------------------
  // AUTH SESSION CALLBACK
  // -----------------------------------------

  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event);

    if (event !== "SIGNED_IN" || !session) return;

    const currentPage = window.location.pathname.split("/").pop();

    if (
      currentPage === "login.html" ||
      currentPage === "signup.html" ||
      currentPage === ""
    ) {
      window.setTimeout(() => {
        routeUser();
      }, 0);
    }
  });
});
