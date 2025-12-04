// AMS Interventions - Main JavaScript

// Search functionality for interventions
function filterInterventions() {
    const searchBox = document.getElementById('searchBox');
    const filter = searchBox.value.toLowerCase();
    const interventionCards = document.querySelectorAll('.intervention-card');
    
    interventionCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.description').textContent.toLowerCase();
        
        if (title.includes(filter) || description.includes(filter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter by tag functionality
function filterByTag(tag) {
    const interventionCards = document.querySelectorAll('.intervention-card');
    const tags = document.querySelectorAll('.tag');
    
    // Update active tag
    tags.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter cards
    if (tag === 'all') {
        interventionCards.forEach(card => {
            card.style.display = 'block';
        });
    } else {
        interventionCards.forEach(card => {
            const cardTags = card.getAttribute('data-tags');
            if (cardTags && cardTags.includes(tag)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Print functionality
function printIntervention() {
    window.print();
}

// Smooth scroll to sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
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
                background: #4A90E2;
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

// Accessibility: Skip to main content
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && e.target === document.body) {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.focus();
        }
    }
});
