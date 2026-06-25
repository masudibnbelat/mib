// public/theme-init.js
(function () {
  try {
    var t = localStorage.getItem("theme");
    document.documentElement.setAttribute(
      "data-theme",
      t === "light" || t === "dark" ? t : "dark",
    );
  } catch (e) {}
})();
