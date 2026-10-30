(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var menuButton = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    mobileMenu.hidden = !open;
    menuButton.innerHTML = open
      ? '<i data-lucide="x" aria-hidden="true"></i>'
      : '<i data-lucide="menu" aria-hidden="true"></i>';
    if (window.lucide) window.lucide.createIcons();
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
  }

  document.querySelectorAll(".mobile-menu a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries, currentObserver) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  if (window.lucide) window.lucide.createIcons();

  var progressBar = document.querySelector(".scroll-progress span");
  var progressFrame = null;

  function updateScrollProgress() {
    progressFrame = null;
    if (!progressBar) return;
    var available = document.documentElement.scrollHeight - window.innerHeight;
    var progress = available > 0 ? Math.min(window.scrollY / available, 1) : 0;
    progressBar.style.width = (progress * 100).toFixed(2) + "%";
  }

  function scheduleScrollProgress() {
    if (progressFrame === null) progressFrame = window.requestAnimationFrame(updateScrollProgress);
  }

  window.addEventListener("scroll", scheduleScrollProgress, { passive: true });
  window.addEventListener("resize", scheduleScrollProgress);
  updateScrollProgress();

  var motionSafe = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (motionSafe.matches) {
    document.querySelectorAll(".publication-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--spotlight-x", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--spotlight-y", (y * 100).toFixed(1) + "%");
        card.style.transform = "perspective(1100px) rotateX(" + ((0.5 - y) * 2.4).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 2.4).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });

    var portrait = document.querySelector(".hero-portrait");
    var hero = document.querySelector(".hero");
    if (portrait && hero) {
      hero.addEventListener("pointermove", function (event) {
        var rect = hero.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        portrait.style.transform = "translate3d(" + (x * 7).toFixed(2) + "px," + (y * 7).toFixed(2) + "px,0)";
      });
      hero.addEventListener("pointerleave", function () {
        portrait.style.transform = "";
      });
    }
  }
})();
