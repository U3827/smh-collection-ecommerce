
/* =========================================
   SMH COLLECTION
   PASSWORD RESET
   GitHub Pages + Supabase
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("resetPasswordForm");
  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");
  const messageBox = document.getElementById("resetMessage");
  const resetButton = document.getElementById("resetButton");
  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  function showMessage(message, type = "error") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = "auth-message";

    if (message) {
      messageBox.classList.add(type);
    }
  }

  if (
    !form ||
    !passwordInput ||
    !confirmInput ||
    !messageBox ||
    !resetButton
  ) {
    console.error("Password reset page elements are missing.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    showMessage(
      "Authentication service could not load. Please refresh the page."
    );
    resetButton.disabled = true;
    return;
  }

  let recoverySessionReady = false;
  let recoveryCheckFinished = false;

  resetButton.disabled = true;

  showMessage("Checking your password-reset link...", "success");

  // -----------------------------------------
  // VERIFY THE RECOVERY SESSION
  // -----------------------------------------

  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) throw error;

    recoverySessionReady = Boolean(session);

    if (recoverySessionReady) {
      showMessage(
        "Your reset link is ready. Enter your new password.",
        "success"
      );
    } else {
      showMessage(
        "No valid reset session was found. Open the latest password-reset email or request a new link from the login page."
      );
    }
  } catch (error) {
    console.error("Recovery session check failed:", error);

    showMessage(
      "We could not verify your reset link. Please request a new one."
    );
  } finally {
    recoveryCheckFinished = true;
    resetButton.disabled = !recoverySessionReady;
  }

  // -----------------------------------------
  // HANDLE PASSWORD RECOVERY EVENTS
  // -----------------------------------------

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      recoverySessionReady = true;

      if (recoveryCheckFinished) {
        resetButton.disabled = false;
      }

      showMessage(
        "Your reset link is verified. You can now choose a new password.",
        "success"
      );
    }
  });

  // -----------------------------------------
  // UPDATE PASSWORD
  // -----------------------------------------

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    if (!recoverySessionReady) {
      showMessage(
        "Your reset link is missing, invalid, or expired. Request a new link from the login page."
      );
      return;
    }

    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (password.length < 8) {
      showMessage("Your password must contain at least 8 characters.");
      passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      showMessage("The passwords do not match.");
      confirmInput.focus();
      return;
    }

    resetButton.disabled = true;
    resetButton.textContent = "Updating password...";

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password
      });

      if (error) throw error;

      showMessage(
        "Your password has been updated successfully. Signing you out so you can sign in with your new password.",
        "success"
      );

      passwordInput.value = "";
      confirmInput.value = "";

      const { error: signOutError } =
        await supabaseClient.auth.signOut();

      if (signOutError) {
        console.error("Sign-out after password reset:", signOutError);
      }

      window.setTimeout(() => {
        window.location.assign(
          new URL(
            "login.html",
            new URL("/smh-collection-ecommerce/", window.location.origin)
          ).href
        );
      }, 2000);

    } catch (error) {
      console.error("Password update failed:", error);

      showMessage(
        error.message ||
        "We could not update your password. Please try again."
      );

    } finally {
      resetButton.disabled = !recoverySessionReady;
      resetButton.textContent = "Update Password";
    }
  });
});
