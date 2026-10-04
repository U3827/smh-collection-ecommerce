// =========================================
// SMH COLLECTION
// Main Website JavaScript
// =========================================

document.addEventListener("DOMContentLoaded", () => {


  /* =========================================
     CURRENT YEAR
  ========================================== */

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }



  /* =========================================
     EXPANDABLE SECTIONS
  ========================================== */

  const expandableButtons =
    document.querySelectorAll(
      ".expandable-button"
    );


  expandableButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const targetId =
        button.getAttribute("data-target");

      const target =
        document.getElementById(targetId);

      const block =
        button.closest(".expandable-block");


      if (!target || !block) {
        return;
      }


      const isOpen =
        block.classList.contains("open");


      /* Close all other sections */

      document
        .querySelectorAll(".expandable-block.open")
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


      /* Toggle current section */

      if (isOpen) {

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