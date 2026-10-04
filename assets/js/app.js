/* =========================================
   SMH COLLECTION
   Main JavaScript
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     CURRENT YEAR
  ========================== */

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

});