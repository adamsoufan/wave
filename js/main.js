// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const hamburger = document.getElementById('hamburger');

    // Toggle sidebar collapse state
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Toggle sidebar with hamburger menu
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

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

    // Macro Hub specific functionality
    const macroItems = document.querySelectorAll('.macro-item');
    const actionTypes = document.querySelectorAll('.action-type');
    const addActionButton = document.querySelector('.add-action-button');
    const actionList = document.querySelector('.action-list');
    const saveButton = document.getElementById('save-button');

    // Handle macro selection
    if (macroItems) {
        macroItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                macroItems.forEach(i => i.classList.remove('selected'));
                // Add selected class to clicked item
                item.classList.add('selected');
                
                // You could load the macro details here
                document.getElementById('macro-name').value = item.textContent.trim();
            });
        });
    }

    // Create different action inputs based on type
    let scriptCounter = 0;
    
    // Helper function to create keypress capture elements
    function createKeypressCapture() {
        const keypressCapture = document.createElement('div');
        keypressCapture.className = 'keypress-capture';
        keypressCapture.innerHTML = 'Click to record keypress';
        keypressCapture.setAttribute('tabindex', '0'); // Make it focusable
        
        // Variable to store active modifiers
        let activeKeys = new Set();
        let isRecording = false;
        
        keypressCapture.addEventListener('click', function() {
            if (!isRecording) {
                isRecording = true;
                keypressCapture.innerHTML = 'Press keys now...';
                keypressCapture.classList.add('recording');
                keypressCapture.focus();
                
                // Clear previous keys
                activeKeys.clear();
            }
        });
        
        keypressCapture.addEventListener('keydown', function(e) {
            if (!isRecording) return;
            
            e.preventDefault();
            
            // Handle special keys and modifiers
            let keyName = '';
            
            switch(e.key) {
                case 'Control':
                    keyName = 'CTRL';
                    break;
                case 'Alt':
                    keyName = 'ALT';
                    break;
                case 'Shift':
                    keyName = 'SHIFT';
                    break;
                case 'Meta':
                    keyName = 'META';
                    break;
                case 'Escape':
                    keyName = 'ESC';
                    break;
                case ' ':
                    keyName = 'SPACE';
                    break;
                case 'ArrowUp':
                    keyName = 'UP';
                    break;
                case 'ArrowDown':
                    keyName = 'DOWN';
                    break;
                case 'ArrowLeft':
                    keyName = 'LEFT';
                    break;
                case 'ArrowRight':
                    keyName = 'RIGHT';
                    break;
                default:
                    keyName = e.key.toUpperCase();
            }
            
            // Add to active keys if not already present
            if (!activeKeys.has(keyName)) {
                activeKeys.add(keyName);
                
                // Update display
                updateKeypressDisplay();
            }
        });
        
        keypressCapture.addEventListener('keyup', function(e) {
            if (!isRecording) return;
            
            // End recording after key is released
            isRecording = false;
            keypressCapture.classList.remove('recording');
        });
        
        keypressCapture.addEventListener('blur', function() {
            isRecording = false;
            keypressCapture.classList.remove('recording');
            
            if (activeKeys.size === 0) {
                keypressCapture.innerHTML = 'Click to record keypress';
            }
        });
        
        function updateKeypressDisplay() {
            if (activeKeys.size > 0) {
                keypressCapture.innerHTML = Array.from(activeKeys).join('+');
            }
        }
        
        return keypressCapture;
    }
    
    function createActionInput(type) {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-item';
        
        // Add delete button to the common container
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-action';
        deleteButton.innerHTML = '&times;';
        deleteButton.title = 'Remove this action';
        
        deleteButton.addEventListener('click', function() {
            actionContainer.remove();
        });
        
        // Create inner content based on type
        switch(type) {
            case 'keypress': {
                const content = document.createElement('div');
                content.className = 'action-content';
                
                const label = document.createElement('div');
                label.textContent = 'Key Press';
                label.style.fontWeight = 'bold';
                content.appendChild(label);
                
                // Create keypress capture element
                const keypressCapture = createKeypressCapture();
                content.appendChild(keypressCapture);
                
                actionContainer.appendChild(content);
                break;
            }
                
            case 'script':
                const scriptId = `script-file-${scriptCounter++}`;
                actionContainer.innerHTML = `
                    <div class="action-content">
                        <div style="font-weight: bold;">Upload Script</div>
                        <div class="script-upload">
                            <button class="script-upload-button">Upload File</button>
                            <input type="file" id="${scriptId}" style="display: none;" />
                        </div>
                    </div>
                `;
                
                // Add event listener to the button to trigger file input
                setTimeout(() => {
                    const uploadButton = actionContainer.querySelector('.script-upload-button');
                    const fileInput = actionContainer.querySelector(`#${scriptId}`);
                    
                    uploadButton.addEventListener('click', () => {
                        fileInput.click();
                    });
                    
                    fileInput.addEventListener('change', (e) => {
                        if (e.target.files.length > 0) {
                            uploadButton.textContent = `Selected: ${e.target.files[0].name}`;
                        }
                    });
                }, 0);
                break;
                
            case 'command':
                actionContainer.innerHTML = `
                    <div class="action-content">
                        <div style="font-weight: bold;">Command Line</div>
                        <textarea class="command-input" placeholder="Enter command..."></textarea>
                    </div>
                `;
                break;
                
            default:
                return null;
        }
        
        // Append the delete button
        actionContainer.appendChild(deleteButton);
        return actionContainer;
    }

    // Handle action type selection
    if (actionTypes) {
        actionTypes.forEach(actionType => {
            actionType.addEventListener('click', () => {
                // Get the type of action from data attribute
                const type = actionType.getAttribute('data-type');
                
                // Create appropriate input based on action type
                const actionInput = createActionInput(type);
                
                if (actionInput && actionList) {
                    actionList.appendChild(actionInput);
                }
            });
        });
    }

    // Handle adding new actions
    if (addActionButton && actionList) {
        addActionButton.addEventListener('click', () => {
            // Toggle action types panel visibility
            const actionTypesPanel = document.querySelector('.action-types');
            if (actionTypesPanel) {
                actionTypesPanel.classList.toggle('active');
            }
        });
    }

    // Handle save button
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const macroName = document.getElementById('macro-name').value;
            if (macroName) {
                alert(`Macro "${macroName}" saved successfully!`);
            } else {
                alert('Please enter a name for your macro.');
            }
        });
    }
});

