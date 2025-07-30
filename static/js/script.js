document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggler (Unchanged) ---
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const themeSpan = themeToggleButton.querySelector('span');
        const updateThemeUI = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            if (themeSpan) themeSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
        };
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        updateThemeUI(savedTheme);
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            updateThemeUI(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- Flowchart Logic ---
    const flowchartWrapper = document.querySelector('.flowchart-wrapper');
    if (!flowchartWrapper) return;

    const tabButtons = document.querySelectorAll('.tab-button');
    const svg = document.querySelector('.connector-svg');
    let animationFrameId = null;

    /**
     * THE FIX IS HERE: Rewritten path calculation logic.
     * This function now creates clean, orthogonal paths that avoid clipping.
     */
    function drawAllConnections(time) {
        // Clear all previous lines but leave the <defs> for the arrowhead
        const defs = svg.querySelector('defs');
        svg.innerHTML = '';
        if (defs) svg.appendChild(defs);

        const connections = storyData.times[time]?.connections || [];

        connections.forEach(conn => {
            const fromNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.from}"]`);
            const toNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.to}"]`);

            if (fromNode && toNode) {
                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();
                const wrapperRect = flowchartWrapper.getBoundingClientRect();

                // Determine start and end points
                const start = {
                    x: fromRect.left + fromRect.width / 2 - wrapperRect.left,
                    y: fromRect.bottom - wrapperRect.top
                };
                const end = {
                    x: toRect.left + toRect.width / 2 - wrapperRect.left,
                    y: toRect.top - wrapperRect.top
                };

                let pathData;

                // Check if the connection is between different rows
                if (toRect.top > fromRect.bottom) {
                    // This is the key logic. It creates a "channel" for the line to travel in.
                    const verticalGap = toRect.top - fromRect.bottom;
                    const halfVerticalGap = verticalGap / 2;

                    // The path goes:
                    // 1. Move from the start point vertically down into the channel.
                    // 2. Move horizontally to align with the end point's x-coordinate.
                    // 3. Move vertically from the channel to the end point.
                    pathData = `M ${start.x} ${start.y} V ${start.y + halfVerticalGap} H ${end.x} V ${end.y}`;
                } else {
                    // Fallback for any other type of connection (e.g., sideways)
                    const midX = start.x + (end.x - start.x) / 2;
                    pathData = `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`;
                }

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                line.setAttribute('d', pathData);
                line.setAttribute('marker-end', 'url(#arrowhead)');
                svg.appendChild(line);
            }
        });
    }

    function animateLines(duration) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        let startTime = null;
        const activeTime = document.querySelector('.tab-button.active')?.dataset.tab;

        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            drawAllConnections(activeTime);
            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animationStep);
            }
        }
        animationFrameId = requestAnimationFrame(animationStep);
    }
    
    // --- Event Listeners (Unchanged) ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const time = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.flowchart-container').forEach(container => {
                container.classList.toggle('active', container.id === `flowchart-${time}`);
            });
            
            setTimeout(() => drawAllConnections(time), 50);
        });
    });

    flowchartWrapper.addEventListener('click', (e) => {
        const node = e.target.closest('.flowchart-node');
        if (node) {
            node.classList.toggle('is-open');
            animateLines(400); // Duration must match the CSS transition
        }
    });

    // Initial setup
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
