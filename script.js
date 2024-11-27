document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Terminal typing effect for prompts
    document.querySelectorAll('.prompt').forEach(prompt => {
        const originalText = prompt.textContent;
        prompt.textContent = '';
        let index = 0;

        function typeWriter() {
            if (index < originalText.length) {
                prompt.textContent += originalText.charAt(index);
                index++;
                setTimeout(typeWriter, Math.random() * 50 + 30); // Random delay for more realistic typing
            }
        }

        typeWriter();
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Contact form submission handler
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;

            if (name && email && message) {
                // Simulate terminal output
                const response = `[system@bartoszgorniak.com ~]$ Message received from ${name}\n> Email: ${email}\n> Status: Message sent successfully!`;
                alert(response);
                
                this.reset();
            } else {
                alert('[error]: Please fill out all fields.');
            }
        });
    }

    // Add hover effect for blog posts
    document.querySelectorAll('.blog-post').forEach(post => {
        post.addEventListener('mouseenter', () => {
            post.style.transform = 'translateY(-5px)';
            post.style.transition = 'transform 0.3s ease';
        });

        post.addEventListener('mouseleave', () => {
            post.style.transform = 'translateY(0)';
        });
    });
});
