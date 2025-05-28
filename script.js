// Initialize variables
let canvas;
let isDrawing = false;
let currentMode = 'draw';
let currentColor = '#000000';
let currentWidth = 5;
let history = [];
let historyStep = -1;

// Initialize canvas when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    setupEventListeners();
    setupCustomCursor();
});

function initializeCanvas() {
    // Create fabric canvas
    canvas = new fabric.Canvas('drawing-canvas', {
        width: 800,
        height: 600,
        backgroundColor: 'white',
        isDrawingMode: true
    });

    // Set initial brush properties
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = currentWidth;

    // Save initial state
    saveState();

    // Handle canvas events for history
    canvas.on('path:created', function() {
        saveState();
    });

    // Resize canvas to fit container
    resizeCanvas();
    
    // Debounce function for resize
    let resizeTimeout;
    function debounceResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 250);
    }
    
    window.addEventListener('resize', debounceResize);
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth - 6; // Subtract border width
    const aspectRatio = 4 / 3; // 4:3 aspect ratio for better drawing experience
    
    // Use full container width up to a maximum
    const maxWidth = 1200;
    const newWidth = Math.min(containerWidth, maxWidth);
    const newHeight = newWidth / aspectRatio;
    
    canvas.setDimensions({
        width: newWidth,
        height: newHeight
    });
    
    // Center the canvas if it's smaller than container
    const canvasElement = canvas.getElement();
    if (newWidth < containerWidth) {
        canvasElement.style.margin = '0 auto';
    }
}

function setupEventListeners() {
    // Undo button
    document.getElementById('undo-btn').addEventListener('click', undo);
    
    // Redo button
    document.getElementById('redo-btn').addEventListener('click', redo);
    
    // Draw button
    document.getElementById('draw-btn').addEventListener('click', function() {
        setMode('draw');
    });
    
    // Eraser button
    document.getElementById('eraser-btn').addEventListener('click', function() {
        setMode('eraser');
    });
    
    // Color picker
    document.getElementById('color-picker').addEventListener('input', function(e) {
        currentColor = e.target.value;
        if (currentMode === 'draw') {
            canvas.freeDrawingBrush.color = currentColor;
        }
    });
    
    // Brush size
    document.getElementById('brush-size').addEventListener('input', function(e) {
        currentWidth = parseInt(e.target.value);
        canvas.freeDrawingBrush.width = currentWidth;
        document.getElementById('brush-size-value').textContent = currentWidth;
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            canvas.clear();
            canvas.backgroundColor = 'white';
            saveState();
        }
    });
    
    // Download button
    document.getElementById('download-btn').addEventListener('click', downloadCanvas);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl/Cmd + Shift + Z for redo
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
            e.preventDefault();
            redo();
        }
        // Ctrl/Cmd + Y for redo (alternative)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    });
}

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (mode === 'draw') {
        document.getElementById('draw-btn').classList.add('active');
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = currentWidth;
    } else if (mode === 'eraser') {
        document.getElementById('eraser-btn').classList.add('active');
        canvas.freeDrawingBrush.color = 'white';
        canvas.freeDrawingBrush.width = currentWidth * 2; // Make eraser slightly bigger
    }
    
    // Update cursor if function exists
    if (typeof updateCursorPreview === 'function') {
        updateCursorPreview();
    }
}

function saveState() {
    // Remove any states after current step
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    
    // Add current state
    history.push(JSON.stringify(canvas.toJSON()));
    historyStep++;
    
    // Limit history to prevent memory issues
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }
    
    updateHistoryButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        loadState();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        loadState();
    }
}

function loadState() {
    canvas.loadFromJSON(history[historyStep], function() {
        canvas.renderAll();
        updateHistoryButtons();
    });
}

function updateHistoryButtons() {
    document.getElementById('undo-btn').disabled = historyStep <= 0;
    document.getElementById('redo-btn').disabled = historyStep >= history.length - 1;
    
    // Update button opacity for visual feedback
    document.getElementById('undo-btn').style.opacity = historyStep <= 0 ? '0.5' : '1';
    document.getElementById('redo-btn').style.opacity = historyStep >= history.length - 1 ? '0.5' : '1';
}

function downloadCanvas() {
    // Create a temporary link element
    const link = document.createElement('a');
    
    // Get canvas data as PNG
    link.href = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Higher resolution
    });
    
    // Set filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `drawing-${timestamp}.png`;
    
    // Trigger download
    link.click();
}

// Touch support for mobile devices
function addTouchSupport() {
    const canvasElement = document.getElementById('drawing-canvas');
    
    canvasElement.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvasElement.dispatchEvent(mouseEvent);
    }, { passive: true });
    
    canvasElement.addEventListener('touchmove', function(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvasElement.dispatchEvent(mouseEvent);
    }, { passive: true });
    
    canvasElement.addEventListener('touchend', function(e) {
        const mouseEvent = new MouseEvent('mouseup', {});
        canvasElement.dispatchEvent(mouseEvent);
    }, { passive: true });
}

// Custom cursor functionality
let updateCursorPreview; // Declare it in outer scope

function setupCustomCursor() {
    const canvasContainer = document.querySelector('.canvas-container');
    const cursorPreview = document.createElement('div');
    cursorPreview.id = 'cursor-preview';
    cursorPreview.style.cssText = `
        position: absolute;
        border: 2px solid rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        pointer-events: none;
        display: none;
        transform: translate(-50%, -50%);
        transition: width 0.1s, height 0.1s, background-color 0.1s;
        z-index: 1000;
    `;
    document.body.appendChild(cursorPreview);
    
    // Update cursor preview
    updateCursorPreview = function() {
        const size = currentMode === 'eraser' ? currentWidth * 2 : currentWidth;
        const color = currentMode === 'eraser' ? 'rgba(255, 255, 255, 0.8)' : currentColor;
        
        cursorPreview.style.width = size + 'px';
        cursorPreview.style.height = size + 'px';
        cursorPreview.style.backgroundColor = currentMode === 'eraser' ? color : 'transparent';
        cursorPreview.style.borderColor = currentMode === 'eraser' ? 'rgba(0, 0, 0, 0.3)' : color;
        cursorPreview.style.borderWidth = currentMode === 'eraser' ? '2px' : Math.max(2, size / 10) + 'px';
    }
    
    // Show/hide cursor on canvas hover
    const canvasElement = canvas.upperCanvasEl;
    
    canvasElement.addEventListener('mouseenter', function() {
        canvasElement.style.cursor = 'none';
        cursorPreview.style.display = 'block';
        updateCursorPreview();
    });
    
    canvasElement.addEventListener('mouseleave', function() {
        canvasElement.style.cursor = 'crosshair';
        cursorPreview.style.display = 'none';
    });
    
    // Track mouse movement
    canvasElement.addEventListener('mousemove', function(e) {
        const rect = canvasElement.getBoundingClientRect();
        cursorPreview.style.left = e.pageX + 'px';
        cursorPreview.style.top = e.pageY + 'px';
    });
    
    // Update cursor on color change
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('input', function() {
        updateCursorPreview();
    });
    
    // Update cursor on brush size change
    const brushSize = document.getElementById('brush-size');
    brushSize.addEventListener('input', function() {
        updateCursorPreview();
    });
    
    // Hide cursor during drawing
    canvas.on('mouse:down', function() {
        cursorPreview.style.opacity = '0.3';
    });
    
    canvas.on('mouse:up', function() {
        cursorPreview.style.opacity = '1';
    });
}

// Initialize touch support
addTouchSupport(); 