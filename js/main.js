// AMS Interventions - Main JavaScript

// Current tag filter; 'all' means no tag filter.
let activeTag = 'all';

function applyFilters() {
    const searchBox = document.getElementById('searchBox');
    const query = searchBox ? searchBox.value.trim().toLowerCase() : '';
    document.querySelectorAll('.intervention-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() ?? '';
        const description = card.querySelector('.description')?.textContent.toLowerCase() ?? '';
        const cardTags = card.getAttribute('data-tags') ?? '';

        const matchesSearch = !query || title.includes(query) || description.includes(query);
        const matchesTag = activeTag === 'all' || cardTags.split(/\s+/).includes(activeTag);

        card.style.display = matchesSearch && matchesTag ? '' : 'none';
    });
}

// Called from the search input's oninput/onkeyup handler.
function filterInterventions() {
    applyFilters();
}

// Called from filter tag buttons. Updates the active tag and re-applies filters.
function filterByTag(evt, tag) {
    activeTag = tag;
    document.querySelectorAll('.tag').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
    });
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
        evt.currentTarget.setAttribute('aria-pressed', 'true');
    }
    applyFilters();
}

// Print functionality
function printIntervention() {
    window.print();
}

// Smooth scroll to sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        // "#" alone (and anything without an id after it) is not a valid selector;
        // querySelector('#') throws. Links like the search trigger use href="#"
        // purely as a focusable affordance and are handled elsewhere.
        if (!href || href === '#' || href.length < 2) { return; }
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add "Back to Top" button when scrolling
let backToTopButton = null;

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        if (!backToTopButton) {
            backToTopButton = document.createElement('button');
            backToTopButton.innerHTML = '↑';
            backToTopButton.className = 'back-to-top';
            backToTopButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--tier-accent, #4A90E2);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            backToTopButton.onclick = () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            };
            document.body.appendChild(backToTopButton);
        }
        backToTopButton.style.display = 'block';
    } else if (backToTopButton) {
        backToTopButton.style.display = 'none';
    }
});

// Expandable sections (for detail pages)
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// Copy link to clipboard
function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('AMS Interventions Toolkit loaded');
    
    // Add any initialization code here
    
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});

