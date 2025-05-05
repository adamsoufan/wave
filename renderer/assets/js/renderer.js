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

    console.log("Current page: ", pageName);

    // Highlight the current page in the sidebar
    highlightCurrentPage(pageName);

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

// Function to highlight the current page in the sidebar
function highlightCurrentPage(pageName) {
    // Get all sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar-nav li');
    
    // Remove selected class from all items first
    sidebarItems.forEach(item => item.classList.remove('selected'));
    
    // Handle each case specifically
    if (pageName === '' || pageName === 'index.html') {
        // Find the Home link and highlight it
        const homeItem = Array.from(sidebarItems).find(item => {
            const link = item.querySelector('a');
            return link && link.getAttribute('href') === 'index.html';
        });
        
        if (homeItem) {
            homeItem.classList.add('selected');
        }
    } else {
        // Find the corresponding link for other pages
        const currentItem = Array.from(sidebarItems).find(item => {
            const link = item.querySelector('a');
            return link && link.getAttribute('href') === pageName;
        });
        
        if (currentItem) {
            currentItem.classList.add('selected');
        }
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
    const detectionToggle = document.getElementById('detection-toggle');
    const gestureStatus = document.getElementById('gesture-status');
    const detectedGesture = document.getElementById('detected-gesture');
    
    // Flag to track detection state
    let isDetecting = false;
    let isLoading = false;
    
    // Hide the gesture status initially
    if (gestureStatus) {
        gestureStatus.classList.remove('visible');
    }
    
    // Request current detection state when page loads
    window.api.send('get-detection-state');
    
    // Handle detection state response
    window.api.receive('detection-state', (data) => {
        console.log('Received detection state:', data);
        // Update the local state
        isDetecting = data.detecting;
        isLoading = false;
        
        // Update the button
        if (detectionToggle) {
            detectionToggle.textContent = isDetecting ? 'Stop Detecting' : 'Start Detecting';
            detectionToggle.classList.toggle('detecting', isDetecting);
            detectionToggle.classList.remove('loading');
            detectionToggle.disabled = false;
        }
    });
    
    // Detection toggle button functionality
    if (detectionToggle) {
        detectionToggle.addEventListener('click', function() {
            if (isLoading) return; // Prevent multiple clicks while loading
            
            if (!isDetecting) {
                // Going from not detecting to detecting - show loading state
                isLoading = true;
                this.textContent = 'Loading...';
                this.classList.add('loading');
                this.disabled = true;
                
                // Send toggle command to main process for starting detection
                window.api.send('toggle-detection', true);
            } else {
                // Going from detecting to not detecting - show stopping state
                isLoading = true;
                this.textContent = 'Stopping...';
                this.classList.add('loading');
                this.disabled = true;
                
                // Send toggle command to main process for stopping detection
                window.api.send('toggle-detection', false);
            }
        });
    }
    
    // Handle detection status updates from main process
    window.api.receive('detection-status', (data) => {
        console.log('Detection status update:', data);
        
        // Update the detection state
        isDetecting = data.detecting;
        isLoading = false;
        
        // Update the button
        if (detectionToggle) {
            detectionToggle.textContent = isDetecting ? 'Stop Detecting' : 'Start Detecting';
            detectionToggle.classList.toggle('detecting', isDetecting);
            detectionToggle.classList.remove('loading');
            detectionToggle.disabled = false;
        }
        
        // Show status message on error, but only when starting detection fails
        if (!data.success && data.detecting) {
            alert('There was an error starting gesture detection.');
        }
    });
    
    // Handle detected gestures from main process
    window.api.receive('gesture-detected', (data) => {
        console.log('Gesture detected:', data);
        
        // Update the status display
        if (detectedGesture && gestureStatus) {
            // Set the gesture name and emoji - for display only
            detectedGesture.textContent = `${data.gestureName} ${data.gestureEmoji}`;
            
            // Show the status
            gestureStatus.classList.add('visible');
            
            // Hide after a delay
            setTimeout(() => {
                gestureStatus.classList.remove('visible');
            }, 2000);
        }
        
        // Handle matching mappings
        if (data.matchingMappings && data.matchingMappings.length > 0) {
            data.matchingMappings.forEach(mapping => {
                console.log(`Matching mapping found: ${mapping.name} - macro: ${mapping.macro}`);
                // The main process now handles the macro execution
            });
        }
    });
    
    // Load saved mappings
    window.api.send('load-mappings');
    
    // Receive saved mappings from the main process
    window.api.receive('mappings-loaded', (loadedMappings) => {
        // Clear the existing grid
        gestureGrid.innerHTML = '';
        
        // Check if there are any mappings
        if (!loadedMappings || loadedMappings.length === 0) {
            // Create and display the empty state message
            const emptyState = document.createElement('div');
            emptyState.classList.add('gesture-grid-empty');
            emptyState.innerHTML = 'You have no saved mappings. View the Help page using the sidebar to learn how to make one!';
            
            // Center the empty state in the content div
            emptyState.style.display = 'flex';
            emptyState.style.justifyContent = 'center';
            emptyState.style.alignItems = 'center';
            emptyState.style.textAlign = 'center';
            emptyState.style.height = 'calc(100vh - 200px)';
            emptyState.style.margin = '0';
            
            gestureGrid.appendChild(emptyState);
            return;
        }
        
        // Add mappings to the grid
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
            
            // Check if the preview emoji is stored as JSON (for combined gestures)
            if (mapping.previewEmoji && mapping.previewEmoji.startsWith('{') && mapping.previewGestureId === 'combined') {
                try {
                    // Try to parse the JSON
                    const gestures = JSON.parse(mapping.previewEmoji);
                    circleIcon.classList.add('combined-gesture');
                    circleIcon.innerHTML = `<span class="left-gesture">${gestures.left}</span><span class="right-gesture">${gestures.right}</span>`;
                } catch (e) {
                    // Fallback if JSON parsing fails
                    circleIcon.textContent = mapping.rightGesture || mapping.leftGesture || '';
                }
            } else {
                // Use the preview emoji or any available gesture
                circleIcon.textContent = mapping.previewEmoji || mapping.rightGesture || mapping.leftGesture || '';
            }
            
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
            
            // Add click handler for the toggle switch
            toggleSwitch.addEventListener('click', function() {
                // Toggle the classes
                this.classList.toggle('on');
                this.classList.toggle('off');
                
                // Update the mapping in local UI state
                mapping.enabled = this.classList.contains('on');
                
                // Send the correct toggle data to main process
                window.api.send('gesture-toggle', {
                    name: mapping.name,
                    enabled: mapping.enabled
                });
            });
            
            // Add the card to the grid
            gestureGrid.appendChild(card);
        });
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
    
    // Add event listener to auto-fill name field when macro is selected
    if (macroSelect && gestureName) {
        macroSelect.addEventListener('change', function() {
            // Only update the name if the current name field is empty
            if (gestureName.value.trim() === '') {
                gestureName.value = this.value;
            }
        });
    }
    
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
                    // Add the gesture ID
                    if (mapping.leftGestureId) {
                        plusIcon.setAttribute('data-gesture-id', mapping.leftGestureId);
                    }
                } else {
                    plusIcon.textContent = '+';
                    plusIcon.classList.remove('selected-gesture');
                    plusIcon.removeAttribute('data-gesture-id');
                }
            }
        }
        
        if (rightBlock) {
            const plusIcon = rightBlock.querySelector('.gesture-plus-icon');
            if (plusIcon) {
                if (mapping.rightGesture) {
                    plusIcon.textContent = mapping.rightGesture;
                    plusIcon.classList.add('selected-gesture');
                    // Add the gesture ID
                    if (mapping.rightGestureId) {
                        plusIcon.setAttribute('data-gesture-id', mapping.rightGestureId);
                    }
                } else {
                    plusIcon.textContent = '+';
                    plusIcon.classList.remove('selected-gesture');
                    plusIcon.removeAttribute('data-gesture-id');
                }
            }
        }
        
        // Update the preview
        const previewCircle = document.querySelector('.gesture-preview-circle');
        if (previewCircle) {
            // Check if both hands have gestures
            if (mapping.leftGesture && mapping.rightGesture) {
                // Display combined gesture
                previewCircle.innerHTML = `<span class="left-gesture">${mapping.leftGesture}</span><span class="right-gesture">${mapping.rightGesture}</span>`;
                previewCircle.setAttribute('data-gesture-id', 'combined');
                previewCircle.classList.add('combined-gesture');
            }
            // Otherwise use any existing preview or default to right/left hand gesture
            else if (mapping.previewEmoji) {
                previewCircle.textContent = mapping.previewEmoji;
                previewCircle.classList.remove('combined-gesture');
                // Add the gesture ID if available
                if (mapping.previewGestureId) {
                    previewCircle.setAttribute('data-gesture-id', mapping.previewGestureId);
                } else if (mapping.rightGestureId) {
                    previewCircle.setAttribute('data-gesture-id', mapping.rightGestureId);
                } else if (mapping.leftGestureId) {
                    previewCircle.setAttribute('data-gesture-id', mapping.leftGestureId);
                } else {
                    previewCircle.removeAttribute('data-gesture-id');
                }
            } else if (mapping.rightGesture) {
                previewCircle.textContent = mapping.rightGesture;
                previewCircle.classList.remove('combined-gesture');
                if (mapping.rightGestureId) {
                    previewCircle.setAttribute('data-gesture-id', mapping.rightGestureId);
                }
            } else if (mapping.leftGesture) {
                previewCircle.textContent = mapping.leftGesture;
                previewCircle.classList.remove('combined-gesture');
                if (mapping.leftGestureId) {
                    previewCircle.setAttribute('data-gesture-id', mapping.leftGestureId);
                }
            } else {
                previewCircle.textContent = '';
                previewCircle.classList.remove('combined-gesture');
                previewCircle.removeAttribute('data-gesture-id');
            }
        }
        
        // Add a delete button if it doesn't exist
        let deleteButton = document.querySelector('.delete-mapping-button');
        if (!deleteButton) {
            deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-mapping-button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.marginLeft = '2px';
            deleteButton.style.backgroundColor = '#ff4d4d';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.padding = '8px 16px';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.fontWeight = '500';
            
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
                        previewCircle.textContent = '';
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
                    const gestureId = this.getAttribute('data-gesture-id');
                    
                    // Check if this is the "remove gesture" icon (the NO symbol)
                    if (gestureId === 'remove-gesture') {
                        if (activeGestureBlock) {
                            // Reset the plus icon 
                            const plusIcon = activeGestureBlock.querySelector('.gesture-plus-icon');
                            if (plusIcon) {
                                plusIcon.textContent = '+';
                                plusIcon.classList.remove('selected-gesture');
                                plusIcon.removeAttribute('data-gesture-id');
                            }
                        }
                    } else {
                        if (activeGestureBlock) {
                            // Replace the plus icon with the selected emoji
                            const plusIcon = activeGestureBlock.querySelector('.gesture-plus-icon');
                            if (plusIcon) {
                                plusIcon.textContent = emoji;
                                plusIcon.classList.add('selected-gesture');
                                // Store the gesture ID as a data attribute
                                plusIcon.setAttribute('data-gesture-id', gestureId);
                            }
                        }
                    }
                    
                    // Update the preview based on both left and right hand gestures
                    updatePreviewCircle();
                    
                    // Close the popup
                    gestureSelectionPopup.style.display = 'none';
                });
            });
        }
    }
    
    // Function to update the preview circle based on selected gestures
    function updatePreviewCircle() {
        const previewCircle = document.querySelector('.gesture-preview-circle');
        if (!previewCircle) return;
        
        const leftBlock = document.querySelector('.gesture-block.left-hand');
        const rightBlock = document.querySelector('.gesture-block.right-hand');
        
        if (!leftBlock || !rightBlock) return;
        
        const leftPlusIcon = leftBlock.querySelector('.gesture-plus-icon');
        const rightPlusIcon = rightBlock.querySelector('.gesture-plus-icon');
        
        if (!leftPlusIcon || !rightPlusIcon) return;
        
        const leftGesture = leftPlusIcon.classList.contains('selected-gesture') ? leftPlusIcon.textContent : null;
        const rightGesture = rightPlusIcon.classList.contains('selected-gesture') ? rightPlusIcon.textContent : null;
        
        const leftGestureId = leftPlusIcon.getAttribute('data-gesture-id');
        const rightGestureId = rightPlusIcon.getAttribute('data-gesture-id');
        
        // Update the preview based on which gestures are selected
        if (leftGesture && rightGesture) {
            // Both hands have gestures - display them in top-left and bottom-right
            previewCircle.innerHTML = `<span class="left-gesture">${leftGesture}</span><span class="right-gesture">${rightGesture}</span>`;
            previewCircle.setAttribute('data-gesture-id', 'combined');
            previewCircle.classList.add('combined-gesture');
        } else if (rightGesture) {
            // Only right hand has a gesture
            previewCircle.textContent = rightGesture;
            previewCircle.setAttribute('data-gesture-id', rightGestureId);
            previewCircle.classList.remove('combined-gesture');
        } else if (leftGesture) {
            // Only left hand has a gesture
            previewCircle.textContent = leftGesture;
            previewCircle.setAttribute('data-gesture-id', leftGestureId);
            previewCircle.classList.remove('combined-gesture');
        } else {
            // No gestures selected
            previewCircle.textContent = '';
            previewCircle.removeAttribute('data-gesture-id');
            previewCircle.classList.remove('combined-gesture');
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
                previewCircle.textContent = '';
                previewCircle.removeAttribute('data-gesture-id');
                previewCircle.classList.remove('combined-gesture');
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
            
            // Get the gesture emojis and IDs
            const leftBlock = document.querySelector('.gesture-block.left-hand');
            const rightBlock = document.querySelector('.gesture-block.right-hand');
            
            let leftGesture = null;
            let leftGestureId = null;
            let rightGesture = null; 
            let rightGestureId = null;
            
            if (leftBlock) {
                const plusIcon = leftBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    leftGesture = plusIcon.textContent;
                    leftGestureId = plusIcon.getAttribute('data-gesture-id');
                }
            }
            
            if (rightBlock) {
                const plusIcon = rightBlock.querySelector('.gesture-plus-icon');
                if (plusIcon && plusIcon.classList.contains('selected-gesture')) {
                    rightGesture = plusIcon.textContent;
                    rightGestureId = plusIcon.getAttribute('data-gesture-id');
                }
            }
            
            // Ensure at least one gesture is selected
            if (!leftGesture && !rightGesture) {
                alert('Please select at least one gesture (left or right hand)');
                return;
            }
            
            // Get preview emoji for display
            const previewCircle = document.querySelector('.gesture-preview-circle');
            let previewEmoji = '';
            let previewGestureId = '';
            
            // If both gestures are selected, we'll store info to rebuild the combined view
            if (leftGesture && rightGesture) {
                // Store a JSON string with both gestures to reconstruct later
                previewEmoji = JSON.stringify({
                    left: leftGesture,
                    right: rightGesture
                });
                previewGestureId = 'combined';
            } else {
                // Otherwise just use the current preview
                previewEmoji = previewCircle.textContent;
                previewGestureId = previewCircle.getAttribute('data-gesture-id') || '';
            }
            
            // Send mapping data to main process
            window.api.send('save-gesture-mapping', {
                name: mappingName,
                macro: selectedMacro,
                leftGesture: leftGesture,
                leftGestureId: leftGestureId,
                rightGesture: rightGesture,
                rightGestureId: rightGestureId,
                previewEmoji: previewEmoji,
                previewGestureId: previewGestureId,
                enabled: true // New mappings are enabled by default
            });
            
            // Show save feedback
            const originalText = this.textContent;
            const originalBg = this.style.backgroundColor;
            this.textContent = 'Saved!';
            this.style.backgroundColor = '#4CAF50';
            
            // Restore original state after a delay
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = originalBg;
            }, 1500);
            
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
            deleteButton.style.marginLeft = '2px';
            deleteButton.style.backgroundColor = '#ff4d4d';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.padding = '8px 16px';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.fontWeight = '500';
            
            // Add an execute button if it doesn't exist
            let executeButton = document.querySelector('.execute-macro-button');
            if (!executeButton) {
                executeButton = document.createElement('button');
                executeButton.classList.add('execute-macro-button');
                executeButton.textContent = 'Test';
                executeButton.style.marginLeft = '2px';
                executeButton.style.backgroundColor = '#4CAF50';
                executeButton.style.color = 'white';
                executeButton.style.border = 'none';
                executeButton.style.borderRadius = '4px';
                executeButton.style.padding = '8px 16px';
                executeButton.style.cursor = 'pointer';
                executeButton.style.fontWeight = '500';
                
                // Insert after the save button
                saveButton.parentNode.insertBefore(executeButton, saveButton.nextSibling);
            }
            
            // Insert after the test button
            executeButton.parentNode.insertBefore(deleteButton, executeButton.nextSibling);
            
            // Add click handler for the delete button
            deleteButton.addEventListener('click', function() {
                const macroName = macroNameInput.value;
                if (macroName && confirm(`Are you sure you want to delete the macro "${macroName}"?`)) {
                    window.api.send('delete-macro', macroName);
                    
                    // Clear the form
                    macroNameInput.value = '';
                    actionList.innerHTML = '';
                    
                    // Remove the buttons
                    if (executeButton) executeButton.parentNode.removeChild(executeButton);
                    deleteButton.parentNode.removeChild(deleteButton);
                }
            });
            
            // Add click handler for the execute button
            executeButton.addEventListener('click', function() {
                const macroName = macroNameInput.value;
                if (macroName) {
                    // Send the execute command to the main process
                    window.api.send('execute-macro', macroName);
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
            
            // Remove the delete and test buttons if they exist
            const deleteButton = document.querySelector('.delete-macro-button');
            if (deleteButton) {
                deleteButton.parentNode.removeChild(deleteButton);
            }
            
            const executeButton = document.querySelector('.execute-macro-button');
            if (executeButton) {
                executeButton.parentNode.removeChild(executeButton);
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
            
            // Show save feedback
            const originalText = this.textContent;
            const originalBg = this.style.backgroundColor;
            this.textContent = 'Saved!';
            this.style.backgroundColor = '#4CAF50';
            
            // Restore original state after a delay
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = originalBg;
            }, 1500);
            
            // Add the Test and Delete buttons after saving
            // Add a test button if it doesn't exist
            let executeButton = document.querySelector('.execute-macro-button');
            if (!executeButton) {
                executeButton = document.createElement('button');
                executeButton.classList.add('execute-macro-button');
                executeButton.textContent = 'Test';
                executeButton.style.marginLeft = '2px';
                executeButton.style.backgroundColor = '#4CAF50';
                executeButton.style.color = 'white';
                executeButton.style.border = 'none';
                executeButton.style.borderRadius = '4px';
                executeButton.style.padding = '8px 16px';
                executeButton.style.cursor = 'pointer';
                executeButton.style.fontWeight = '500';
                
                // Insert after the save button
                saveButton.parentNode.insertBefore(executeButton, saveButton.nextSibling);
                
                // Add click handler for the execute button
                executeButton.addEventListener('click', function() {
                    const macroName = macroNameInput.value;
                    if (macroName) {
                        // Send the execute command to the main process
                        window.api.send('execute-macro', macroName);
                    }
                });
            }
            
            // Add a delete button if it doesn't exist
            let deleteButton = document.querySelector('.delete-macro-button');
            if (!deleteButton) {
                deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-macro-button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '2px';
                deleteButton.style.backgroundColor = '#ff4d4d';
                deleteButton.style.color = 'white';
                deleteButton.style.border = 'none';
                deleteButton.style.borderRadius = '4px';
                deleteButton.style.padding = '8px 16px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.fontWeight = '500';
                
                // Insert after the test button
                executeButton.parentNode.insertBefore(deleteButton, executeButton.nextSibling);
                
                // Add click handler for the delete button
                deleteButton.addEventListener('click', function() {
                    const macroName = macroNameInput.value;
                    if (macroName && confirm(`Are you sure you want to delete the macro "${macroName}"?`)) {
                        window.api.send('delete-macro', macroName);
                        
                        // Clear the form
                        macroNameInput.value = '';
                        actionList.innerHTML = '';
                        
                        // Remove the buttons
                        if (executeButton) executeButton.parentNode.removeChild(executeButton);
                        deleteButton.parentNode.removeChild(deleteButton);
                    }
                });
            }
            
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

    // Handle macro execution confirmation
    window.api.receive('macro-executed', (data) => {
        console.log('Macro executed:', data);
        if (data.success) {
            // Show a brief success message or indicator
            const executeButton = document.querySelector('.execute-macro-button');
            if (executeButton) {
                const originalText = executeButton.textContent;
                executeButton.textContent = 'Done!';
                executeButton.style.backgroundColor = '#2E7D32';
                
                // Restore original text after a delay
                setTimeout(() => {
                    executeButton.textContent = originalText;
                    executeButton.style.backgroundColor = '#4CAF50';
                }, 1500);
            }
        }
    });
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
                    <div class="drag-handle"></div>
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
                    <div class="drag-handle"></div>
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
                    <div class="drag-handle"></div>
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