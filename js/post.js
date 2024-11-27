// Configure marked for secure rendering
window.marked.setOptions({
    headerIds: false,
    mangle: false,
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
    }
});

async function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postPath = urlParams.get('post');
    
    if (!postPath) {
        window.location.href = 'index.html#blog';
        return;
    }

    try {
        const response = await fetch(postPath);
        if (!response.ok) throw new Error('Post not found');
        
        const markdown = await response.text();
        // Split only on the first two occurrences of '---'
        const parts = markdown.split('---', 3);
        if (parts.length < 3) throw new Error('Invalid post format');
        
        // The middle part is the front matter, the last part is the content
        const frontMatter = parts[1];
        const content = parts[2];
        
        const metadata = parseFrontMatter(frontMatter);
        const htmlContent = window.marked.parse(content);
        
        document.title = `${metadata.title} - Bartosz Górniak`;
        renderPost(metadata, htmlContent);
        
        // Highlight code blocks
        Prism.highlightAll();
    } catch (error) {
        console.error('Error loading post:', error);
        document.getElementById('blog-post').innerHTML = `
            <div class="error">
                <div class="prompt">[error]$ Post not found or failed to load</div>
                <a href="index.html#blog">Return to blog</a>
            </div>
        `;
    }
}

function parseFrontMatter(frontMatter) {
    const metadata = {};
    const lines = frontMatter.trim().split('\n');
    
    lines.forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
            let value = values.join(':').trim();
            if (key === 'tags') {
                value = value.split(',').map(tag => tag.trim());
            }
            metadata[key.trim()] = value;
        }
    });
    
    return metadata;
}

function renderPost(metadata, htmlContent) {
    const article = document.getElementById('blog-post');
    article.innerHTML = `
        <div class="post-header">
            <div class="post-date">${metadata.date}</div>
            <h1>${metadata.title}</h1>
            <p class="post-description">${metadata.description}</p>
            <div class="post-tags">
                ${metadata.tags ? metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
            </div>
        </div>
        <div class="post-content">${htmlContent}</div>
        <div class="post-footer">
            <a href="index.html#blog" class="back-link">
                <span class="prompt">[guest@bartoszgorniak.com ~]$ cd ../blog</span>
            </a>
        </div>
    `;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadPost);
