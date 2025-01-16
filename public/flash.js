// Show flash popup if present in query string
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("error")) {
  const flashPopup = document.getElementById("flash-popup");
  flashPopup.classList.remove("hidden");
}
