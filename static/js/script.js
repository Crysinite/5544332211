document.addEventListener('DOMContentLoaded', () => {
    // --- State & Elements ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const themeSpan = themeToggleButton?.querySelector('span');

    // --- Theme Toggler (Fixed & Simplified) ---
    function updateThemeUI(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeSpan) {
            themeSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    if (themeToggleButton) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        updateThemeUI(savedTheme || (prefersDark ? 'dark' : 'light'));

        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            updateThemeUI(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }


    // --- Flowchart Logic ---
    const flowchartWrapper = document.querySelector('.flowchart-wrapper');
    if (!flowchartWrapper) return; // Exit if not on a day page

    const tabButtons = document.querySelectorAll('.tab-button');
    const svg = document.querySelector('.connector-svg');
    const flags = new Set(); // Stores flags like "visited_cafe"

    function checkCondition(condition) {
        if (!condition || !condition.requires) return true; // No condition = always true
        return condition.requires.every(flag => flags.has(flag));
    }

    function updateFlowchartState(time) {
        const flowchartContainer = document.querySelector(`#flowchart-${time}`);
        if (!flowchartContainer) return;
    
        // Clear previous state
        svg.innerHTML = '';
        const nodes = flowchartContainer.querySelectorAll('.flowchart-node');
        const connections = storyData.times[time]?.connections || [];
    
        // First, determine node states (locked/unlocked)
        nodes.forEach(nodeEl => {
            const nodeId = nodeEl.dataset.nodeId;
            // Find all connections pointing to this node
            const incomingConnections = connections.filter(c => c.to === nodeId);
            const conditionalIncoming = incomingConnections.filter(c => c.condition);
    
            if (conditionalIncoming.length > 0) {
                // If there are conditional paths, check if any are met
                const isUnlocked = conditionalIncoming.some(c => checkCondition(c.condition));
                nodeEl.classList.toggle('locked', !isUnlocked);
            } else {
                // If no conditional paths lead here, it's never locked by conditions
                nodeEl.classList.remove('locked');
            }
        });
    
        // Then, draw connections for all unlocked paths
        connections.forEach(conn => {
            if (checkCondition(conn.condition)) {
                drawConnection(conn.from, conn.to);
            }
        });
    }

    function drawConnection(fromId, toId) {
        const fromNode = document.querySelector(`.flowchart-node[data-node-id="${fromId}"]`);
        const toNode = document.querySelector(`.flowchart-node[data-node-id="${toId}"]`);
        
        if (!fromNode || !toNode) return;

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const wrapperRect = flowchartWrapper.getBoundingClientRect();

        const startX = fromRect.left + fromRect.width / 2 - wrapperRect.left;
        let startY = fromRect.bottom - wrapperRect.top;
        const endX = toRect.left + toRect.width / 2 - wrapperRect.left;
        let endY = toRect.top - wrapperRect.top;

        // If the nodes are side-by-side, draw from the sides
        if(Math.abs(fromRect.top - toRect.top) < 50) { 
            startY = fromRect.top + fromRect.height / 2 - wrapperRect.top;
            endY = toRect.top + toRect.height / 2 - wrapperRect.top;
            const fromX = fromRect.right - wrapperRect.left;
            const toX = toRect.left - wrapperRect.left;
            const curve = `M ${fromX} ${startY} C ${fromX + 40} ${startY}, ${toX - 40} ${endY}, ${toX} ${endY}`;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', curve);
            svg.appendChild(line);
        } else { // Otherwise, draw from top/bottom
            const curve = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', curve);
            svg.appendChild(line);
        }
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
            
            // Re-evaluate the entire flowchart state for the active tab
            updateFlowchartState(time);
        });
    });

    // Expand/collapse node logic
    flowchartWrapper.addEventListener('click', (e) => {
        const node = e.target.closest('.flowchart-node');
        if (node && !node.classList.contains('locked')) {
            node.classList.toggle('is-open');

            // Find the node's data and set flag if it exists
            const nodeId = node.dataset.nodeId;
            const activeTime = document.querySelector('.tab-button.active')?.dataset.tab;
            const nodeData = storyData.times[activeTime]?.nodes.find(n => n.id === nodeId);
            if (nodeData && nodeData.sets_flag) {
                flags.add(nodeData.sets_flag);
            }
            
            // **THE FIX**: Redraw lines after the animation finishes
            // This is crucial. It waits for the node to expand/collapse before recalculating positions.
            setTimeout(() => {
                updateFlowchartState(activeTime);
            }, 400); // Must match CSS transition duration
        }
    });

    // Initial setup for the first tab
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});
