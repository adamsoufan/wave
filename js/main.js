// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    // Toggle sidebar collapse state
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Handle toggle switches with animation
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isOn = toggle.classList.contains('on');
            
            // Add transition class for animation
            toggle.classList.add('animating');
            
            // Toggle the on/off state
            toggle.classList.remove(isOn ? 'on' : 'off');
            toggle.classList.add(isOn ? 'off' : 'on');
            
            // Remove animation class after transition completes
            setTimeout(() => {
                toggle.classList.remove('animating');
            }, 300);
        });
    });
    
    // Optional: Add hover effects to gesture icons
    document.querySelectorAll('.circle-icon').forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.05)';
            icon.style.transition = 'transform 0.3s ease';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
        });
    });
});

