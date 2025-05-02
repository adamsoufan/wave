// Main renderer process JavaScript file for Electron application

// Global variables to store data
let macros = [];
let mappings = [];
let currentMacroId = null;
let currentMappingId = null;

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
        loadMappings();
        setupGesturesPage();
    } else if (pageName === 'mappinghub.html') {
        // Mapping Hub page functionality
        loadMacros();
        loadMappings();
        setupMappingHub();
    } else if (pageName === 'macrohub.html') {
        // Macro Hub page functionality
        loadMacros();
        setupMacroHub();
    }
}

// Setup IPC communication with main process
function setupIpcCommunication() {
    // Listen for macros loaded
    window.api.receive('macros-loaded', (loadedMacros) => {
        macros = loadedMacros;
        updateMacrosList();
        updateMacroDropdown();
    });

    // Listen for mappings loaded
    window.api.receive('mappings-loaded', (loadedMappings) => {
        mappings = loadedMappings;
        updateMappingsList();
        updateGestureGrid();
    });

    // Listen for macro saved
    window.api.receive('macro-saved', (savedMacro) => {
        const existingIndex = macros.findIndex(m => m.id === savedMacro.id);
        if (existingIndex >= 0) {
            macros[existingIndex] = savedMacro;
        } else {
            macros.push(savedMacro);
        }
        updateMacrosList();
        updateMacroDropdown();
    });

    // Listen for mapping saved
    window.api.receive('mapping-saved', (savedMapping) => {
        const existingIndex = mappings.findIndex(m => m.id === savedMapping.id);
        if (existingIndex >= 0) {
            mappings[existingIndex] = savedMapping;
        } else {
            mappings.push(savedMapping);
        }
        updateMappingsList();
        updateGestureGrid();
    });

    // Listen for macro deleted
    window.api.receive('macro-deleted', (deletedMacroId) => {
        macros = macros.filter(m => m.id !== deletedMacroId);
        updateMacrosList();
        updateMacroDropdown();
    });

    // Listen for mapping deleted
    window.api.receive('mapping-deleted', (deletedMappingId) => {
        mappings = mappings.filter(m => m.id !== deletedMappingId);
        updateMappingsList();
        updateGestureGrid();
    });
}

// Load macros from main process
function loadMacros() {
    window.api.send('load-macros');
}

// Load mappings from main process
function loadMappings() {
    window.api.send('load-mappings');
}

// Update the macros list in the UI
function updateMacrosList() {
    const macroList = document.querySelector('.macro-list');
    if (!macroList) return;

    // Clear existing items
    macroList.innerHTML = '';

    // Create no-macros element with specific class
    const noMacrosDiv = document.createElement('div');
    noMacrosDiv.classList.add('no-macros-list');  // Changed from 'no-macros' to 'no-macros-list'
    noMacrosDiv.innerHTML = '<p>No macros found. Create a new macro to get started!</p>';
    noMacrosDiv.style.padding = '20px';
    noMacrosDiv.style.textAlign = 'center';
    noMacrosDiv.style.color = '#666';
    noMacrosDiv.style.display = macros.length === 0 ? 'block' : 'none';
    
    macroList.appendChild(noMacrosDiv);

    if (macros.length === 0) {
        return;
    }

    // Add macros to the list
    macros.forEach(macro => {
        const macroItem = document.createElement('div');
        macroItem.classList.add('macro-item');
        macroItem.textContent = macro.name;
        macroItem.dataset.id = macro.id;

        // Add click event to select the macro
        macroItem.addEventListener('click', () => {
            // Remove selected class from all items
            document.querySelectorAll('.macro-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Add selected class to clicked item
            macroItem.classList.add('selected');

            // Load macro details
            loadMacroDetails(macro);
        });

        macroList.appendChild(macroItem);
    });
}

// Update the mappings list in the UI
function updateMappingsList() {
    const gestureList = document.querySelector('.gesture-list');
    if (!gestureList) return;

    // Clear existing items
    gestureList.innerHTML = '';

    // Check for no-mappings element specifically in the gesture-list
    const noMappingsDiv = document.createElement('div');
    noMappingsDiv.classList.add('no-mappings-list');  // Changed from 'no-mappings' to 'no-mappings-list'
    noMappingsDiv.innerHTML = '<p>No mappings found. Create a new mapping to get started!</p>';
    noMappingsDiv.style.padding = '20px';
    noMappingsDiv.style.textAlign = 'center';
    noMappingsDiv.style.color = '#666';
    noMappingsDiv.style.display = mappings.length === 0 ? 'block' : 'none';
    
    gestureList.appendChild(noMappingsDiv);

    if (mappings.length === 0) {
        return;
    }

    // Add mappings to the list
    mappings.forEach(mapping => {
        const gestureItem = document.createElement('div');
        gestureItem.classList.add('gesture-item');
        gestureItem.textContent = mapping.name;
        gestureItem.dataset.id = mapping.id;

        // Add click event to select the mapping
        gestureItem.addEventListener('click', () => {
            // Remove selected class from all items
            document.querySelectorAll('.gesture-item').forEach(item => {
                item.classList.remove('selected');
            });

            // Add selected class to clicked item
            gestureItem.classList.add('selected');

            // Load mapping details
            loadMappingDetails(mapping);
        });

        gestureList.appendChild(gestureItem);
    });
}

// Update the macro dropdown in the mapping hub
function updateMacroDropdown() {
    const macroSelect = document.getElementById('macro-select');
    if (!macroSelect) return;

    // Save current selection
    const currentSelection = macroSelect.value;

    // Clear existing options
    macroSelect.innerHTML = '<option value="">Select a macro...</option>';

    // Add macros to the dropdown
    macros.forEach(macro => {
        const option = document.createElement('option');
        option.value = macro.id;
        option.textContent = macro.name;
        macroSelect.appendChild(option);
    });

    // Restore previous selection if possible
    if (currentSelection) {
        macroSelect.value = currentSelection;
    }
}

// Update the gesture grid on the home page
function updateGestureGrid() {
    const gestureGrid = document.querySelector('.gesture-grid');
    if (!gestureGrid) return;

    // Clear existing cards
    gestureGrid.innerHTML = '';

    // Show message if no mappings - with a more specific class name
    const noMappingsDiv = document.createElement('div');
    noMappingsDiv.classList.add('no-mappings-home');  // Changed from 'no-mappings' to 'no-mappings-home'
    noMappingsDiv.innerHTML = `
        <p>No gesture mappings found. Create some in the Mapping Hub!</p>
        <a href="mappinghub.html" class="create-mapping-button">Create Mapping</a>
    `;
    noMappingsDiv.style.display = mappings.length === 0 ? 'flex' : 'none';
    gestureGrid.appendChild(noMappingsDiv);

    if (mappings.length === 0) {
        return;
    }

    console.log('Updating gesture grid with mappings:', mappings);

    // Add mapping cards to the grid
    mappings.forEach(mapping => {
        const gestureCard = document.createElement('div');
        gestureCard.classList.add('gesture-card');
        
        // Determine which emoji to display (prefer left hand, then right hand, then default)
        const displayEmoji = mapping.emoji || 
                         (mapping.leftHand || mapping.rightHand || '👋');
        
        gestureCard.innerHTML = `
            <div class="gesture-name">${mapping.name}</div>
            <div class="gesture-icon">
                <div class="circle-icon">${displayEmoji}</div>
            </div>
            <div class="toggle-container">
                <div class="toggle-switch ${mapping.enabled ? 'on' : 'off'}" data-id="${mapping.id}">
                    <span class="toggle-label">ON</span>
                    <span class="toggle-label">OFF</span>
                    <div class="toggle-slider"></div>
                </div>
            </div>
        `;

        gestureGrid.appendChild(gestureCard);
    });

    // Add event listeners to toggle switches
    setupToggleSwitches();
}

// Main menu / gestures page functionality
function setupGesturesPage() {
    setupToggleSwitches();
}

// Setup toggle switches for gesture cards
function setupToggleSwitches() {
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    
    if (toggleSwitches.length) {
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', function() {
                this.classList.toggle('on');
                this.classList.toggle('off');
                
                // Get the mapping ID from the data attribute
                const mappingId = this.getAttribute('data-id');
                const isEnabled = this.classList.contains('on');
                
                // Send status change to main process
                window.api.send('gesture-toggle', {
                    id: mappingId,
                    enabled: isEnabled
                });
            });
        });
    }
}

// Load macro details into the editor
function loadMacroDetails(macro) {
    currentMacroId = macro.id;
    
    // Set macro name
    const macroNameInput = document.getElementById('macro-name');
    if (macroNameInput) {
        macroNameInput.value = macro.name;
    }

    // Load actions
    const actionList = document.querySelector('.action-list');
    if (actionList) {
        actionList.innerHTML = '';
        
        if (macro.actions && macro.actions.length) {
            macro.actions.forEach(action => {
                addActionToList(action.type, actionList, action);
            });
        }
    }

    // Initialize drag-and-drop for actions
    initDragAndDrop();
}

// Load mapping details into the editor
function loadMappingDetails(mapping) {
    currentMappingId = mapping.id;
    
    // Set mapping name
    const gestureName = document.getElementById('gesture-name');
    if (gestureName) {
        gestureName.value = mapping.name;
    }

    // Set selected macro
    const macroSelect = document.getElementById('macro-select');
    if (macroSelect && mapping.macroId) {
        macroSelect.value = mapping.macroId;
    }

    // Update gesture blocks
    const leftHandBlock = document.querySelector('.gesture-block.left-hand');
    const rightHandBlock = document.querySelector('.gesture-block.right-hand');
    
    if (leftHandBlock && mapping.leftHand) {
        const plusIcon = leftHandBlock.querySelector('.gesture-plus-icon');
        if (plusIcon) {
            plusIcon.textContent = mapping.leftHand;
            plusIcon.classList.add('selected-gesture');
        }
    }
    
    if (rightHandBlock && mapping.rightHand) {
        const plusIcon = rightHandBlock.querySelector('.gesture-plus-icon');
        if (plusIcon) {
            plusIcon.textContent = mapping.rightHand;
            plusIcon.classList.add('selected-gesture');
        }
    }

    // Update preview
    const previewCircle = document.querySelector('.gesture-preview-circle');
    if (previewCircle) {
        previewCircle.textContent = mapping.emoji || '👍';
    }
}

// Mapping Hub page functionality
function setupMappingHub() {
    console.log("Setting up Mapping Hub...");
    
    // Make sure gesture blocks are displayed properly
    const gestureGrid = document.querySelector('.gestures-section .gesture-grid');
    if (gestureGrid) {
        // Force clear any content that might be interfering
        const noMappingsElements = gestureGrid.querySelectorAll('.no-mappings, .no-mappings-home, .no-mappings-list');
        noMappingsElements.forEach(el => el.remove());
        
        // Make sure we have both gesture blocks
        let leftHandBlock = gestureGrid.querySelector('.gesture-block.left-hand');
        let rightHandBlock = gestureGrid.querySelector('.gesture-block.right-hand');
        
        // If blocks don't exist, create them
        if (!leftHandBlock) {
            leftHandBlock = document.createElement('div');
            leftHandBlock.className = 'gesture-block left-hand';
            leftHandBlock.innerHTML = `
                <div class="hand-label">Left Hand</div>
                <div class="gesture-plus-icon">+</div>
            `;
            gestureGrid.appendChild(leftHandBlock);
        }
        
        if (!rightHandBlock) {
            rightHandBlock = document.createElement('div');
            rightHandBlock.className = 'gesture-block right-hand';
            rightHandBlock.innerHTML = `
                <div class="hand-label">Right Hand</div>
                <div class="gesture-plus-icon">+</div>
            `;
            gestureGrid.appendChild(rightHandBlock);
        }
        
        console.log("Gesture blocks initialized");
    }
    
    // Gesture selection popup functionality
    const gestureBlocks = document.querySelectorAll('.gesture-block');
    const gestureSelectionPopup = document.querySelector('.gesture-selection-popup');
    const closePopupButton = document.querySelector('.close-popup');
    const gestureIconItems = document.querySelectorAll('.gesture-icon-item');
    const newMappingButton = document.getElementById('new-mapping-button');
    const saveGestureButton = document.getElementById('save-gesture-button');
    
    // Track which gesture block is currently being edited
    let activeGestureBlock = null;
    
    if (gestureBlocks.length && gestureSelectionPopup) {
        // Ensure popup has the right initial state
        gestureSelectionPopup.style.display = 'none';
        
        // Open popup when a gesture block is clicked
        gestureBlocks.forEach(block => {
            block.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent any parent clicks
                // Position and show the popup
                gestureSelectionPopup.style.display = 'block';
                activeGestureBlock = this;
                
                // Log for debugging
                console.log('Gesture block clicked, showing popup');
            });
        });
        
        // Close popup
        if (closePopupButton) {
            closePopupButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent any parent clicks
                gestureSelectionPopup.style.display = 'none';
                console.log('Popup closed');
            });
        }
        
        // Close popup on click outside
        document.addEventListener('click', function(event) {
            if (!gestureSelectionPopup.contains(event.target) && 
                !Array.from(gestureBlocks).some(block => block.contains(event.target)) &&
                gestureSelectionPopup.style.display === 'block') {
                gestureSelectionPopup.style.display = 'none';
                console.log('Popup closed by outside click');
            }
        });
        
        // Select a gesture icon
        if (gestureIconItems.length) {
            gestureIconItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent the outside click handler from firing
                    const emoji = this.querySelector('.gesture-emoji').textContent;
                    console.log('Selected emoji:', emoji);
                    
                    if (activeGestureBlock) {
                        // Replace the plus icon with the selected emoji
                        const plusIcon = activeGestureBlock.querySelector('.gesture-plus-icon');
                        if (plusIcon) {
                            plusIcon.textContent = emoji;
                            plusIcon.classList.add('selected-gesture');
                            console.log('Applied emoji to gesture block');
                        }
                    }
                    
                    // Update the preview
                    const previewCircle = document.querySelector('.gesture-preview-circle');
                    if (previewCircle) {
                        previewCircle.textContent = emoji;
                        console.log('Updated preview circle');
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
            // Reset current mapping ID
            currentMappingId = null;

            // Clear name field
            const gestureName = document.getElementById('gesture-name');
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
            const macroSelect = document.getElementById('macro-select');
            if (macroSelect) {
                macroSelect.value = '';
            }

            // Remove selected class from all items
            document.querySelectorAll('.gesture-item').forEach(item => {
                item.classList.remove('selected');
            });
        });
    }
    
    // Save gesture functionality
    if (saveGestureButton) {
        saveGestureButton.addEventListener('click', function() {
            const gestureName = document.getElementById('gesture-name').value;
            const selectedMacro = document.getElementById('macro-select').value;
            const previewEmoji = document.querySelector('.gesture-preview-circle').textContent;
            
            if (!gestureName) {
                alert('Please enter a name for the mapping');
                return;
            }

            if (!selectedMacro) {
                alert('Please select a macro');
                return;
            }

            // Get gestures from blocks
            const leftHandBlock = document.querySelector('.gesture-block.left-hand');
            const rightHandBlock = document.querySelector('.gesture-block.right-hand');
            
            let leftHandGesture = '+';
            let rightHandGesture = '+';

            if (leftHandBlock) {
                const plusIcon = leftHandBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    leftHandGesture = plusIcon.textContent;
                }
            }
            
            if (rightHandBlock) {
                const plusIcon = rightHandBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    rightHandGesture = plusIcon.textContent;
                }
            }

            if (leftHandGesture === '+' && rightHandGesture === '+') {
                alert('Please select at least one gesture');
                return;
            }

            // Create mapping object
            const mapping = {
                id: currentMappingId || null,
                name: gestureName,
                macroId: selectedMacro,
                emoji: previewEmoji,
                leftHand: leftHandGesture !== '+' ? leftHandGesture : null,
                rightHand: rightHandGesture !== '+' ? rightHandGesture : null,
                enabled: true
            };
            
            // Send data to main process
            window.api.send('save-gesture-mapping', mapping);
            
            // Reset form after saving
            currentMappingId = mapping.id;
        });
    }
}

// Macro Hub page functionality
function setupMacroHub() {
    const actionTypes = document.querySelectorAll('.action-type');
    const newMacroButton = document.getElementById('new-macro-button');
    const macroNameInput = document.getElementById('macro-name');
    const saveButton = document.getElementById('save-button');
    
    // Clear actions when New Macro is clicked
    if (newMacroButton && macroNameInput) {
        newMacroButton.addEventListener('click', function() {
            // Reset current macro ID
            currentMacroId = null;

            // Clear the action list
            const actionList = document.querySelector('.action-list');
            if (actionList) {
                actionList.innerHTML = '';
            }
            
            // Clear the macro name
            macroNameInput.value = '';
            
            // Remove selected class from any macro item
            document.querySelectorAll('.macro-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
        });
    }
    
    // Action type selection
    if (actionTypes.length) {
        actionTypes.forEach(actionType => {
            actionType.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const actionList = document.querySelector('.action-list');
                
                if (actionList) {
                    addActionToList(type, actionList);
                    
                    // Initialize drag-and-drop after adding a new action
                    initDragAndDrop();
                }
            });
        });
    }
    
    // Save macro functionality
    if (saveButton && macroNameInput) {
        saveButton.addEventListener('click', function() {
            const macroName = macroNameInput.value;
            
            if (!macroName) {
                alert('Please enter a name for the macro');
                return;
            }

            // Get all actions from the action list
            const actionItems = document.querySelectorAll('.action-item');
            const actions = [];
            
            actionItems.forEach(item => {
                const type = item.getAttribute('data-type');
                
                let actionData = {
                    type: type
                };

                if (type === 'keypress') {
                    const keyInput = item.querySelector('input[type="text"]');
                    actionData.key = keyInput ? keyInput.value : '';
                } else if (type === 'command') {
                    const commandInput = item.querySelector('input[type="text"]');
                    actionData.command = commandInput ? commandInput.value : '';
                } else if (type === 'script') {
                    const scriptPath = item.querySelector('.script-path');
                    actionData.script = scriptPath ? scriptPath.textContent : '';
                }

                actions.push(actionData);
            });

            // Create macro object
            const macro = {
                id: currentMacroId || null,
                name: macroName,
                actions: actions
            };
            
            // Send data to main process
            window.api.send('save-macro', macro);
            
            // Update current macro ID
            currentMacroId = macro.id;
        });
    }
}

// Initialize drag and drop for action items
function initDragAndDrop() {
    const actionItems = document.querySelectorAll('.action-item');
    const actionList = document.querySelector('.action-list');
    
    if (!actionItems.length || !actionList) return;
    
    // Add event listeners for drag and drop
    actionItems.forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        
        // Add delete button functionality
        const deleteButton = item.querySelector('.action-delete');
        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                item.remove();
            });
        }
    });
}

// Drag and drop handlers
let dragSrcEl = null;

function handleDragStart(e) {
    // Add a class to indicate dragging
    this.classList.add('dragging');
    
    // Store the source element
    dragSrcEl = this;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    return false;
}

function handleDragEnter(e) {
    // Add a class to indicate a valid drop target
    this.classList.add('over');
}

function handleDragLeave(e) {
    // Remove the class when leaving a potential drop target
    this.classList.remove('over');
}

function handleDrop(e) {
    // Stop the browser from redirecting
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Only proceed if we're not dropping on the original element
    if (dragSrcEl != this) {
        // Get the action list
        const actionList = document.querySelector('.action-list');
        
        // Get all action items
        const items = Array.from(actionList.querySelectorAll('.action-item'));
        
        // Find the indices
        const fromIndex = items.indexOf(dragSrcEl);
        const toIndex = items.indexOf(this);
        
        // Remove the source element
        dragSrcEl.remove();
        
        // Insert the source element at the new position
        if (toIndex < items.length - 1) {
            this.insertAdjacentElement(toIndex > fromIndex ? 'afterend' : 'beforebegin', dragSrcEl);
        } else {
            actionList.appendChild(dragSrcEl);
        }
        
        // Add event listeners to the source element again
        dragSrcEl.addEventListener('dragstart', handleDragStart);
        dragSrcEl.addEventListener('dragover', handleDragOver);
        dragSrcEl.addEventListener('dragenter', handleDragEnter);
        dragSrcEl.addEventListener('dragleave', handleDragLeave);
        dragSrcEl.addEventListener('drop', handleDrop);
        dragSrcEl.addEventListener('dragend', handleDragEnd);
    }
    
    return false;
}

function handleDragEnd(e) {
    // Remove all drag-related classes
    this.classList.remove('dragging');
    
    document.querySelectorAll('.action-item').forEach(item => {
        item.classList.remove('over');
    });
}

// Add an action to the action list
function addActionToList(type, actionList, existingAction = null) {
    // Create action item
    const actionItem = document.createElement('div');
    actionItem.classList.add('action-item');
    actionItem.setAttribute('data-type', type);
    
    // Add common elements
    const actionHeader = document.createElement('div');
    actionHeader.classList.add('action-header');
    
    const actionTitle = document.createElement('div');
    actionTitle.classList.add('action-title');
    
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('action-delete');
    deleteButton.innerHTML = '&times;';
    deleteButton.title = 'Delete action';
    
    actionHeader.appendChild(actionTitle);
    actionHeader.appendChild(deleteButton);
    actionItem.appendChild(actionHeader);
    
    // Add type-specific content
    const actionContent = document.createElement('div');
    actionContent.classList.add('action-content');
    
    if (type === 'keypress') {
        actionTitle.textContent = 'Key Press';
        
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Press a key...';
        keyInput.value = existingAction && existingAction.key ? existingAction.key : '';
        keyInput.classList.add('key-input');
        
        actionContent.appendChild(keyInput);
        
        // Add key press handler
        setupKeyPressHandlerForInput(keyInput);
    } else if (type === 'command') {
        actionTitle.textContent = 'Command Line';
        
        const commandInput = document.createElement('input');
        commandInput.type = 'text';
        commandInput.placeholder = 'Enter command...';
        commandInput.value = existingAction && existingAction.command ? existingAction.command : '';
        commandInput.classList.add('command-input');
        
        actionContent.appendChild(commandInput);
    } else if (type === 'script') {
        actionTitle.textContent = 'Script';
        
        const uploadButton = document.createElement('button');
        uploadButton.textContent = 'Upload Script';
        uploadButton.classList.add('upload-button');
        
        const scriptPath = document.createElement('div');
        scriptPath.classList.add('script-path');
        scriptPath.textContent = existingAction && existingAction.script ? existingAction.script : 'No script selected';
        
        actionContent.appendChild(uploadButton);
        actionContent.appendChild(scriptPath);
        
        // Add upload handler
        uploadButton.addEventListener('click', function() {
            // This would typically open a file dialog
            // For now, just simulate selecting a file
            scriptPath.textContent = 'C:\\path\\to\\script.js';
        });
    }
    
    actionItem.appendChild(actionContent);
    actionList.appendChild(actionItem);
    
    return actionItem;
}

// Setup key press handlers for the entire document
function setupKeyPressHandlers() {
    document.querySelectorAll('.key-input').forEach(input => {
        setupKeyPressHandlerForInput(input);
    });
}

// Setup key press handler for a specific input
function setupKeyPressHandlerForInput(input) {
    input.addEventListener('keydown', function(e) {
        e.preventDefault();
        
        let key = '';
        
        // Handle special keys
        if (e.key === ' ') {
            key = 'Space';
        } else if (e.key === 'Control') {
            key = 'Ctrl';
        } else if (e.key === 'Meta') {
            key = 'Win';
        } else if (e.key === 'ArrowUp') {
            key = 'Up';
        } else if (e.key === 'ArrowDown') {
            key = 'Down';
        } else if (e.key === 'ArrowLeft') {
            key = 'Left';
        } else if (e.key === 'ArrowRight') {
            key = 'Right';
        } else if (e.key.length === 1) {
            key = e.key.toUpperCase();
        } else {
            key = e.key;
        }
        
        // Update the input value
        this.value = key;
        
        // Remove focus
        this.blur();
    });
} 