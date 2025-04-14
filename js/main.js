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

    // Mapping Hub gesture functionality
    const gestureBlocks = document.querySelectorAll('.gesture-block');
    const gestureSelectionPopup = document.querySelector('.gesture-selection-popup');
    const closePopupButton = document.querySelector('.close-popup');
    const gestureIcons = document.querySelectorAll('.gesture-icon-item');
    let currentGestureBlock = null;

    // Show popup when a gesture block is clicked
    if (gestureBlocks && gestureSelectionPopup) {
        gestureBlocks.forEach(block => {
            block.addEventListener('click', () => {
                currentGestureBlock = block;
                gestureSelectionPopup.classList.add('active');
            });
        });
    }

    // Close the popup when close button is clicked
    if (closePopupButton && gestureSelectionPopup) {
        closePopupButton.addEventListener('click', () => {
            gestureSelectionPopup.classList.remove('active');
        });
    }

    // Select a gesture from the popup
    if (gestureIcons) {
        gestureIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                if (currentGestureBlock) {
                    // Get the selected emoji
                    const emoji = icon.querySelector('.gesture-emoji').textContent;
                    
                    // Check if the block already has a selected-gesture element
                    let selectedGesture = currentGestureBlock.querySelector('.selected-gesture');
                    
                    // If not, create one
                    if (!selectedGesture) {
                        selectedGesture = document.createElement('div');
                        selectedGesture.classList.add('selected-gesture');
                        currentGestureBlock.appendChild(selectedGesture);
                    }
                    
                    // Set the emoji and add the has-gesture class
                    selectedGesture.textContent = emoji;
                    currentGestureBlock.classList.add('has-gesture');
                    
                    // Hide the popup
                    gestureSelectionPopup.classList.remove('active');
                }
            });
        });
    }

    // Macro Hub specific functionality
    const macroItems = document.querySelectorAll('.macro-item');
    const actionTypes = document.querySelectorAll('.action-type');
    const addActionButton = document.querySelector('#add-action-button');
    const actionList = document.querySelector('.actions-list');
    const saveButton = document.querySelector('#save-macro');

    // Handle macro selection
    if (macroItems) {
        macroItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                macroItems.forEach(i => i.classList.remove('selected'));
                
                // Add selected class to clicked item
                item.classList.add('selected');
            });
        });
    }

    // Create action input based on type
    function createActionInput(type) {
        const actionContainer = document.createElement('div');
        actionContainer.classList.add('action-item');
        
        // Create the delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-action');
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', () => {
            actionContainer.remove();
        });
        
        // Different input types based on action type
        switch(type) {
            case 'key':
                // Create keypress capture input
                actionContainer.innerHTML = `
                    <span class="action-label">Key Press</span>
                    <div class="key-capture" tabindex="0">Click to capture key</div>
                `;
                
                // Add event listener to capture keypress
                const keyCapture = actionContainer.querySelector('.key-capture');
                if (keyCapture) {
                    keyCapture.addEventListener('keydown', (e) => {
                        e.preventDefault();
                        keyCapture.textContent = e.key;
                        keyCapture.blur();
                    });
                    
                    keyCapture.addEventListener('click', () => {
                        keyCapture.textContent = 'Press any key...';
                        keyCapture.focus();
                    });
                }
                break;
                
            case 'script':
                // Create script upload input
                actionContainer.innerHTML = `
                    <span class="action-label">Script</span>
                    <input type="file" class="script-upload" />
                `;
                break;
                
            case 'text':
                // Create text input
                actionContainer.innerHTML = `
                    <span class="action-label">Text</span>
                    <input type="text" class="text-input" placeholder="Enter text..." />
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

