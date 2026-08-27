/* =====================================================
   Muhamad Ryan Rizki — Portfolio
   ===================================================== */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


// --- 1. Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

if (cursorDot && cursorOutline && isFinePointer) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 150, fill: 'forwards' });
    });

    document.querySelectorAll('a, button, input, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '60px';
            cursorOutline.style.height = '60px';
            cursorOutline.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
        });
        el.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '40px';
            cursorOutline.style.height = '40px';
            cursorOutline.style.backgroundColor = 'transparent';
        });
    });
}


// --- 2. Cinematic Scroll-Scrub ---
const scrub = document.querySelector('.scroll-scrub');

if (scrub) {
    const layers = [...scrub.querySelectorAll('.scroll-scrub__layer')];
    const chapters = [...scrub.querySelectorAll('.scroll-scrub__chapter')];
    const routeButtons = [...scrub.querySelectorAll('.scroll-scrub__route-button')];
    const progressFill = scrub.querySelector('.scroll-scrub__progress span');
    const scrollHint = document.getElementById('scroll-hint');
    const portrait = document.getElementById('portrait');
    const portraitSets = portrait ? [...portrait.querySelectorAll('.portrait__set')] : [];
    const stage = scrub.querySelector('.scroll-scrub__stage');

    // How far the portrait swings from centre, in vw. The portrait is 46vw
    // wide and centred, so ±32vw carries it right to the edge and lets it
    // bleed slightly off frame — a wider, more cinematic arc.
    const PORTRAIT_SWING = 32;

    let activeIndex = -1;

    // Pointer parallax: the portrait leans against the scene behind it
    if (portrait && !prefersReducedMotion && isFinePointer) {
        window.addEventListener('mousemove', (e) => {
            const px = (e.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
            const py = (e.clientY / window.innerHeight) * 2 - 1;
            portrait.style.setProperty('--px', px.toFixed(3));
            portrait.style.setProperty('--py', py.toFixed(3));
            if (stage) {
                stage.style.setProperty('--bg-px', (px * -8).toFixed(1) + 'px');
                stage.style.setProperty('--bg-py', (py * -6).toFixed(1) + 'px');
            }
        }, { passive: true });
    }

    function updateScrub() {
        const rect = scrub.getBoundingClientRect();
        const scrollable = scrub.offsetHeight - window.innerHeight;
        const progress = clamp(-rect.top / scrollable, 0, 1);

        scrub.style.setProperty('--ss-progress', progress.toFixed(4));
        if (progressFill) progressFill.style.transform = `scaleX(${progress})`;

        // Continuous position across scenes drives the cross-fade
        const pos = progress * (layers.length - 1);

        layers.forEach((layer, i) => {
            const opacity = clamp(1 - Math.abs(i - pos), 0, 1);
            layer.style.opacity = opacity.toFixed(3);
            layer.style.zIndex = opacity > 0.5 ? 2 : 1;
        });

        // Active chapter — based on which pin currently fills the viewport
        let current = 0;
        chapters.forEach((chapter, i) => {
            const cRect = chapter.getBoundingClientRect();
            if (cRect.top <= window.innerHeight * 0.55 && cRect.bottom > window.innerHeight * 0.55) {
                current = i;
            }
        });

        if (current !== activeIndex) {
            activeIndex = current;
            chapters.forEach((c, i) => c.classList.toggle('is-active', i === current));
            routeButtons.forEach((b, i) => b.classList.toggle('is-active', i === current));
        }

        if (scrollHint) scrollHint.style.opacity = progress > 0.03 ? '0' : '1';

        // The portrait glides side to side, landing opposite the copy block on
        // every chapter. A cosine of the same continuous position gives a
        // perfectly smooth swing with no snap at the chapter boundaries:
        // pos 0 -> right, 1 -> left, 2 -> right, ...
        if (portrait) {
            const sx = Math.cos(pos * Math.PI) * PORTRAIT_SWING;
            const sy = Math.sin(pos * Math.PI * 2) * 10;
            portrait.style.setProperty('--sx', sx.toFixed(2) + 'vw');
            portrait.style.setProperty('--sy', sy.toFixed(1) + 'px');

            // Each chapter shows its own photo, cross-fading on the same curve
            // as the scenes. Hidden sets are taken out of painting entirely.
            portraitSets.forEach((set, i) => {
                const op = clamp(1 - Math.abs(i - pos), 0, 1);
                set.style.opacity = op.toFixed(3);
                set.style.visibility = op > 0.01 ? 'visible' : 'hidden';
            });
        }
    }

    // Chapter nav jumps to that chapter
    routeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const target = chapters[idx];
            if (!target) return;
            const y = window.scrollY + target.getBoundingClientRect().top + 4;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    });

    // Called directly rather than gated behind rAF: it only measures a handful
    // of elements, and an rAF gate freezes the scrub when frames are throttled.
    window.addEventListener('scroll', updateScrub, { passive: true });
    window.addEventListener('resize', updateScrub);
    updateScrub();

    // Build the falling-code scene
    const codeScene = document.getElementById('scene-code');
    if (codeScene && !prefersReducedMotion) {
        const glyphs = '01{}<>/;=()[]$#&*+-_'.split('');
        const columns = Math.min(26, Math.floor(window.innerWidth / 58));
        for (let i = 0; i < columns; i++) {
            const col = document.createElement('span');
            col.className = 'rain';
            let text = '';
            for (let j = 0; j < 42; j++) {
                text += glyphs[Math.floor(Math.random() * glyphs.length)] + '\n';
            }
            col.textContent = text;
            col.style.left = (i / columns) * 100 + '%';
            col.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's';
            col.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
            col.style.opacity = (0.25 + Math.random() * 0.55).toFixed(2);
            codeScene.appendChild(col);
        }
    }
}


// --- 3. Scroll Reveal Animation ---
const reveals = document.querySelectorAll('.reveal');

function checkReveal() {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;

    reveals.forEach(reveal => {
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
            reveal.classList.add('active');
        }
    });
}

window.addEventListener('scroll', checkReveal, { passive: true });
checkReveal();


// --- 4. Global Scroll Progress Bar ---
const progressBar = document.getElementById('scroll-progress');
function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();


// --- 5. Mobile Menu Toggle ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
}


// --- 6. Stat Count-Up ---
const statEls = document.querySelectorAll('.stat-value[data-count]');

function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

if ('IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    statEls.forEach(el => statObserver.observe(el));
} else {
    statEls.forEach(animateCount);
}


// --- 7. 3D Tilt + Spotlight on cards ---
if (!prefersReducedMotion && isFinePointer) {
    document.querySelectorAll('.tilt').forEach(card => {
        const maxTilt = 8;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            const rotY = (px - 0.5) * (maxTilt * 2);
            const rotX = (0.5 - py) * (maxTilt * 2);
            card.style.transform =
                `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
            card.style.setProperty('--mx', px * 100 + '%');
            card.style.setProperty('--my', py * 100 + '%');
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}


// --- 8. Canvas Particle Background (detail sections) ---
const canvas = document.getElementById('canvas-bg');

if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.type = Math.random() > 0.5 ? 'primary' : 'indigo';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            else if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            else if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = this.type === 'primary'
                ? 'rgba(56, 189, 248, 0.35)'
                : 'rgba(99, 102, 241, 0.35)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = (canvas.width * canvas.height) / 18000;
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 - distance / 1500})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
}
