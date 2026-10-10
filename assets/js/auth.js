
  // -----------------------------------------
  // GOOGLE AUTHENTICATION
  // -----------------------------------------

  const googleButtons = document.querySelectorAll(
    "#googleSignUp, #googleLogin"
  );

  googleButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const originalHTML = button.innerHTML;

      try {
        button.disabled = true;
        button.innerHTML = "<span>Connecting...</span>";

        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              "https://u3827.github.io/smh-collection-ecommerce/login.html"
          }
        });

        if (error) {
          throw error;
        }

      } catch (error) {
        console.error("Google authentication error:", error);

        showMessage(
          error.message || "Google authentication failed."
        );

        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    });
  });
