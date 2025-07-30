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

    function getOptimalConnectionPoints(fromEl, toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const wrapperRect = flowchartWrapper.getBoundingClientRect();

        let start, end;

        if (toRect.top > fromRect.bottom) { // Connecting downwards
            start = { x: fromRect.left + fromRect.width / 2 - wrapperRect.left, y: fromRect.bottom - wrapperRect.top };
            end = { x: toRect.left + toRect.width / 2 - wrapperRect.left, y: toRect.top - wrapperRect.top };
        } else { // Connecting sideways
            const fromY = fromRect.top + fromRect.height / 2 - wrapperRect.top;
            const toY = toRect.top + toRect.height / 2 - wrapperRect.top;
            if (toRect.left > fromRect.right) { // To the right
                start = { x: fromRect.right - wrapperRect.left, y: fromY };
                end = { x: toRect.left - wrapperRect.left, y: toY };
            } else { // To the left
                start = { x: fromRect.left - wrapperRect.left, y: fromY };
                end = { x: toRect.right - wrapperRect.left, y: toY };
            }
        }
        return { start, end };
    }

    /**
     * NEW: Rewritten to draw orthogonal lines with arrowheads.
     */
    function drawAllConnections(time) {
        svg.innerHTML = ''; // Clear previous lines, but keep the <defs>
        const connections = storyData.times[time]?.connections || [];

        connections.forEach(conn => {
            const fromNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.from}"]`);
            const toNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.to}"]`);

            if (fromNode && toNode) {
                const { start, end } = getOptimalConnectionPoints(fromNode, toNode);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // Calculate waypoints for the orthogonal line
                const midY = start.y + (end.y - start.y) / 2;
                
                // Create the path string: M(ove) -> V(ertical lineto) -> H(orizontal lineto) -> V(ertical lineto)
                // This creates the clean right-angle connections.
                const pathData = `M ${start.x} ${start.y} V ${midY} H ${end.x} V ${end.y}`;

                line.setAttribute('d', pathData);
                // Apply the arrowhead marker to the end of the path
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
            animateLines(400);
        }
    });

    // Initial setup
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
