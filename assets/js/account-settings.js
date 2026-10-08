document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // =========================================================
  // SMH COLLECTION — ACCOUNT SETTINGS
  // =========================================================

  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const avatarUrlInput = document.getElementById("avatarUrl");

  const profileAvatar = document.getElementById("profileAvatar");
  const profileDisplayName =
    document.getElementById("profileDisplayName");
  const profileDisplayEmail =
    document.getElementById("profileDisplayEmail");

  const profileMessage =
    document.getElementById("profileMessage");

  const passwordMessage =
    document.getElementById("passwordMessage");

  const saveProfileButton =
    document.getElementById("saveProfileButton");

  const changePasswordButton =
    document.getElementById("changePasswordButton");

  const newPasswordInput =
    document.getElementById("newPassword");

  const confirmPasswordInput =
    document.getElementById("confirmPassword");

  const accountEmail =
    document.getElementById("accountEmail");

  const accountRole =
    document.getElementById("accountRole");

  const accountStatus =
    document.getElementById("accountStatus");

  const logoutButton =
    document.getElementById("logoutButton");

  const currentYear =
    document.getElementById("currentYear");


  // =========================================================
  // YEAR
  // =========================================================

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // =========================================================
  // SUPABASE CHECK
  // =========================================================

  if (typeof supabaseClient === "undefined") {
    showMessage(
      profileMessage,
      "Supabase could not be initialized. Please refresh the page.",
      "error"
    );

    return;
  }


  // =========================================================
  // HELPERS
  // =========================================================

  function showMessage(element, message, type) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className = "form-message";

    if (message && type) {
      element.classList.add(type);
    }
  }


  function getInitials(name) {
    if (!name) {
      return "U";
    }

    const words = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }


  function setAvatar(name, avatarUrl) {
    if (!profileAvatar) {
      return;
    }

    if (avatarUrl) {
      profileAvatar.innerHTML = "";

      const image = document.createElement("img");

      image.src = avatarUrl;
      image.alt = name || "Profile picture";

      image.onerror = () => {
        profileAvatar.textContent =
          getInitials(name);
      };

      profileAvatar.appendChild(image);

    } else {
      profileAvatar.textContent =
        getInitials(name);
    }
  }


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  async function getCurrentUser() {
    const {
      data: {
        user
      },
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    return user;
  }


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  async function loadProfile(user) {
    if (!user) {
      return;
    }

    let fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "";

    let avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "";

    let role = "buyer";
    let isActive = true;


    // -------------------------------------------------------
    // GET PROFILE FROM SUPABASE
    // -------------------------------------------------------

    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select(`
        full_name,
        email,
        role,
        avatar_url,
        is_active
      `)
      .eq("id", user.id)
      .maybeSingle();


    if (error) {
      throw error;
    }


    // -------------------------------------------------------
    // USE PROFILE DATA
    // -------------------------------------------------------

    if (profile) {

      if (profile.full_name) {
        fullName = profile.full_name;
      }

      if (profile.avatar_url) {
        avatarUrl = profile.avatar_url;
      }

      if (profile.role) {
        role = profile.role;
      }

      if (
        typeof profile.is_active === "boolean"
      ) {
        isActive = profile.is_active;
      }

    }


    const email =
      profile?.email ||
      user.email ||
      "";


    // -------------------------------------------------------
    // FILL PROFILE FORM
    // -------------------------------------------------------

    if (fullNameInput) {
      fullNameInput.value = fullName;
    }

    if (emailInput) {
      emailInput.value = email;
    }

    if (avatarUrlInput) {
      avatarUrlInput.value = avatarUrl;
    }


    // -------------------------------------------------------
    // PROFILE PREVIEW
    // -------------------------------------------------------

    if (profileDisplayName) {
      profileDisplayName.textContent =
        fullName || "Account";
    }

    if (profileDisplayEmail) {
      profileDisplayEmail.textContent =
        email;
    }

    setAvatar(
      fullName || "Account",
      avatarUrl
    );


    // -------------------------------------------------------
    // ACCOUNT INFORMATION
    // -------------------------------------------------------

    if (accountEmail) {
      accountEmail.textContent =
        email || "Not available";
    }

    if (accountRole) {
      accountRole.textContent =
        role || "buyer";
    }

    if (accountStatus) {

      accountStatus.textContent =
        isActive ? "Active" : "Inactive";

      accountStatus.className =
        isActive
          ? "status-badge"
          : "status-badge inactive";
    }
  }


  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  if (profileForm) {

    profileForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        showMessage(
          profileMessage,
          "",
          ""
        );

        const fullName =
          fullNameInput?.value.trim() || "";

        const avatarUrl =
          avatarUrlInput?.value.trim() || "";


        if (!fullName) {

          showMessage(
            profileMessage,
            "Please enter your full name.",
            "error"
          );

          return;
        }


        saveProfileButton.disabled = true;
        saveProfileButton.textContent =
          "Saving...";


        try {

          const user =
            await getCurrentUser();

          if (!user) {
            return;
          }


          // -------------------------------------------------
          // UPDATE PROFILES TABLE
          // -------------------------------------------------

          const {
            error
          } = await supabaseClient
            .from("profiles")
            .update({
              full_name: fullName,
              avatar_url:
                avatarUrl || null
            })
            .eq("id", user.id);


          if (error) {
            throw error;
          }


          // -------------------------------------------------
          // UPDATE AUTH METADATA TOO
          // -------------------------------------------------

          const {
            error: metadataError
          } = await supabaseClient.auth.updateUser({
            data: {
              full_name: fullName,
              avatar_url:
                avatarUrl || null
            }
          });


          if (metadataError) {
            console.warn(
              "Auth metadata update failed:",
              metadataError
            );
          }


          // -------------------------------------------------
          // REFRESH UI
          // -------------------------------------------------

          if (profileDisplayName) {
            profileDisplayName.textContent =
              fullName;
          }

          setAvatar(
            fullName,
            avatarUrl
          );


          showMessage(
            profileMessage,
            "Your profile has been updated successfully.",
            "success"
          );

        } catch (error) {

          console.error(
            "Profile update error:",
            error
          );

          showMessage(
            profileMessage,
            error?.message ||
              "Unable to update your profile.",
            "error"
          );

        } finally {

          saveProfileButton.disabled = false;

          saveProfileButton.textContent =
            "Save Profile";
        }
      }
    );
  }


  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  if (passwordForm) {

    passwordForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        showMessage(
          passwordMessage,
          "",
          ""
        );

        const newPassword =
          newPasswordInput?.value || "";

        const confirmPassword =
          confirmPasswordInput?.value || "";


        // ---------------------------------------------------
        // VALIDATION
        // ---------------------------------------------------

        if (newPassword.length < 6) {

          showMessage(
            passwordMessage,
            "Password must contain at least 6 characters.",
            "error"
          );

          return;
        }


        if (newPassword !== confirmPassword) {

          showMessage(
            passwordMessage,
            "The passwords do not match.",
            "error"
          );

          return;
        }


        changePasswordButton.disabled = true;

        changePasswordButton.textContent =
          "Changing Password...";


        try {

          const {
            error
          } = await supabaseClient.auth.updateUser({
            password: newPassword
          });


          if (error) {
            throw error;
          }


          passwordForm.reset();


          showMessage(
            passwordMessage,
            "Your password has been changed successfully.",
            "success"
          );

        } catch (error) {

          console.error(
            "Password update error:",
            error
          );

          showMessage(
            passwordMessage,
            error?.message ||
              "Unable to change your password.",
            "error"
          );

        } finally {

          changePasswordButton.disabled = false;

          changePasswordButton.textContent =
            "Change Password";
        }
      }
    );
  }


  // =========================================================
  // LOGOUT
  // =========================================================

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        logoutButton.disabled = true;

        logoutButton.textContent =
          "Signing Out...";


        const {
          error
        } = await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            "Logout error:",
            error
          );

          logoutButton.disabled = false;

          logoutButton.textContent =
            "↪ Sign Out";

          alert(
            "Unable to sign out. Please try again."
          );

          return;
        }


        window.location.href =
          "login.html";
      }
    );
  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  try {

    const user =
      await getCurrentUser();

    if (user) {
      await loadProfile(user);
    }

  } catch (error) {

    console.error(
      "Account settings initialization error:",
      error
    );

    showMessage(
      profileMessage,
      error?.message ||
        "Unable to load your account information.",
      "error"
    );
  }

});