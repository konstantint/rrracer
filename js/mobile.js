document.addEventListener('DOMContentLoaded', function() {
    const leftBtn = document.getElementById('mobile-left');
    const rightBtn = document.getElementById('mobile-right');
    const backBtn = document.getElementById('mobile-back');

    if (!leftBtn || !rightBtn || !backBtn) {
        console.warn("Mobile controls not found in DOM");
        return;
    }

    function triggerKey(key, type) {
        if (!window.DIRECTOR || !window.DIRECTOR.scene) return;
        
        // Ensure KEY object is available, otherwise fallback to literals
        // KEY is defined in common.js
        
        if (type === 'down' && window.DIRECTOR.scene.keyDown) {
            window.DIRECTOR.scene.keyDown(key);
        } else if (type === 'up' && window.DIRECTOR.scene.keyUp) {
            window.DIRECTOR.scene.keyUp(key);
        }
    }

    function setupBtn(btn, key) {
        let isPressed = false;

        const start = (e) => {
            if (e.cancelable) e.preventDefault();
            // Allow multi-touch, but don't double-trigger if already pressed (e.g. mouse + touch)
            if (isPressed) return;
            isPressed = true;
            btn.classList.add('active');
            triggerKey(key, 'down');
        };
        const end = (e) => {
            if (e.cancelable) e.preventDefault();
            // Only trigger up if we were pressing it
            if (!isPressed) return;
            isPressed = false;
            btn.classList.remove('active');
            triggerKey(key, 'up');
        };

        btn.addEventListener('touchstart', start, {passive: false});
        btn.addEventListener('touchend', end, {passive: false});
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
    }

    // KEY values from common.js: LEFT: 37, RIGHT: 39, ESCAPE: 27
    setupBtn(leftBtn, 37); 
    setupBtn(rightBtn, 39);
    setupBtn(backBtn, 27);
});
