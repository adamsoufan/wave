// Main renderer process JavaScript file for Electron application

// DOM Ready event handler
document.addEventListener('DOMContentLoaded', function() {
    // Setup sidebar toggle functionality
    setupSidebar();
    
    // Setup page-specific functionality based on current page
    setupPageSpecificFunctionality();

    // Setup IPC communication with the main process
    setupIpcCommunication();
});

// Sidebar functionality
function setupSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
            sidebar.classList.toggle('collapsed');
        });
    }
}

// Set up page-specific functionality
function setupPageSpecificFunctionality() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();

    if (pageName === 'index.html' || pageName === '') {
        // Main menu / gestures page functionality
        setupGesturesPage();
    } else if (pageName === 'mappinghub.html') {
        // Mapping Hub page functionality
        setupMappingHub();
    } else if (pageName === 'macrohub.html') {
        // Macro Hub page functionality
        setupMacroHub();
    }
}

// Setup IPC communication with main process
function setupIpcCommunication() {
    // Example of sending a message to the main process
    const sendMessageToMain = () => {
        window.api.send('message-from-renderer', 'Hello from the renderer process!');
    };

    // Example of receiving a message from the main process
    window.api.receive('message-from-main', (message) => {
        console.log('Received message from main process:', message);
    });

    // You can call sendMessageToMain() whenever you need to communicate with the main process
}

// Main menu / gestures page functionality
function setupGesturesPage() {
    const gestureGrid = document.querySelector('.gesture-grid');
    
    // Load saved mappings
    window.api.send('load-mappings');
    
    // Receive saved mappings from the main process
    window.api.receive('mappings-loaded', (loadedMappings) => {
        // Clear the existing grid
        gestureGrid.innerHTML = '';
        
        // Add mappings to the grid
        if (loadedMappings && loadedMappings.length > 0) {
            loadedMappings.forEach(mapping => {
                // Create gesture card
                const card = document.createElement('div');
                card.classList.add('gesture-card');
                
                // Gesture name
                const nameDIv = document.createElement('div');
                nameDIv.classList.add('gesture-name');
                nameDIv.textContent = mapping.name;
                card.appendChild(nameDIv);
                
                // Gesture icon
                const iconDiv = document.createElement('div');
                iconDiv.classList.add('gesture-icon');
                
                const circleIcon = document.createElement('div');
                circleIcon.classList.add('circle-icon');
                // Use the preview emoji or any available gesture
                circleIcon.textContent = mapping.previewEmoji || mapping.rightGesture || mapping.leftGesture || '👍';
                
                iconDiv.appendChild(circleIcon);
                card.appendChild(iconDiv);
                
                // Toggle container
                const toggleContainer = document.createElement('div');
                toggleContainer.classList.add('toggle-container');
                
                const toggleSwitch = document.createElement('div');
                toggleSwitch.classList.add('toggle-switch');
                // Set initial state
                if (mapping.enabled) {
                    toggleSwitch.classList.add('on');
                } else {
                    toggleSwitch.classList.add('off');
                }
                
                const onLabel = document.createElement('span');
                onLabel.classList.add('toggle-label');
                onLabel.textContent = 'ON';
                
                const offLabel = document.createElement('span');
                offLabel.classList.add('toggle-label');
                offLabel.textContent = 'OFF';
                
                const toggleSlider = document.createElement('div');
                toggleSlider.classList.add('toggle-slider');
                
                toggleSwitch.appendChild(onLabel);
                toggleSwitch.appendChild(offLabel);
                toggleSwitch.appendChild(toggleSlider);
                toggleContainer.appendChild(toggleSwitch);
                card.appendChild(toggleContainer);
                
                // Add the card to the grid
                gestureGrid.appendChild(card);
                
                // Add toggle functionality
                toggleSwitch.addEventListener('click', function() {
                    this.classList.toggle('on');
                    this.classList.toggle('off');
                    
                    // Send status change to main process
                    const isEnabled = this.classList.contains('on');
                    window.api.send('gesture-toggle', {
                        name: mapping.name,
                        enabled: isEnabled
                    });
                });
            });
        }
    });
}

// Mapping Hub page functionality
function setupMappingHub() {
    // Gesture selection popup functionality
    const gestureBlocks = document.querySelectorAll('.gesture-block');
    const gestureSelectionPopup = document.querySelector('.gesture-selection-popup');
    const closePopupButton = document.querySelector('.close-popup');
    const gestureIconItems = document.querySelectorAll('.gesture-icon-item');
    const newMappingButton = document.getElementById('new-mapping-button');
    const saveGestureButton = document.getElementById('save-gesture-button');
    const gestureName = document.getElementById('gesture-name');
    const macroSelect = document.getElementById('macro-select');
    const gestureList = document.querySelector('.gesture-list');
    
    // Track which gesture block is currently being edited
    let activeGestureBlock = null;
    
    // Load saved mappings when the page loads
    window.api.send('load-mappings');
    
    // Load saved macros for dropdown
    window.api.send('load-macros');
    
    // Receive saved macros from the main process
    window.api.receive('macros-loaded', (loadedMacros) => {
        // Clear the existing options
        macroSelect.innerHTML = '<option value="">Select a macro...</option>';
        
        // Add macros to the select
        if (loadedMacros && loadedMacros.length > 0) {
            loadedMacros.forEach(macro => {
                const option = document.createElement('option');
                option.value = macro.name;
                option.textContent = macro.name;
                macroSelect.appendChild(option);
            });
        }
    });
    
    // Receive saved mappings from the main process
    window.api.receive('mappings-loaded', (loadedMappings) => {
        // Clear the existing mapping list
        gestureList.innerHTML = '';
        
        // Add mappings to the list
        if (loadedMappings && loadedMappings.length > 0) {
            loadedMappings.forEach(mapping => {
                const mappingItem = document.createElement('div');
                mappingItem.classList.add('gesture-item');
                mappingItem.textContent = mapping.name;
                gestureList.appendChild(mappingItem);
                
                // Add click handler to select mapping
                mappingItem.addEventListener('click', function() {
                    // Remove selected class from all items
                    document.querySelectorAll('.gesture-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Add selected class to this item
                    this.classList.add('selected');
                    
                    // Load the mapping details
                    loadMappingDetails(mapping);
                });
            });
        }
    });
    
    // Function to load a mapping's details
    function loadMappingDetails(mapping) {
        // Set the mapping name
        gestureName.value = mapping.name;
        
        // Set the macro
        macroSelect.value = mapping.macro || '';
        
        // Set the gesture emojis
        const leftBlock = document.querySelector('.gesture-block.left-hand');
        const rightBlock = document.querySelector('.gesture-block.right-hand');
        
        if (leftBlock) {
            const plusIcon = leftBlock.querySelector('.gesture-plus-icon');
            if (plusIcon) {
                if (mapping.leftGesture) {
                    plusIcon.textContent = mapping.leftGesture;
                    plusIcon.classList.add('selected-gesture');
                } else {
                    plusIcon.textContent = '+';
                    plusIcon.classList.remove('selected-gesture');
                }
            }
        }
        
        if (rightBlock) {
            const plusIcon = rightBlock.querySelector('.gesture-plus-icon');
            if (plusIcon) {
                if (mapping.rightGesture) {
                    plusIcon.textContent = mapping.rightGesture;
                    plusIcon.classList.add('selected-gesture');
                } else {
                    plusIcon.textContent = '+';
                    plusIcon.classList.remove('selected-gesture');
                }
            }
        }
        
        // Update the preview
        const previewCircle = document.querySelector('.gesture-preview-circle');
        if (previewCircle) {
            // Use any selected gesture for the preview, prioritize right hand
            if (mapping.rightGesture) {
                previewCircle.textContent = mapping.rightGesture;
            } else if (mapping.leftGesture) {
                previewCircle.textContent = mapping.leftGesture;
            } else {
                previewCircle.textContent = '👍'; // Default emoji
            }
        }
        
        // Add a delete button if it doesn't exist
        let deleteButton = document.querySelector('.delete-mapping-button');
        if (!deleteButton) {
            deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-mapping-button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.backgroundColor = '#ff4d4d';
            
            // Insert after the save button
            saveGestureButton.parentNode.insertBefore(deleteButton, saveGestureButton.nextSibling);
            
            // Add click handler for the delete button
            deleteButton.addEventListener('click', function() {
                const mappingName = gestureName.value;
                if (mappingName && confirm(`Are you sure you want to delete the mapping "${mappingName}"?`)) {
                    window.api.send('delete-mapping', mappingName);
                    
                    // Clear the form
                    gestureName.value = '';
                    macroSelect.value = '';
                    
                    // Reset gesture blocks
                    gestureBlocks.forEach(block => {
                        const plusIcon = block.querySelector('.gesture-plus-icon');
                        if (plusIcon) {
                            plusIcon.textContent = '+';
                            plusIcon.classList.remove('selected-gesture');
                        }
                    });
                    
                    // Reset preview
                    const previewCircle = document.querySelector('.gesture-preview-circle');
                    if (previewCircle) {
                        previewCircle.textContent = '👍';
                    }
                }
            });
        }
    }
    
    if (gestureBlocks.length && gestureSelectionPopup) {
        // Open popup when a gesture block is clicked
        gestureBlocks.forEach(block => {
            block.addEventListener('click', function() {
                gestureSelectionPopup.style.display = 'block';
                activeGestureBlock = this;
            });
        });
        
        // Close popup
        if (closePopupButton) {
            closePopupButton.addEventListener('click', function() {
                gestureSelectionPopup.style.display = 'none';
            });
        }
        
        // Select a gesture icon
        if (gestureIconItems.length) {
            gestureIconItems.forEach(item => {
                item.addEventListener('click', function() {
                    const emoji = this.querySelector('.gesture-emoji').textContent;
                    
                    if (activeGestureBlock) {
                        // Replace the plus icon with the selected emoji
                        const plusIcon = activeGestureBlock.querySelector('.gesture-plus-icon');
                        if (plusIcon) {
                            plusIcon.textContent = emoji;
                            plusIcon.classList.add('selected-gesture');
                        }
                    }
                    
                    // Update the preview
                    const previewCircle = document.querySelector('.gesture-preview-circle');
                    if (previewCircle) {
                        previewCircle.textContent = emoji;
                    }
                    
                    // Close the popup
                    gestureSelectionPopup.style.display = 'none';
                });
            });
        }
    }
    
    // New mapping functionality
    if (newMappingButton) {
        newMappingButton.addEventListener('click', function() {
            // Clear the mapping name
            if (gestureName) {
                gestureName.value = '';
            }
            
            // Reset gesture blocks
            gestureBlocks.forEach(block => {
                const plusIcon = block.querySelector('.gesture-plus-icon');
                if (plusIcon) {
                    plusIcon.textContent = '+';
                    plusIcon.classList.remove('selected-gesture');
                }
            });
            
            // Reset preview
            const previewCircle = document.querySelector('.gesture-preview-circle');
            if (previewCircle) {
                previewCircle.textContent = '👍';
            }
            
            // Reset macro selection
            if (macroSelect) {
                macroSelect.value = '';
            }
            
            // Remove selected class from all items
            document.querySelectorAll('.gesture-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Remove the delete button if it exists
            const deleteButton = document.querySelector('.delete-mapping-button');
            if (deleteButton) {
                deleteButton.parentNode.removeChild(deleteButton);
            }
        });
    }
    
    // Save gesture mapping functionality
    if (saveGestureButton) {
        saveGestureButton.addEventListener('click', function() {
            const mappingName = gestureName.value;
            if (!mappingName) {
                alert('Please enter a name for the mapping');
                return;
            }
            
            const selectedMacro = macroSelect.value;
            if (!selectedMacro) {
                alert('Please select a macro');
                return;
            }
            
            // Get the gesture emojis
            const leftBlock = document.querySelector('.gesture-block.left-hand');
            const rightBlock = document.querySelector('.gesture-block.right-hand');
            
            let leftGesture = null;
            let rightGesture = null;
            
            if (leftBlock) {
                const plusIcon = leftBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    leftGesture = plusIcon.textContent;
                }
            }
            
            if (rightBlock) {
                const plusIcon = rightBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    rightGesture = plusIcon.textContent;
                }
            }
            
            // Ensure at least one gesture is selected
            if (!leftGesture && !rightGesture) {
                alert('Please select at least one gesture (left or right hand)');
                return;
            }
            
            // Get preview emoji for display
            const previewEmoji = document.querySelector('.gesture-preview-circle').textContent;
            
            // Send mapping data to main process
            window.api.send('save-gesture-mapping', {
                name: mappingName,
                macro: selectedMacro,
                leftGesture: leftGesture,
                rightGesture: rightGesture,
                previewEmoji: previewEmoji,
                enabled: true // New mappings are enabled by default
            });
            
            // The list will be updated when the mappings-loaded event is received
        });
    }

    // Search functionality for mappings
    const mappingSearch = document.getElementById('mapping-search');
    if (mappingSearch) {
        mappingSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const mappingItems = document.querySelectorAll('.gesture-item');
            
            mappingItems.forEach(item => {
                const mappingName = item.textContent.toLowerCase();
                if (mappingName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// Macro Hub page functionality
function setupMacroHub() {
    const actionList = document.querySelector('.action-list');
    const actionTypes = document.querySelector('.action-types');
    const newMacroButton = document.getElementById('new-macro-button');
    const macroNameInput = document.getElementById('macro-name');
    const saveButton = document.getElementById('save-button');
    const macroList = document.querySelector('.macro-list');
    
    // Load saved macros when the page loads
    window.api.send('load-macros');
    
    // Receive saved macros from the main process
    window.api.receive('macros-loaded', (loadedMacros) => {
        // Clear the existing macro list
        macroList.innerHTML = '';
        
        // Add macros to the list
        if (loadedMacros && loadedMacros.length > 0) {
            loadedMacros.forEach(macro => {
                const macroItem = document.createElement('div');
                macroItem.classList.add('macro-item');
                macroItem.textContent = macro.name;
                macroList.appendChild(macroItem);
                
                // Add click handler to select macro
                macroItem.addEventListener('click', function() {
                    // Remove selected class from all items
                    document.querySelectorAll('.macro-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Add selected class to this item
                    this.classList.add('selected');
                    
                    // Load the macro details
                    loadMacroDetails(macro);
                });
            });
        }
    });
    
    // Function to load a macro's details
    function loadMacroDetails(macro) {
        // Set the macro name
        macroNameInput.value = macro.name;
        
        // Add a delete button if it doesn't exist
        let deleteButton = document.querySelector('.delete-macro-button');
        if (!deleteButton) {
            deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-macro-button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.backgroundColor = '#ff4d4d';
            
            // Insert after the save button
            saveButton.parentNode.insertBefore(deleteButton, saveButton.nextSibling);
            
            // Add click handler for the delete button
            deleteButton.addEventListener('click', function() {
                const macroName = macroNameInput.value;
                if (macroName && confirm(`Are you sure you want to delete the macro "${macroName}"?`)) {
                    window.api.send('delete-macro', macroName);
                    
                    // Clear the form
                    macroNameInput.value = '';
                    actionList.innerHTML = '';
                }
            });
        }
        
        // Clear the action list
        actionList.innerHTML = '';
        
        // Add each action to the list
        if (macro.actions && macro.actions.length > 0) {
            macro.actions.forEach(action => {
                addActionToList(action.type, actionList);
                
                // Set the action value
                const actionItem = actionList.lastElementChild;
                if (actionItem) {
                    if (action.type === 'keypress') {
                        const input = actionItem.querySelector('input');
                        if (input) input.value = action.value;
                    } else if (action.type === 'command') {
                        const textarea = actionItem.querySelector('textarea');
                        if (textarea) textarea.value = action.value;
                    } else if (action.type === 'script') {
                        const fileDisplay = actionItem.querySelector('.file-name-display');
                        if (fileDisplay) fileDisplay.textContent = action.value || 'No file chosen';
                    }
                }
            });
            
            // Initialize drag-and-drop
            initDragAndDrop();
            
            // Setup key press handlers
            setupKeyPressHandlers();
        }
    }
    
    // Add click handlers to macro items
    if (macroList) {
        const macroItems = macroList.querySelectorAll('.macro-item');
        macroItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove selected class from all items
                macroItems.forEach(i => i.classList.remove('selected'));
                
                // Add selected class to this item
                this.classList.add('selected');
                
                // Get the macro name
                const macroName = this.textContent;
                
                // Request the macro details from the main process
                window.api.send('load-macros');
            });
        });
    }
    
    // Clear actions when New Macro is clicked
    if (newMacroButton && actionList && macroNameInput) {
        newMacroButton.addEventListener('click', function() {
            // Clear the action list
            actionList.innerHTML = '';
            
            // Clear the macro name
            macroNameInput.value = '';
            
            // Remove selected class from any macro item
            document.querySelectorAll('.macro-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Remove the delete button if it exists
            const deleteButton = document.querySelector('.delete-macro-button');
            if (deleteButton) {
                deleteButton.parentNode.removeChild(deleteButton);
            }
        });
    }
    
    // Action type selection
    const actionTypeElements = document.querySelectorAll('.action-type');
    if (actionTypeElements.length && actionList) {
        actionTypeElements.forEach(actionType => {
            actionType.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                addActionToList(type, actionList);
                
                // Initialize drag-and-drop after adding a new action
                initDragAndDrop();
            });
        });
    }
    
    // Setup key press handlers for any existing action items
    setupKeyPressHandlers();
    
    // Set up drag-and-drop functionality
    initDragAndDrop();
    
    // Save macro functionality
    if (saveButton && macroNameInput) {
        saveButton.addEventListener('click', function() {
            const macroName = macroNameInput.value;
            if (!macroName) {
                alert('Please enter a name for the macro');
                return;
            }
            
            // Get all action items
            const actionItems = actionList.querySelectorAll('.action-item');
            const actions = Array.from(actionItems).map(item => {
                const type = item.getAttribute('data-type');
                let value = '';
                
                // Handle different types of input elements
                if (type === 'command') {
                    const textarea = item.querySelector('textarea');
                    value = textarea ? textarea.value : '';
                } else if (type === 'script') {
                    const fileDisplay = item.querySelector('.file-name-display');
                    value = fileDisplay ? fileDisplay.textContent : '';
                    // Don't save "No file chosen" as a value
                    if (value === 'No file chosen') value = '';
                } else {
                    const input = item.querySelector('input');
                    value = input ? input.value : '';
                }
                
                return { type, value };
            });
            
            // Send to main process
            window.api.send('save-macro', {
                name: macroName,
                actions: actions
            });
            
            // The list will be updated when the macros-loaded event is received
        });
    }

    // Search functionality for macros
    const macroSearch = document.getElementById('macro-search');
    if (macroSearch) {
        macroSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const macroItems = document.querySelectorAll('.macro-item');
            
            macroItems.forEach(item => {
                const macroName = item.textContent.toLowerCase();
                if (macroName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// Initialize drag-and-drop functionality for action items
function initDragAndDrop() {
    const actionList = document.querySelector('.action-list');
    if (!actionList) return;
    
    const actionItems = actionList.querySelectorAll('.action-item');
    
    // Add drag handle and draggable attributes to action items
    actionItems.forEach(item => {
        // Skip if this item already has a drag handle
        if (item.querySelector('.drag-handle')) return;
        
        const actionHeader = item.querySelector('.action-header');
        if (actionHeader) {
            // Create and add drag handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
            actionHeader.insertBefore(dragHandle, actionHeader.firstChild);
            
            // Make the item draggable
            item.setAttribute('draggable', 'true');
            
            // Add drag event listeners
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        }
    });
}

// Drag-and-drop event handlers
let draggedItem = null;
let dragPosition = null;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    // Add a class to indicate dragging state
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Don't do anything if dragging over the original element
    if (this === draggedItem) {
        return false;
    }
    
    // Determine whether to show top or bottom indicator
    const rect = this.getBoundingClientRect();
    const mouseY = e.clientY;
    const threshold = rect.top + (rect.height / 2);
    
    // Remove previous indicators
    this.classList.remove('drag-over-top', 'drag-over-bottom');
    
    // Add appropriate indicator
    if (mouseY < threshold) {
        this.classList.add('drag-over-top');
        dragPosition = 'before';
    } else {
        this.classList.add('drag-over-bottom');
        dragPosition = 'after';
    }
    
    return false;
}

function handleDragEnter(e) {
    // We don't need the drag-over class anymore as we have more specific indicators
    // this.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Remove indicators when leaving an element
    this.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Don't do anything if dropping on the original element
    if (draggedItem === this) {
        return false;
    }
    
    const actionList = this.parentNode;
    
    // Insert according to the determined position
    if (dragPosition === 'before') {
        actionList.insertBefore(draggedItem, this);
    } else {
        if (this.nextSibling) {
            actionList.insertBefore(draggedItem, this.nextSibling);
        } else {
            actionList.appendChild(draggedItem);
        }
    }
    
    // Re-apply event listeners and setup after moving
    setupKeyPressHandlers();
    
    return false;
}

function handleDragEnd(e) {
    // Reset styles
    this.style.opacity = '1';
    this.classList.remove('dragging');
    
    // Remove all drop indicators
    document.querySelectorAll('.action-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

// Helper function to add an action to the action list
function addActionToList(type, actionList) {
    const actionItem = document.createElement('div');
    actionItem.classList.add('action-item');
    actionItem.setAttribute('data-type', type);
    
    let actionContent = '';
    
    switch (type) {
        case 'keypress':
            actionContent = `
                <div class="action-header">
                    <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
                    <span class="action-type-label">Key Press</span>
                    <button class="remove-action">×</button>
                </div>
                <div class="action-content">
                    <input type="text" class="key-capture-input" placeholder="Click to capture key combination" readonly>
                </div>
            `;
            break;
        case 'script':
            actionContent = `
                <div class="action-header">
                    <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
                    <span class="action-type-label">Script</span>
                    <button class="remove-action">×</button>
                </div>
                <div class="action-content">
                    <div class="file-upload-container">
                        <input type="file" id="file-${Date.now()}" class="file-input">
                        <label for="file-${Date.now()}" class="file-upload-button">Choose File</label>
                        <div class="file-name-display">No file chosen</div>
                    </div>
                </div>
            `;
            break;
        case 'command':
            actionContent = `
                <div class="action-header">
                    <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
                    <span class="action-type-label">Command Line</span>
                    <button class="remove-action">×</button>
                </div>
                <div class="action-content">
                    <textarea class="command-input" placeholder="Enter command"></textarea>
                </div>
            `;
            break;
    }
    
    actionItem.innerHTML = actionContent;
    actionList.appendChild(actionItem);
    
    // Make the item draggable
    actionItem.setAttribute('draggable', 'true');
    
    // Add drag event listeners
    actionItem.addEventListener('dragstart', handleDragStart);
    actionItem.addEventListener('dragover', handleDragOver);
    actionItem.addEventListener('dragenter', handleDragEnter);
    actionItem.addEventListener('dragleave', handleDragLeave);
    actionItem.addEventListener('drop', handleDrop);
    actionItem.addEventListener('dragend', handleDragEnd);
    
    // Add event listener to remove button
    const removeButton = actionItem.querySelector('.remove-action');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            actionList.removeChild(actionItem);
        });
    }
    
    // Set up key press capture for keypress type
    if (type === 'keypress') {
        setupKeyPressHandlerForInput(actionItem.querySelector('.key-capture-input'));
    }
    
    // Set up file input handling for script type
    if (type === 'script') {
        const fileInput = actionItem.querySelector('.file-input');
        const fileLabel = actionItem.querySelector('.file-upload-button');
        const fileNameDisplay = actionItem.querySelector('.file-name-display');
        
        // Fix the for attribute of the label
        fileLabel.setAttribute('for', fileInput.id);
        
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = 'No file chosen';
            }
        });
    }
    
    // Auto-resize textarea for command input
    if (type === 'command') {
        const textarea = actionItem.querySelector('.command-input');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
}

// Helper function to set up key press handlers for all key capture inputs
function setupKeyPressHandlers() {
    document.querySelectorAll('.key-capture-input').forEach(input => {
        setupKeyPressHandlerForInput(input);
    });
}

// Helper function to set up key press capture for a specific input
function setupKeyPressHandlerForInput(input) {
    if (!input) return;
    
    let pressedKeys = new Set();
    let keyCombination = '';
    
    input.addEventListener('focus', function() {
        this.value = '';
        this.placeholder = 'Press key combination...';
        pressedKeys.clear();
        keyCombination = '';
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.placeholder = 'Click to capture key combination';
        }
    });
    
    input.addEventListener('keydown', function(e) {
        e.preventDefault();
        
        // Get the key name in a consistent format
        let keyName = e.key;
        
        // For special keys, use a more readable format
        if (keyName === ' ') keyName = 'Space';
        if (keyName === 'Control') keyName = 'Ctrl';
        if (keyName === 'Escape') keyName = 'Esc';
        if (keyName === 'ArrowUp') keyName = '↑';
        if (keyName === 'ArrowDown') keyName = '↓';
        if (keyName === 'ArrowLeft') keyName = '←';
        if (keyName === 'ArrowRight') keyName = '→';
        
        // Format the key to be more readable
        keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1).toLowerCase();
        
        // Add modifiers first
        if (e.ctrlKey && !pressedKeys.has('Ctrl')) pressedKeys.add('Ctrl');
        if (e.shiftKey && !pressedKeys.has('Shift')) pressedKeys.add('Shift');
        if (e.altKey && !pressedKeys.has('Alt')) pressedKeys.add('Alt');
        if (e.metaKey && !pressedKeys.has('Meta')) pressedKeys.add('Meta');
        
        // Add the current key if it's not a modifier
        if (!['Ctrl', 'Shift', 'Alt', 'Meta'].includes(keyName)) {
            pressedKeys.add(keyName);
        }
        
        // Convert Set to Array for display
        const keysArray = Array.from(pressedKeys);
        keyCombination = keysArray.join(' + ');
        
        this.value = keyCombination;
    });
    
    // Add keyup to handle multi-key combinations better
    input.addEventListener('keyup', function(e) {
        // Do not clear the input on keyup, just update the pressed keys set
        // This allows for multi-key combinations
        
        // Get the key name in a consistent format
        let keyName = e.key;
        
        // For special keys, use a more readable format
        if (keyName === ' ') keyName = 'Space';
        if (keyName === 'Control') keyName = 'Ctrl';
        if (keyName === 'Escape') keyName = 'Esc';
        if (keyName === 'ArrowUp') keyName = '↑';
        if (keyName === 'ArrowDown') keyName = '↓';
        if (keyName === 'ArrowLeft') keyName = '←';
        if (keyName === 'ArrowRight') keyName = '→';
        
        keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1).toLowerCase();
        
        // Let the value persist when keys are released
        // This ensures the combination stays visible
    });
} 