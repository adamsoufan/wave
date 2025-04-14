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
    const newMappingButton = document.querySelector('#new-mapping-button');
    const gestureItems = document.querySelectorAll('.gesture-item');
    const mappingSearch = document.querySelector('#mapping-search');
    let currentGestureBlock = null;

    // Handle mapping search functionality
    if (mappingSearch) {
        mappingSearch.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            
            gestureItems.forEach(item => {
                const itemText = item.textContent.toLowerCase();
                
                if (itemText.includes(searchValue) || itemText.trim() === '') {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Handle saved mappings selection
    if (gestureItems) {
        gestureItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                gestureItems.forEach(i => i.classList.remove('selected'));
                
                // Add selected class to clicked item
                item.classList.add('selected');
                
                // Update the name field with the selected mapping name
                const gestureName = document.querySelector('#gesture-name');
                if (gestureName) {
                    gestureName.value = item.textContent.trim();
                }
                
                // For demo purposes, simulate loading the mapping data
                // In a real app, you'd load actual data based on the selection
                if (item.textContent.includes('Wave')) {
                    // Simulate a wave gesture for the left hand
                    const leftHand = document.querySelector('.left-hand');
                    if (leftHand) {
                        // Clear any existing gesture
                        leftHand.classList.add('has-gesture');
                        let selectedGesture = leftHand.querySelector('.selected-gesture');
                        if (!selectedGesture) {
                            selectedGesture = document.createElement('div');
                            selectedGesture.classList.add('selected-gesture');
                            leftHand.appendChild(selectedGesture);
                        }
                        selectedGesture.textContent = '👋';
                        
                        // Update the preview circle
                        const previewCircle = document.querySelector('.gesture-preview-circle');
                        if (previewCircle) {
                            previewCircle.textContent = '👋';
                        }
                    }
                }
            });
        });
    }

    // Handle New Mapping button click
    if (newMappingButton) {
        newMappingButton.addEventListener('click', () => {
            // Clear the gesture name input
            const gestureName = document.querySelector('#gesture-name');
            if (gestureName) {
                gestureName.value = '';
            }
            
            // Reset macro selection
            const macroSelect = document.querySelector('#macro-select');
            if (macroSelect) {
                macroSelect.selectedIndex = 0;
            }
            
            // Reset gesture blocks
            gestureBlocks.forEach(block => {
                block.classList.remove('has-gesture');
                const selectedGesture = block.querySelector('.selected-gesture');
                if (selectedGesture) {
                    selectedGesture.remove();
                }
            });
            
            // Reset the gesture preview circle to default thumbs up
            const previewCircle = document.querySelector('.gesture-preview-circle');
            if (previewCircle) {
                previewCircle.textContent = '👍';
            }
            
            // Clear selection from all items in the gesture list
            document.querySelectorAll('.gesture-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
        });
    }

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
                    
                    // Update the gesture preview circle with the selected gesture
                    const previewCircle = document.querySelector('.gesture-preview-circle');
                    if (previewCircle) {
                        previewCircle.textContent = emoji;
                    }
                    
                    // Hide the popup
                    gestureSelectionPopup.classList.remove('active');
                }
            });
        });
    }

    // Macro Hub specific functionality
    const macroItems = document.querySelectorAll('.macro-item');
    const actionTypes = document.querySelectorAll('.action-type');
    const addActionButton = document.querySelector('.toggle-action-types');
    const actionList = document.querySelector('.action-list');
    const saveButton = document.querySelector('#save-button');
    const macroName = document.querySelector('#macro-name');
    let draggedItem = null;

    // Setup drag and drop for action list
    if (actionList) {
        // Add event delegation for drag events on the action list
        actionList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('action-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                setTimeout(() => {
                    e.target.style.opacity = '0.4';
                }, 0);
            }
        });

        actionList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('action-item')) {
                e.target.classList.remove('dragging');
                e.target.style.opacity = '1';
                draggedItem = null;
            }
        });

        actionList.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedItem) return;
            
            const list = actionList;
            const items = Array.from(list.querySelectorAll('.action-item:not(.dragging)'));
            
            let closestItem = null;
            let closestDistance = Number.NEGATIVE_INFINITY;
            
            const mouseY = e.clientY;
            
            items.forEach(item => {
                const box = item.getBoundingClientRect();
                const boxMiddleY = box.top + box.height / 2;
                const distance = mouseY - boxMiddleY;
                
                if (distance < 0 && distance > closestDistance) {
                    closestDistance = distance;
                    closestItem = item;
                }
            });
            
            if (closestItem) {
                list.insertBefore(draggedItem, closestItem);
            } else if (items.length > 0) {
                list.appendChild(draggedItem);
            }
        });
    }

    // Handle macro selection
    if (macroItems) {
        macroItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                macroItems.forEach(i => i.classList.remove('selected'));
                
                // Add selected class to clicked item
                item.classList.add('selected');
                
                // Set the macro name in the input field
                if (macroName) {
                    macroName.value = item.textContent.trim();
                }
            });
        });
    }

    // Create action input based on type
    function createActionInput(type) {
        const actionContainer = document.createElement('div');
        actionContainer.classList.add('action-item');
        actionContainer.draggable = true;
        
        // Add handle for dragging
        const dragHandle = document.createElement('div');
        dragHandle.classList.add('drag-handle');
        dragHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
        
        // Create the delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-action');
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', () => {
            actionContainer.remove();
        });
        
        // Create a wrapper for the action content
        const actionContent = document.createElement('div');
        actionContent.classList.add('action-content');
        
        // Different input types based on action type
        switch(type) {
            case 'keypress':
                // Create keypress capture input
                actionContent.innerHTML = `
                    <div style="font-weight: bold;">Key Press</div>
                    <div class="keypress-capture" tabindex="0">Click to record keypress</div>
                `;
                
                // Add event listener to capture keypress
                setTimeout(() => {
                    const keyCapture = actionContainer.querySelector('.keypress-capture');
                    if (keyCapture) {
                        // Track active keys
                        const activeKeys = new Set();
                        let isRecording = false;
                        
                        keyCapture.addEventListener('click', () => {
                            if (!isRecording) {
                                // Reset and start recording
                                activeKeys.clear();
                                isRecording = true;
                                keyCapture.textContent = 'Press key combination...';
                                keyCapture.classList.add('recording');
                                keyCapture.focus();
                            }
                        });
                        
                        keyCapture.addEventListener('keydown', (e) => {
                            e.preventDefault();
                            
                            if (!isRecording) return;
                            
                            // Format the key name
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
                                
                                // Update the display
                                const keyCombination = Array.from(activeKeys).join('+');
                                keyCapture.textContent = keyCombination;
                            }
                        });
                        
                        keyCapture.addEventListener('keyup', (e) => {
                            // Don't end recording on modifier key release
                            if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
                                return;
                            }
                            
                            // End recording on other key releases
                            if (isRecording) {
                                isRecording = false;
                                keyCapture.classList.remove('recording');
                            }
                        });
                        
                        keyCapture.addEventListener('blur', () => {
                            if (isRecording) {
                                isRecording = false;
                                keyCapture.classList.remove('recording');
                                
                                if (activeKeys.size === 0) {
                                    keyCapture.textContent = 'Click to record keypress';
                                }
                            }
                        });
                    }
                }, 0);
                break;
                
            case 'script':
                // Create script upload input
                actionContent.innerHTML = `
                    <div style="font-weight: bold;">Script</div>
                    <div class="script-upload">
                        <button class="script-upload-button">Upload File</button>
                        <input type="file" style="display: none;" />
                    </div>
                `;
                
                // Add event listener for the file upload
                setTimeout(() => {
                    const uploadButton = actionContainer.querySelector('.script-upload-button');
                    const fileInput = actionContainer.querySelector('input[type="file"]');
                    
                    if (uploadButton && fileInput) {
                        uploadButton.addEventListener('click', () => {
                            fileInput.click();
                        });
                        
                        fileInput.addEventListener('change', (e) => {
                            if (e.target.files.length > 0) {
                                uploadButton.textContent = `Selected: ${e.target.files[0].name}`;
                            }
                        });
                    }
                }, 0);
                break;
                
            case 'command':
                // Create command line input
                actionContent.innerHTML = `
                    <div style="font-weight: bold;">Command Line</div>
                    <textarea class="command-input" placeholder="Enter command..."></textarea>
                `;
                break;
                
            default:
                return null;
        }
        
        // Assemble the action item components
        actionContainer.appendChild(dragHandle);
        actionContainer.appendChild(actionContent);
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

    // Handle save button for macros
    if (saveButton && macroName) {
        saveButton.addEventListener('click', () => {
            if (macroName.value) {
                alert(`Macro "${macroName.value}" saved successfully!`);
            } else {
                alert('Please enter a name for your macro.');
            }
        });
    }
});

