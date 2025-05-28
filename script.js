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
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth - 6; // Subtract border width
    const aspectRatio = 800 / 600;
    
    const newWidth = Math.min(containerWidth, 800);
    const newHeight = newWidth / aspectRatio;
    
    canvas.setDimensions({
        width: newWidth,
        height: newHeight
    });
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
    document.getElementById('color-picker').addEventListener('change', function(e) {
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

// Initialize touch support
addTouchSupport(); 