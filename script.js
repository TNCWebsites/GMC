const ambientCanvas = document.querySelector(".ambient__canvas");
const ambientContext = ambientCanvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (ambientContext) {
  const ambient = {
    width: 0,
    height: 0,
    particles: [],
    pointer: { x: 0, y: 0, active: false, pulse: 0 },
    frame: 0,
    previousFrame: 0
  };
  const maxParticles = reducedMotion.matches ? 28 : 76;
  const linkDistance = reducedMotion.matches ? 108 : 132;

  function resizeAmbient() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    ambient.width = window.innerWidth;
    ambient.height = window.innerHeight;
    ambientCanvas.width = Math.round(ambient.width * pixelRatio);
    ambientCanvas.height = Math.round(ambient.height * pixelRatio);
    ambientContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = Math.min(maxParticles, Math.max(20, Math.round(ambient.width * ambient.height / 17000)));
    ambient.particles = Array.from({ length: count }, () => ({
      x: Math.random() * ambient.width,
      y: Math.random() * ambient.height,
      vx: (Math.random() - 0.5) * (reducedMotion.matches ? 0.1 : 0.25),
      vy: (Math.random() - 0.5) * (reducedMotion.matches ? 0.1 : 0.25),
      radius: 0.7 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function updatePointer(event) {
    ambient.pointer.x = event.clientX;
    ambient.pointer.y = event.clientY;
    ambient.pointer.active = true;
  }

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    ambient.pointer.pulse = 1;
  }, { passive: true });
  window.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") ambient.pointer.active = false;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ambient.pointer.active = false; });
  window.addEventListener("resize", resizeAmbient, { passive: true });

  function drawAmbient(timestamp) {
    ambient.frame = window.requestAnimationFrame(drawAmbient);
    if (document.hidden || timestamp - ambient.previousFrame < 30) return;

    const delta = Math.min((timestamp - ambient.previousFrame) / 16.67, 2);
    ambient.previousFrame = timestamp;
    ambientContext.clearRect(0, 0, ambient.width, ambient.height);
    ambient.pointer.pulse *= 0.96;

    ambient.particles.forEach((particle, index) => {
      particle.phase += 0.006 * delta;
      particle.vx += Math.sin(particle.phase) * 0.002 * delta;
      particle.vy += Math.cos(particle.phase * 0.8) * 0.002 * delta;

      if (ambient.pointer.active) {
        const dx = particle.x - ambient.pointer.x;
        const dy = particle.y - ambient.pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 175);
        if (distance > 0 && influence > 0) {
          const force = influence * (reducedMotion.matches ? 0.008 : 0.016) * delta;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      particle.vx *= 0.995;
      particle.vy *= 0.995;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      if (particle.x < -5) particle.x = ambient.width + 5;
      if (particle.x > ambient.width + 5) particle.x = -5;
      if (particle.y < -5) particle.y = ambient.height + 5;
      if (particle.y > ambient.height + 5) particle.y = -5;

      ambientContext.beginPath();
      ambientContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ambientContext.fillStyle = "rgba(232, 210, 160, 0.72)";
      ambientContext.fill();

      for (let nextIndex = index + 1; nextIndex < ambient.particles.length; nextIndex += 1) {
        const other = ambient.particles[nextIndex];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < linkDistance) {
          const alpha = (1 - distance / linkDistance) * 0.15;
          ambientContext.beginPath();
          ambientContext.moveTo(particle.x, particle.y);
          ambientContext.lineTo(other.x, other.y);
          ambientContext.strokeStyle = `rgba(201, 169, 107, ${alpha})`;
          ambientContext.lineWidth = 0.7;
          ambientContext.stroke();
        }
      }
    });

    if (ambient.pointer.pulse > 0.015) {
      const radius = (1 - ambient.pointer.pulse) * 72;
      ambientContext.beginPath();
      ambientContext.arc(ambient.pointer.x, ambient.pointer.y, radius, 0, Math.PI * 2);
      ambientContext.strokeStyle = `rgba(232, 210, 160, ${ambient.pointer.pulse * 0.35})`;
      ambientContext.lineWidth = 1;
      ambientContext.stroke();
    }
  }

  resizeAmbient();
  ambient.frame = window.requestAnimationFrame(drawAmbient);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(ambient.frame);
      ambient.previousFrame = 0;
    } else {
      ambient.frame = window.requestAnimationFrame(drawAmbient);
    }
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  siteNav.classList.toggle("is-open", !isOpen);
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    siteNav.classList.remove("is-open");
  });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelector("#year").textContent = new Date().getFullYear();

const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const formData = new FormData(contactForm);
  const name = formData.get("name").toString().trim();
  const email = formData.get("email").toString().trim();
  const service = formData.get("service").toString();
  const message = formData.get("message").toString().trim();
  const lines = [
    "Olá, Guimarães Creative! Vim pelo site.",
    "",
    `Meu nome é ${name}.`,
    `Tenho interesse em: ${service}.`,
    email ? `Meu e-mail: ${email}.` : "",
    "",
    message
  ].filter(Boolean);
  const whatsappUrl = `https://wa.me/5521976868860?text=${encodeURIComponent(lines.join("\n"))}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  if (whatsappWindow) {
    feedback.textContent = "Sua conversa está pronta no WhatsApp. É só enviar a mensagem!";
    contactForm.reset();
  } else {
    feedback.textContent = "O navegador bloqueou a nova janela. Use o botão flutuante do WhatsApp para continuar.";
  }
});

const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("p");
document.querySelectorAll(".work-card").forEach((card) => {
  card.addEventListener("click", () => {
    lightboxImage.src = card.dataset.image;
    lightboxImage.alt = card.querySelector("img").alt;
    lightboxCaption.textContent = card.dataset.title;
    lightbox.showModal();
  });
});

lightbox.querySelector(".lightbox__close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
