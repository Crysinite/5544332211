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

    // --- Flowchart Logic (MAJOR OVERHAUL) ---
    const flowchartWrapper = document.querySelector('.flowchart-wrapper');
    if (!flowchartWrapper) return;

    const tabButtons = document.querySelectorAll('.tab-button');
    const svg = document.querySelector('.connector-svg');
    let animationFrameId = null; // To control the animation loop

    /**
     * NEW: Smart connection point calculation.
     * This function determines the best place on each node to draw a line from/to,
     * preventing lines from clipping through the middle of nodes.
     */
    function getOptimalConnectionPoints(fromEl, toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const wrapperRect = flowchartWrapper.getBoundingClientRect();

        // Calculate center points
        const fromCx = fromRect.left + fromRect.width / 2;
        const toCy = toRect.top + toRect.height / 2;

        let start, end;

        // If 'to' node is mostly to the right of 'from' node
        if (toRect.left > fromRect.right) {
            start = { x: fromRect.right - wrapperRect.left, y: fromRect.top + fromRect.height / 2 - wrapperRect.top };
            end = { x: toRect.left - wrapperRect.left, y: toCy - wrapperRect.top };
        } 
        // If 'to' node is mostly to the left of 'from' node
        else if (toRect.right < fromRect.left) {
            start = { x: fromRect.left - wrapperRect.left, y: fromRect.top + fromRect.height / 2 - wrapperRect.top };
            end = { x: toRect.right - wrapperRect.left, y: toCy - wrapperRect.top };
        }
        // Otherwise, connect top-to-bottom (the default)
        else {
            start = { x: fromCx - wrapperRect.left, y: fromRect.bottom - wrapperRect.top };
            end = { x: toRect.left + toRect.width / 2 - wrapperRect.left, y: toRect.top - wrapperRect.top };
        }
        return { start, end };
    }

    /**
     * The main drawing function. It now uses the smart connection logic.
     */
    function drawAllConnections(time) {
        svg.innerHTML = ''; // Clear previous lines
        const connections = storyData.times[time]?.connections || [];

        connections.forEach(conn => {
            const fromNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.from}"]`);
            const toNode = flowchartWrapper.querySelector(`.flowchart-node[data-node-id="${conn.to}"]`);

            if (fromNode && toNode) {
                const { start, end } = getOptimalConnectionPoints(fromNode, toNode);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                // A bezier curve for a nice, smooth line
                const curve = `M ${start.x} ${start.y} C ${start.x} ${start.y + 50}, ${end.x} ${end.y - 50}, ${end.x} ${end.y}`;
                line.setAttribute('d', curve);
                svg.appendChild(line);
            }
        });
    }

    /**
     * NEW: Smooth animation loop using requestAnimationFrame.
     * This runs every frame for 400ms, creating the fluid line animation.
     */
    function animateLines(duration) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Cancel any ongoing animation
        }
        
        let startTime = null;
        const activeTime = document.querySelector('.tab-button.active')?.dataset.tab;

        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            drawAllConnections(activeTime); // Redraw on every frame

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animationStep);
            } else {
                animationFrameId = null; // Animation finished
            }
        }
        animationFrameId = requestAnimationFrame(animationStep);
    }
    
    // --- Event Listeners ---
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
            // Instead of a jerky setTimeout, start the smooth animation loop.
            animateLines(400); // Duration must match the CSS transition
        }
    });

    // Initial setup
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
