document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggler ---
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Set initial theme based on localStorage or system preference
    const currentTheme = localStorage.getItem('theme') || (prefersDark.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- Flowchart Logic ---
    const flowchartWrapper = document.querySelector('.flowchart-wrapper');
    if (!flowchartWrapper) return; // Only run on day pages

    const tabButtons = document.querySelectorAll('.tab-button');
    const containers = document.querySelectorAll('.flowchart-container');
    const svg = document.querySelector('.connector-svg');

    // Function to draw connecting lines
    function drawConnections(time) {
        // Clear previous lines
        svg.innerHTML = '';
        
        const connections = storyData.times[time]?.connections || [];
        if (connections.length === 0) return;

        connections.forEach(conn => {
            const fromNode = document.querySelector(`.flowchart-node[data-node-id="${conn.from}"]`);
            const toNode = document.querySelector(`.flowchart-node[data-node-id="${conn.to}"]`);

            if (fromNode && toNode) {
                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();
                const wrapperRect = flowchartWrapper.getBoundingClientRect();

                // Calculate line coordinates relative to the wrapper
                const startX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
                const startY = fromRect.bottom - wrapperRect.top;
                const endX = toRect.left + toRect.width / 2 - wrapperRect.left;
                const endY = toRect.top - wrapperRect.top;

                // Create SVG path for a smooth curve
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const curve = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                line.setAttribute('d', curve);
                svg.appendChild(line);
            }
        });
    }
    
    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Update button styles
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show the correct container
            containers.forEach(container => {
                container.classList.toggle('active', container.id === `flowchart-${tabName}`);
            });
            
            // Redraw lines for the active tab after a short delay for layout to settle
            setTimeout(() => drawConnections(tabName), 50);
        });
    });

    // Expand/collapse node logic using event delegation
    flowchartWrapper.addEventListener('click', (e) => {
        const node = e.target.closest('.flowchart-node');
        if (node) {
            node.classList.toggle('is-open');
            // Redraw lines when a node's size changes
            const activeTab = document.querySelector('.tab-button.active')?.dataset.tab;
            if(activeTab) {
                setTimeout(() => drawConnections(activeTab), 400); // Wait for CSS transition
            }
        }
    });

    // Initial setup: activate the first tab
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
