// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Refresh ScrollTrigger
  ScrollTrigger.refresh();

  // Navbar animation
  gsap.from(".navbar-brand", {
    opacity: 0,
    x: -50,
    duration: 1,
    ease: "power2.out"
  });

  gsap.from(".nav-link", {
    opacity: 0,
    y: -20,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.out"
  });

  gsap.from(".nav-buttons", {
    opacity: 0,
    x: 50,
    duration: 1,
    delay: 0.5,
    ease: "power2.out"
  });

  // Hero section animations
  const heroTimeline = gsap.timeline({
    defaults: { ease: "power2.out" }
  });

  heroTimeline
    .from(".hero-title", {
      opacity: 0,
      y: 50,
      duration: 1
    })
    .from(".hero-subtitle", {
      opacity: 0,
      y: 30,
      duration: 0.8
    }, "-=0.5")
    .from(".hero-buttons", {
      opacity: 0,
      y: 30,
      duration: 0.8
    }, "-=0.5")
    .from(".hero-image", {
      opacity: 0,
      scale: 0.8,
      duration: 1
    }, "-=0.5");

  // Stats Section Animations
  gsap.from('.stat-card', {
    scrollTrigger: {
      trigger: '.stats-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
  });

  // Counter Animation for Stats
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach(stat => {
    const target = parseInt(stat.getAttribute('data-value'));
    gsap.to(stat, {
      scrollTrigger: {
        trigger: stat,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      innerHTML: target,
      duration: 2,
      snap: { innerHTML: 1 },
      ease: 'power1.inOut'
    });
  });

  // Features section animation
  gsap.utils.toArray(".feature-card").forEach((card, index) => {
    gsap.fromTo(
      card,
      { 
        opacity: 0, 
        y: 50,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        delay: index * 0.2,
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

  // How It Works section animation
  gsap.utils.toArray(".step-card").forEach((card, index) => {
    gsap.fromTo(
      card,
      { 
        opacity: 0, 
        x: index % 2 === 0 ? -50 : 50,
        scale: 0.9
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        delay: index * 0.2,
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

  // Testimonials Section Animations
  gsap.from('.testimonial-card', {
    scrollTrigger: {
      trigger: '.testimonials-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.3,
    ease: 'power3.out'
  });

  // Pricing Section Animations
  gsap.from('.pricing-card', {
    scrollTrigger: {
      trigger: '.pricing-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
  });

  // FAQ Section Animations
  gsap.from('.accordion-item', {
    scrollTrigger: {
      trigger: '.faq-section',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out'
  });

  // CTA section animation
  gsap.from(".cta-section", {
    scrollTrigger: {
      trigger: ".cta-section",
      start: "top 80%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 50
  });

  // Footer animation
  gsap.from(".footer h4", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
      trigger: ".footer",
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        gsap.to(window, {
          duration: 0.8,
          scrollTo: {
            y: target,
            offsetY: 80
          },
          ease: "power2.inOut"
        });
      }
    });
  });

  // Parallax effect for hero image
  gsap.to(".hero-image", {
    y: "20%",
    ease: "none",
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  // Refresh ScrollTrigger after all animations are set up
  ScrollTrigger.refresh();
});