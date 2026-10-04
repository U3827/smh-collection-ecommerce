
// =========================================
// SMH COLLECTION
// Main Website JavaScript
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  // Current year
  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // Expandable sections
  const expandableButtons = document.querySelectorAll(
    ".expandable-button"
  );

  expandableButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const block = button.closest(".expandable-block");

      if (!block) {
        return;
      }

      const content = block.querySelector(
        ".expandable-content"
      );

      if (!content) {
        return;
      }

      const currentlyOpen =
        block.classList.contains("open");


      // Close every other section
      document
        .querySelectorAll(".expandable-block")
        .forEach((otherBlock) => {

          if (otherBlock !== block) {

            otherBlock.classList.remove("open");

            const otherButton =
              otherBlock.querySelector(
                ".expandable-button"
              );

            if (otherButton) {
              otherButton.setAttribute(
                "aria-expanded",
                "false"
              );
            }

          }

        });


      // Toggle clicked section
      if (currentlyOpen) {

        block.classList.remove("open");

        button.setAttribute(
          "aria-expanded",
          "false"
        );

      } else {

        block.classList.add("open");

        button.setAttribute(
          "aria-expanded",
          "true"
        );

      }

    });

  });

});