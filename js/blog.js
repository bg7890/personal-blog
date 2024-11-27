// Blog system configuration
const POSTS_PER_PAGE = 5;
let currentPage = 1;
let currentTag = null;
let currentCategory = null;
let allPosts = [];
let categories = [];

// Configure marked for secure rendering
window.marked.setOptions({
    headerIds: false,
    mangle: false,
    breaks: true,
    gfm: true
});

async function loadBlogPosts() {
    try {
        // Load posts metadata
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error('Failed to load posts metadata');
        const metadata = await response.json();
        
        // Store categories
        categories = metadata.categories;
        
        // Load all posts
        allPosts = [];
        for (const post of metadata.posts) {
            try {
                const loadedPost = await loadBlogPost(post.path);
                if (loadedPost) {
                    loadedPost.path = post.path;
                    loadedPost.featured = post.featured;
                    allPosts.push(loadedPost);
                }
            } catch (error) {
                console.error('Error loading post:', post.path, error);
            }
        }
        
        // Sort posts by date (newest first)
        allPosts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
        
        return allPosts;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        return [];
    }
}

async function loadBlogPost(postPath) {
    try {
        const response = await fetch(postPath);
        if (!response.ok) {
            console.error('Failed to load post:', postPath, response.status);
            return null;
        }
        const markdown = await response.text();
        
        // Parse front matter and content
        const parts = markdown.split('---').filter(part => part.trim());
        if (parts.length < 2) {
            console.error('Invalid post format:', postPath);
            return null;
        }
        
        const metadata = parseFrontMatter(parts[0]);
        const content = parts.slice(1).join('---');
        
        // Render the post using the global marked object
        const htmlContent = window.marked.parse(content);
        return { metadata, htmlContent };
    } catch (error) {
        console.error('Error loading blog post:', postPath, error);
        return null;
    }
}

function parseFrontMatter(frontMatter) {
    const metadata = {};
    const lines = frontMatter.trim().split('\n');
    
    lines.forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
            let value = values.join(':').trim();
            // Parse arrays
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim());
            }
            metadata[key.trim()] = value;
        }
    });
    
    return metadata;
}

function createBlogPostElement(metadata, htmlContent, postPath) {
    const article = document.createElement('article');
    article.className = 'blog-post';
    
    const date = document.createElement('div');
    date.className = 'post-date';
    date.textContent = metadata.date;
    
    const title = document.createElement('h3');
    title.className = 'post-title';
    title.textContent = metadata.title;
    
    const description = document.createElement('p');
    description.className = 'post-description';
    description.textContent = metadata.description;
    
    // Create a wrapper for the clickable content
    const clickableWrapper = document.createElement('div');
    clickableWrapper.className = 'post-clickable';
    clickableWrapper.onclick = () => {
        window.location.href = `post.html?post=${encodeURIComponent(postPath)}`;
    };
    
    const tags = document.createElement('div');
    tags.className = 'post-tags';
    if (Array.isArray(metadata.tags)) {
        metadata.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            span.onclick = (e) => {
                e.stopPropagation(); // Prevent triggering the post navigation
                filterByTag(tag);
            };
            tags.appendChild(span);
        });
    }
    
    // Add elements to the clickable wrapper
    clickableWrapper.appendChild(date);
    clickableWrapper.appendChild(title);
    clickableWrapper.appendChild(description);
    
    // Add elements to the article
    article.appendChild(clickableWrapper);
    article.appendChild(tags);
    
    return article;
}

function createTagFilter(posts) {
    const tagFilter = document.createElement('div');
    tagFilter.className = 'tag-filter';
    
    // Add category filter
    const categorySelect = document.createElement('select');
    categorySelect.className = 'category-select';
    categorySelect.innerHTML = `
        <option value="">All Categories</option>
        ${categories.map(cat => `
            <option value="${cat.name.toLowerCase()}">${cat.name}</option>
        `).join('')}
    `;
    categorySelect.value = currentCategory || '';
    categorySelect.onchange = (e) => filterByCategory(e.target.value);
    
    // Get all unique tags
    const allTags = new Set();
    posts.forEach(post => {
        if (Array.isArray(post.metadata.tags)) {
            post.metadata.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    // Create tag cloud
    const tagCloud = document.createElement('div');
    tagCloud.className = 'tag-cloud';
    [...allTags].sort().forEach(tag => {
        const tagCount = posts.filter(post => 
            Array.isArray(post.metadata.tags) && 
            post.metadata.tags.includes(tag)
        ).length;
        
        const span = document.createElement('span');
        span.className = 'tag' + (currentTag === tag ? ' active' : '');
        span.textContent = `${tag} (${tagCount})`;
        span.onclick = () => filterByTag(tag);
        tagCloud.appendChild(span);
    });
    
    tagFilter.appendChild(categorySelect);
    tagFilter.appendChild(tagCloud);
    return tagFilter;
}

function createPagination(totalPosts) {
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    if (totalPages > 1) {
        // Previous button
        if (currentPage > 1) {
            const prev = document.createElement('button');
            prev.textContent = 'Previous';
            prev.onclick = () => changePage(currentPage - 1);
            pagination.appendChild(prev);
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => changePage(i);
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        if (currentPage < totalPages) {
            const next = document.createElement('button');
            next.textContent = 'Next';
            next.onclick = () => changePage(currentPage + 1);
            pagination.appendChild(next);
        }
    }
    
    return pagination;
}

function filterByCategory(category) {
    currentCategory = category;
    currentTag = null;
    currentPage = 1;
    renderBlog();
}

function filterByTag(tag) {
    currentTag = currentTag === tag ? null : tag;
    currentPage = 1;
    renderBlog();
}

function changePage(page) {
    currentPage = page;
    renderBlog();
}

async function renderBlog() {
    const blogSection = document.getElementById('blog');
    if (!blogSection) return;
    
    // Show loading state
    blogSection.innerHTML = '<div class="loading-text">Loading blog posts...</div>';
    
    try {
        if (allPosts.length === 0) {
            await loadBlogPosts();
        }
        
        // Filter posts by category and tag
        let filteredPosts = [...allPosts];
        
        if (currentCategory) {
            const categoryTags = categories.find(
                cat => cat.name.toLowerCase() === currentCategory
            )?.tags || [];
            filteredPosts = filteredPosts.filter(post => 
                Array.isArray(post.metadata.tags) &&
                post.metadata.tags.some(tag => categoryTags.includes(tag))
            );
        }
        
        if (currentTag) {
            filteredPosts = filteredPosts.filter(post => 
                Array.isArray(post.metadata.tags) &&
                post.metadata.tags.includes(currentTag)
            );
        }
        
        // Create blog grid
        const blogGrid = document.createElement('div');
        blogGrid.className = 'blog-grid';
        
        // Show featured posts first if no filters are active
        if (!currentTag && !currentCategory) {
            const featuredPosts = filteredPosts.filter(post => post.featured);
            const regularPosts = filteredPosts.filter(post => !post.featured);
            filteredPosts = [...featuredPosts, ...regularPosts];
        }
        
        // Pagination
        const start = (currentPage - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const paginatedPosts = filteredPosts.slice(start, end);
        
        if (paginatedPosts.length === 0) {
            blogGrid.innerHTML = '<div class="no-posts">No posts found</div>';
        } else {
            paginatedPosts.forEach(post => {
                const element = createBlogPostElement(post.metadata, post.htmlContent, post.path);
                if (post.featured) element.classList.add('featured');
                blogGrid.appendChild(element);
            });
        }
        
        // Clear and rebuild blog section
        blogSection.innerHTML = '';
        const tagFilter = createTagFilter(allPosts);
        const pagination = createPagination(filteredPosts.length);
        
        blogSection.appendChild(tagFilter);
        blogSection.appendChild(blogGrid);
        if (filteredPosts.length > POSTS_PER_PAGE) {
            blogSection.appendChild(pagination);
        }
    } catch (error) {
        console.error('Error rendering blog:', error);
        blogSection.innerHTML = '<div class="error">Failed to load blog posts</div>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', renderBlog);
