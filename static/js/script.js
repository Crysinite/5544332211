document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggler ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const themeSpan = themeToggleButton?.querySelector('span');

    function updateThemeUI(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeSpan) {
            themeSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    if (themeToggleButton) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
        updateThemeUI(savedTheme);

        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            updateThemeUI(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- Flowchart Logic (Simplified) ---
    const flowchartWrapper = document.querySelector('.flowchart-wrapper');
    if (!flowchartWrapper) return; // Exit if not on a day page

    const tabButtons = document.querySelectorAll('.tab-button');
    const svg = document.querySelector('.connector-svg');

    function drawAllConnections(time) {
        // Clear previous lines
        svg.innerHTML = '';
        
        const connections = storyData.times[time]?.connections || [];

        connections.forEach(conn => {
            const fromNode = document.querySelector(`.flowchart-node[data-node-id="${conn.from}"]`);
            const toNode = document.querySelector(`.flowchart-node[data-node-id="${conn.to}"]`);

            if (fromNode && toNode) {
                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();
                const wrapperRect = flowchartWrapper.getBoundingClientRect();

                const startX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
                const startY = fromRect.bottom - wrapperRect.top;
                const endX = toRect.left + toRect.width / 2 - wrapperRect.left;
                const endY = toRect.top - wrapperRect.top;

                // Create SVG path for a smooth curve
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const curve = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
                line.setAttribute('d', curve);
                svg.appendChild(line);
            }
        });
    }
    
    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const time = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.flowchart-container').forEach(container => {
                container.classList.toggle('active', container.id === `flowchart-${time}`);
            });
            
            // Redraw lines after a short delay for layout to settle
            setTimeout(() => drawAllConnections(time), 50);
        });
    });

    // Expand/collapse node logic
    flowchartWrapper.addEventListener('click', (e) => {
        const node = e.target.closest('.flowchart-node');
        if (node) {
            node.classList.toggle('is-open');
            const activeTime = document.querySelector('.tab-button.active')?.dataset.tab;
            
            // Redraw lines after the animation finishes to get correct positions
            setTimeout(() => {
                drawAllConnections(activeTime);
            }, 400); // Must match CSS transition duration
        }
    });

    // Initial setup for the first tab
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
