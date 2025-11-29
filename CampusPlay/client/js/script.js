document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupMobileMenu();
});
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userDropdown = document.getElementById("user-dropdown");
  const userInitials = document.getElementById("user-initials");
  const userName = document.getElementById("user-name");

  if (token && user.name) {
    // User is logged in
    if (userInitials) {
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      userInitials.textContent = initials;
    }

    // Update user name if element exists (tournaments page)
    if (userName) {
      userName.textContent = user.name;
    }

    // Setup signout link
    const signoutLink = document.getElementById("signout-link");
    if (signoutLink) {
      signoutLink.href = "#";
      signoutLink.onclick = (e) => {
        e.preventDefault();
        logout();
      };
    }
  } else {
    // User is not logged in
    if (userDropdown) {
      userDropdown.innerHTML = '<a href="login.html" style="color: white; text-decoration: none; font-weight: 600;">Login</a>';
    }

    // For tournaments page - update to show login option
    if (userName) {
      userName.innerHTML = '<a href="login.html" style="color: var(--text-light); text-decoration: none; font-weight: 800;">Login</a>';
    }
    if (userInitials) {
      userInitials.textContent = "?";
    }
  }
}

function setupMobileMenu() {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav-links");

  if (burger) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("nav-active");
      burger.classList.toggle("toggle");
    });
  }
}
