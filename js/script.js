import { projectsData } from './projectsData.js';
import { initNeuralGlow } from './neural-glow.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Render
    initNeuralGlow('neural-canvas');
    initHeroAnimation();
    initFilters(); // Handles initial render
    initScrollObserver();
    setCopyrightYear();
});

/* =========================================
   Projects & Filtering
   ========================================= */

// Render Projects
function renderProjects(data, container) {
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No projects found in this category.</div>';
        return;
    }

    data.forEach((project, index) => {
        // Use primary category for label or first in array
        const categoryLabels = project.categories ? project.categories.map(c => capitalize(c)).join(' / ') : getCategory(project.title);
        
        const card = document.createElement('article');
        card.className = 'project-card';
        // Add staggering animation delay
        card.style.animationDelay = `${index * 0.05}s`; 

        // GitHub Icons SVG
        const ghIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;
        const linkIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
        const serverIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;

        // Build Links
        let linksHtml = '';
        if (project.link) {
            linksHtml += `<a href="${project.link}" target="_blank" class="icon-link" aria-label="Live Demo">Live ${linkIcon}</a>`;
        }
        
        // Handle GitHub Links Logic
        if (project.githubLink && project.githubLinkBack) {
            // Both Exist: Split
            linksHtml += `<a href="${project.githubLink}" target="_blank" class="icon-link" aria-label="GitHub Frontend">Front ${ghIcon}</a>`;
            linksHtml += `<a href="${project.githubLinkBack}" target="_blank" class="icon-link" aria-label="GitHub Backend">Back ${serverIcon}</a>`;
        } else if (project.githubLink) {
            // Only Main Code
             linksHtml += `<a href="${project.githubLink}" target="_blank" class="icon-link" aria-label="GitHub Code">Code ${ghIcon}</a>`;
        } else if (project.githubLinkBack) {
            // Only Backend (Rare case)
             linksHtml += `<a href="${project.githubLinkBack}" target="_blank" class="icon-link" aria-label="GitHub Backend">Back ${serverIcon}</a>`;
        }

        card.innerHTML = `
            <div class="project-image-container">
                <img src="${project.imageSrc}" alt="${project.alt}" class="project-image" loading="lazy">
            </div>
            <div class="project-content">
                <div class="project-type">${categoryLabels}</div>
                <h3 class="project-title">${project.title}</h3>
                <div class="project-desc-short">${project.alt}</div>
                <div class="project-links">
                    ${linksHtml}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Helpers
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Categorization Helper (Fallbacks)
function getCategory(title) {
   return 'Web App';
}

function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const grid = document.getElementById('projects-grid');

    // Initial render
    renderProjects(projectsData, grid);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI State
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');

            // 1. Fade Out Grid
            grid.style.opacity = '0';
            
            // 2. Wait for transition, then update data & Fade In
            setTimeout(() => {
                let filteredData = [];
                
                if (filter === 'all') {
                    filteredData = projectsData;
                } else {
                    filteredData = projectsData.filter(p => {
                        // Check if project.categories includes the filter
                        if (p.categories) {
                            return p.categories.includes(filter);
                        }
                        // Fallback to title check if categories missing (robustness)
                        return p.title.toLowerCase().includes(filter);
                    });
                }
                
                renderProjects(filteredData, grid);
                grid.style.opacity = '1';
                
            }, 300); // Must match CSS transition duration
        });
    });
}

/* =========================================
   Hero & UI Interactions
   ========================================= */
function initHeroAnimation() {
    // The CSS 'glitch' effect handles the loop. 
    // We can add a simple reveal for the subtitle.
    const subtitle = document.querySelector('.hero-subtitle');
    if(subtitle) {
        setTimeout(() => {
            subtitle.style.opacity = 1;
            subtitle.style.transform = 'translateY(0)';
        }, 1000);
    }
}

function setCopyrightYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-on-scroll').forEach(el => observer.observe(el));
}

function setVh() {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`
  );
}

setVh();
window.addEventListener('resize', setVh);