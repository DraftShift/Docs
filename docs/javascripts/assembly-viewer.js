// Assembly Viewer JavaScript
// This file contains all the JavaScript logic for the 3D assembly viewer

// Global variables
let modelFile = window.assemblyViewerData?.modelFile || '';
let assemblySteps = window.assemblyViewerData?.assemblySteps || [];
let bgColor = window.assemblyViewerData?.bgColor || [127, 127, 127];
let primaryParts = window.assemblyViewerData?.primaryParts || [];
let accentParts = window.assemblyViewerData?.accentParts || [];
let frameParts = window.assemblyViewerData?.frameParts || [];
let transparentParts = window.assemblyViewerData?.transparentParts || {};
let primaryColor = window.assemblyViewerData?.primaryColor || [37, 13, 63];
let accentColor = window.assemblyViewerData?.accentColor || [110, 63, 163];
let frameColor = window.assemblyViewerData?.frameColor || [127, 127, 127];
let focusColor = window.assemblyViewerData?.focusColor || [110, 255, 0];
let subCategories = window.assemblyViewerData?.subCategories || null;
let selectedSubCategory = null;

// Global reference to viewer controls for external access
window.modelViewerControls = null;
window.modelViewerCamera = null;
window.modelViewerParts = null;
window.scene = null;
window.originalPartColors = {}; // Store original colors for reset
window.lightDirections = {}; // Store original light directions
window.appliedCameraSettings = null; // Store the camera settings that were applied
window.initialCameraPosition = null; // Store initial camera position after recenter
window.initialTarget = null; // Store initial orbit target after recenter

let currentStep = 0;
let blinkInterval = null;
let modelViewerInitialized = false;

// Light positions
const lightValues = {
    // Key light: Strong from upper front-right (primary light source)
    keyLight: {position: [1.5, 2, 1.5], intensity: 2, color: 0xffffff},
    // Fill light: Softer from upper front-left (reduces harsh shadows)
    fillLight: {position: [-1, 1.5, 1], intensity: 1, color: 0xffffff},
    // Rim light: Subtle from back-top (edge definition)
    rimLight: {position: [0, 1.5, -2], intensity: 0.8, color: 0xffffff},
    // Bottom bounce: Very subtle upward light (simulates ground reflection)
    bounceLight: {position: [0, -1, 0.5], intensity: 0.3, color: 0xffffff}
};

// Helper function to create SVG icon from template
function createIcon(iconId) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + iconId);
    svg.appendChild(use);
    return svg;
}

// Helper function to set icon
function setIcon(element, iconId) {
    element.innerHTML = '';
    element.appendChild(createIcon(iconId));
}

// Helper function to normalize to array
function toArray(item) {
    return Array.isArray(item) ? item : [item];
}

// Helper function to set mesh visibility
function setMeshVisibility(meshes, visible) {
    toArray(meshes).forEach(function(mesh) { mesh.visible = visible; });
}

// Helper function to apply color to material
function applyColorToMaterial(material, color) {
    if (Array.isArray(material)) {
        material.forEach(function(mat) { mat.color.copy(color); });
    } else {
        material.color.copy(color);
    }
}

// Helper function to clone and color material
function cloneAndColorMaterial(material, color) {
    if (Array.isArray(material)) {
        return material.map(function(mat) {
            const cloned = mat.clone();
            cloned.color.copy(color);
            return cloned;
        });
    } else {
        const cloned = material.clone();
        cloned.color.copy(color);
        return cloned;
    }
}

// Function to update camera overlay display
function updateCameraOverlay() {
    const azimuthEl = document.getElementById('overlay-azimuth');
    const polarEl = document.getElementById('overlay-polar');
    const distanceEl = document.getElementById('overlay-distance');
    const panXEl = document.getElementById('overlay-pan-x');
    const panYEl = document.getElementById('overlay-pan-y');
    const panZEl = document.getElementById('overlay-pan-z');
    
    if (!azimuthEl || !polarEl || !distanceEl || !panXEl || !panYEl || !panZEl || !window.modelViewerCamera || !window.modelViewerControls) return;
    
    const pos = window.modelViewerCamera.position;
    const target = window.modelViewerControls.target;
    
    // Calculate relative position (camera position relative to target)
    const relX = pos.x - target.x;
    const relY = pos.y - target.y;
    const relZ = pos.z - target.z;
    
    // Always calculate current spherical coordinates
    const distance = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
    const polar = THREE.MathUtils.radToDeg(Math.acos(relY / distance));
    const azimuth = THREE.MathUtils.radToDeg(Math.atan2(relZ, relX));
    const normalizedAzimuth = azimuth < 0 ? azimuth + 360 : azimuth;
    
    azimuthEl.textContent = Math.round(normalizedAzimuth);
    polarEl.textContent = Math.round(polar);
    distanceEl.textContent = Math.round(distance);
    
    // Calculate pan: change in orbit target in camera screen space
    if (window.initialTarget && window.modelViewerCamera) {
        // Get world-space pan offset
        const worldPanX = target.x - window.initialTarget.x;
        const worldPanY = target.y - window.initialTarget.y;
        const worldPanZ = target.z - window.initialTarget.z;
        
        // Transform to camera space for display
        // Get camera's right and up vectors
        const camera = window.modelViewerCamera;
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(camera.up, cameraDirection).normalize();
        
        const cameraUp = new THREE.Vector3();
        cameraUp.crossVectors(cameraDirection, cameraRight).normalize();
        
        // Project world pan onto camera axes
        const worldPan = new THREE.Vector3(worldPanX, worldPanY, worldPanZ);
        const screenPanX = worldPan.dot(cameraRight);
        const screenPanY = worldPan.dot(cameraUp);
        
        panXEl.textContent = screenPanX.toFixed(2);
        panYEl.textContent = screenPanY.toFixed(2);
        panZEl.textContent = '0.00';
    } else {
        panXEl.textContent = '0.00';
        panYEl.textContent = '0.00';
        panZEl.textContent = '0.00';
    }
}

// Function to set camera position using spherical coordinates
function setCameraPosition(azimuth, polar, distance, pan_x = 0, pan_y = 0, pan_z = 0) {
    if (!window.modelViewerCamera || !window.modelViewerControls) return;
    
    const target = window.modelViewerControls.target;
    
    // Convert spherical coordinates to Cartesian (relative to target)
    const azimuthRad = THREE.MathUtils.degToRad(azimuth);
    const polarRad = THREE.MathUtils.degToRad(polar);
    
    const x = distance * Math.sin(polarRad) * Math.cos(azimuthRad);
    const y = distance * Math.cos(polarRad);
    const z = distance * Math.sin(polarRad) * Math.sin(azimuthRad);
    
    // Position camera relative to target, with pan offset
    window.modelViewerCamera.position.set(
        target.x + x + pan_x,
        target.y + y + pan_y,
        target.z + z + pan_z
    );
    
    window.modelViewerControls.update();
    updateCameraOverlay();
}

// Function to set which parts are visible
function setVisibleParts(visiblePartNames) {
    if (!window.modelViewerParts) return;
    
    const showAll = !visiblePartNames || visiblePartNames.length === 0;
    
    // Set visibility for each part
    Object.keys(window.modelViewerParts).forEach(function(partName) {
        const meshes = window.modelViewerParts[partName];
        const shouldBeVisible = showAll || visiblePartNames.includes(partName);
        setMeshVisibility(meshes, shouldBeVisible);
    });
    
    // Update visibility icons to match visibility
    PartsManager.updateAllIcons(visiblePartNames, showAll);
}

// Function to set focus color on specific parts
function setFocusParts(focusArray) {
    if (!window.modelViewerParts) return;
    
    // Reset ALL parts to original colors first
    Object.keys(window.modelViewerParts).forEach(function(partName) {
        toArray(window.modelViewerParts[partName]).forEach(function(mesh) {
            mesh.traverse(function(child) {
                if (child.isMesh && child.material) {
                    const originalColor = window.originalPartColors[child.uuid];
                    if (originalColor) {
                        applyColorToMaterial(child.material, originalColor);
                    }
                }
            });
        });
    });
    
    // Apply focus colors if specified
    if (!focusArray || focusArray.length === 0) return;
    
    focusArray.forEach(function(focusItem) {
        const partName = focusItem.part;
        const color = focusItem.color;
        
        if (!partName || !color || !window.modelViewerParts[partName]) return;
        
        const threeColor = new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255);
        
        toArray(window.modelViewerParts[partName]).forEach(function(mesh) {
            mesh.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material = cloneAndColorMaterial(child.material, threeColor);
                }
            });
        });
    });
}

// Init the Model Viewer
function initModelViewer(modelPath, onModelLoaded) {
    const container = document.getElementById('model-viewer');
    if (!container) return;
    
    const modelParts = {}; // Store model parts by material name

    // Scene setup
    const scene = new THREE.Scene();
    window.scene = scene; // Make scene globally accessible

    // Use background color from template if available, otherwise default
    if (typeof bgColor !== 'undefined') {
        scene.background = new THREE.Color(bgColor[0] / 255, bgColor[1] / 255, bgColor[2] / 255);
    } else {
        scene.background = new THREE.Color(0x1a1a1a);
    }

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(0, 50, 100);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.borderRadius = '8px'; // Match container border-radius
    container.appendChild(renderer.domElement);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Lights
    Object.keys(lightValues).forEach(function(key) {
        const config = lightValues[key];
        console.log(config);
        const light = new THREE.DirectionalLight(config.color || 0xffffff, config.intensity);
        
        // Store the normalized direction for later use
        const direction = new THREE.Vector3(config.position[0], config.position[1], config.position[2]).normalize();
        window.lightDirections[key] = direction;
        
        // Position light at a reasonable distance (will be updated when model loads)
        light.position.copy(direction.multiplyScalar(100));
        light.userData.lightKey = key; // Store key for later identification
        scene.add(light);
    });

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Store globally for external access
    window.modelViewerCamera = camera;
    window.modelViewerControls = controls;

    // Load glTF/GLB model
    const gltfLoader = new THREE.GLTFLoader();

    gltfLoader.load(
        modelPath,
        function (gltf) {
            const root = gltf.scene || gltf.scenes?.[0];
            if (!root) {
                console.error('No scene found in glTF');
                return;
            }

            // Track children of direct children (two levels deep from root)
            let partIndex = 1;
            
            // Store original colors for all meshes
            root.traverse(function(child) {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        // Store first material's color as representative
                        window.originalPartColors[child.uuid] = child.material[0].color.clone();
                    } else {
                        window.originalPartColors[child.uuid] = child.material.color.clone();
                    }
                }
            });
            
            root.children.forEach(function(directChild) {
                // For each direct child, look at its children
                directChild.children.forEach(function(child) {
                    // Check if this child has mesh descendants
                    let hasMeshChildren = false;
                    child.traverse(function(descendant) {
                        if (descendant instanceof THREE.Mesh || descendant instanceof THREE.SkinnedMesh) {
                            hasMeshChildren = true;
                        }
                    });
                    
                    if (hasMeshChildren) {
                        let rawName = child.name && child.name.trim().length > 0 ? child.name : `Unnamed Part ${partIndex}`;
                        
                        // Strip various numeric/version suffixes and clean up name
                        let partName = rawName
                            .replace(/\s+[a-z]\d+$/i, '')  // Remove " v003", " x5", etc.
                            .replace(/_[a-z]?\d+$/i, '')   // Remove "_x006", "_v001", "_1", etc.
                            .replace(/[._]\d+$/, '')       // Remove ".001", "_2", etc.
                            .replace(/0+\d*$/, '')         // Remove trailing "005", "001", "0001", etc.
                            .replace(/_/g, ' ')            // Replace underscores with spaces
                            .trim();
                        
                        if (!modelParts[partName]) {
                            modelParts[partName] = [];
                        }
                        modelParts[partName].push(child);
                        console.log('- ', partName);
                        partIndex++;
                    }
                });
            });

            // Center and scale
            const box = new THREE.Box3().setFromObject(root);
            const center = box.getCenter(new THREE.Vector3());
            root.position.sub(center);

            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 50 / maxDim; // normalize model to ~50 units max dimension
            root.scale.multiplyScalar(scale);
            
            // Add model to scene
            scene.add(root);

            // Recompute bounds after scaling to drive camera framing
            let scaledBox = new THREE.Box3().setFromObject(root);
            // Re-center again to eliminate any residual offset on Y after scaling
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
            root.position.sub(scaledCenter);
            // Recompute one more time after the second centering
            scaledBox = new THREE.Box3().setFromObject(root);
            const scaledSize = scaledBox.getSize(new THREE.Vector3());
            const radius = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 0.5;

            // Frame the model: compute camera distance from FOV
            const fov = THREE.MathUtils.degToRad(camera.fov);
            const distance = (radius / Math.tan(fov / 2)) * 1.25; // 1.25 for padding

            // Set camera position looking slightly down
            camera.position.set(distance, distance * 0.35, distance);
            // Aim precisely at model center
            const finalCenter = scaledBox.getCenter(new THREE.Vector3());
            controls.target.copy(finalCenter);

            // Update near/far and control distances
            camera.near = Math.max(distance / 100, 0.1);
            camera.far = distance * 10;
            camera.updateProjectionMatrix();
            
            // Store model parts globally
            window.modelViewerParts = modelParts;
            
            // Apply transparency to specified parts
            try {
                if (transparentParts && Object.keys(transparentParts).length > 0) {
                    console.log('Transparent parts config:', transparentParts);
                    console.log('Available parts:', Object.keys(modelParts));
                    Object.keys(transparentParts).forEach(function(partName) {
                        const opacity = transparentParts[partName];
                        if (modelParts[partName]) {
                            modelParts[partName].forEach(function(partObject) {
                                partObject.traverse(function(child) {
                                    if (child.isMesh && child.material) {
                                        // Handle both single material and material arrays
                                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                                        materials.forEach(function(mat) {
                                            mat.transparent = true;
                                            mat.opacity = opacity;
                                            mat.depthWrite = opacity >= 0.95; // Only write depth for nearly opaque objects
                                            mat.side = THREE.DoubleSide; // Render both sides for transparent objects
                                            mat.needsUpdate = true;
                                        });
                                    }
                                });
                            });
                            console.log('Applied transparency to:', partName, 'opacity:', opacity);
                        } else {
                            console.warn('Part not found for transparency:', partName);
                        }
                    });
                }
            } catch (error) {
                console.error('Error applying transparency:', error);
            }
            
            // Call callback when model is loaded
            if (typeof onModelLoaded === 'function') {
                onModelLoaded();
            }

        },
        function (xhr) {
            console.log((xhr.loaded / (xhr.total || 1) * 100).toFixed(1) + '% loaded');
        },
        function (error) {
            console.error('Error loading glTF model:', error);
        }
    );

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        
        // Update light positions to follow camera (camera-relative lighting)
        scene.children.forEach(function(child) {
            if (child.isDirectionalLight && child.userData.lightKey) {
                const lightKey = child.userData.lightKey;
                const direction = window.lightDirections[lightKey];
                if (direction) {
                    // Transform light direction from world space to camera space
                    const cameraRelativeDir = direction.clone();
                    cameraRelativeDir.applyQuaternion(camera.quaternion);
                    
                    // Position light relative to camera
                    const lightDistance = 100;
                    child.position.copy(camera.position).add(
                        cameraRelativeDir.multiplyScalar(lightDistance)
                    );
                }
            }
        });
        
        renderer.render(scene, camera);
        updateCameraOverlay();
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', function () {
        if (!container.clientWidth || !container.clientHeight) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Populate visibility controls
function createVisibilityControls(controlsId, modelParts) {
    const partsList = document.getElementById('parts-list');
    if (!partsList) return;

    // Wire up All/None buttons
    const selectAllBtn = document.getElementById('select-all-parts');
    const deselectAllBtn = document.getElementById('deselect-all-parts');
    
    if (selectAllBtn) {
        selectAllBtn.onclick = function() {
            this.blur(); // Remove focus to hide tooltip
            Object.values(modelParts).forEach(meshes => setMeshVisibility(meshes, true));
            document.querySelectorAll('#parts-list .part-item').forEach(function(item) {
                const icon = item.querySelector('.visibility-icon');
                if (icon) {
                    setIcon(icon, 'icon-eye');
                    icon.classList.add('visible');
                }
            });
        };
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.onclick = function() {
            this.blur(); // Remove focus to hide tooltip
            Object.values(modelParts).forEach(meshes => setMeshVisibility(meshes, false));
            document.querySelectorAll('#parts-list .part-item').forEach(function(item) {
                const icon = item.querySelector('.visibility-icon');
                if (icon) {
                    setIcon(icon, 'icon-eye-off');
                    icon.classList.remove('visible');
                }
            });
        };
    }
    
    // Populate parts list with counts
    Object.keys(modelParts).sort().forEach(function(partName) {
        const meshes = modelParts[partName];
        const count = Array.isArray(meshes) ? meshes.length : 1;
        
        const item = document.createElement('div');
        item.className = 'part-item';
        item.dataset.partName = partName;
        
        // Create eye icon
        const icon = document.createElement('span');
        icon.className = 'visibility-icon visible';
        setIcon(icon, 'icon-eye');
        
        // Create part name text
        const displayName = count > 1 ? `${partName} x${count}` : partName;
        const text = document.createElement('span');
        text.className = 'part-name';
        text.textContent = displayName;
        
        // Toggle visibility on click
        item.addEventListener('click', function() {
            const isVisible = icon.classList.contains('visible');
            setMeshVisibility(meshes, !isVisible);
            
            if (isVisible) {
                setIcon(icon, 'icon-eye-off');
                icon.classList.remove('visible');
            } else {
                setIcon(icon, 'icon-eye');
                icon.classList.add('visible');
            }
        });
        
        item.appendChild(icon);
        item.appendChild(text);
        partsList.appendChild(item);
    });
}

// Color Manager - handles all color-related operations
const ColorManager = {
    // Store current colors (initialized from template data)
    colors: {
        primary: primaryColor,
        accent: accentColor,
        frame: frameColor,
        focus: focusColor,
        bg: bgColor
    },
    
    // Get color by type
    getColor: function(type) {
        return this.colors[type] || [127, 127, 127];
    },
    
    // Set color by type
    setColor: function(type, r, g, b) {
        this.colors[type] = [r, g, b];
        this.updateDisplay(type, r, g, b);
    },
    
    // Update color display elements
    updateDisplay: function(type, r, g, b) {
        const colorBox = document.getElementById(`${type}-color-box`);
        if (colorBox) {
            colorBox.style.background = `rgb(${r}, ${g}, ${b})`;
        }
        
        // Update color picker button background when accent color changes
        if (type === 'accent') {
            const colorPickerBtn = document.getElementById('open-color-picker');
            if (colorPickerBtn) {
                colorPickerBtn.style.background = `rgb(${r}, ${g}, ${b})`;
            }
        }
    },
    
    // Convert RGB array to hex string
    rgbToHex: function(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },
    
    // Convert hex string to RGB array
    hexToRgb: function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },
    
    // Build complete color array for all parts
    buildColorArray: function(includeFocus) {
        const allColors = [];
        const primaryColor = this.getColor('primary');
        const accentColor = this.getColor('accent');
        const frameColor = this.getColor('frame');
        
        // Add primary parts
        if (primaryParts.length > 0) {
            primaryParts.forEach(function(partName) {
                allColors.push({ part: partName, color: primaryColor });
            });
        }
        
        // Add accent parts
        if (accentParts.length > 0) {
            accentParts.forEach(function(partName) {
                allColors.push({ part: partName, color: accentColor });
            });
        }
        
        // Add frame parts
        if (frameParts.length > 0) {
            frameParts.forEach(function(partName) {
                allColors.push({ part: partName, color: frameColor });
            });
        }
        
        // Add focus parts if requested
        if (includeFocus) {
            const step = assemblySteps[currentStep];
            if (step && step.focus && step.focus.length > 0) {
                const focusColor = this.getColor('focus');
                step.focus.forEach(function(item) {
                    const partName = typeof item === 'string' ? item : item.part;
                    allColors.push({ part: partName, color: focusColor });
                });
            }
        }
        
        return allColors;
    }
};

// Animation Manager - handles blink animations
const AnimationManager = {
    runBlinkAnimation: function(baseColors, allColors, onComplete) {
        setFocusParts(allColors);
        
        let blinkCount = 0;
        const maxBlinks = 3;
        
        const interval = setInterval(function() {
            if (blinkCount < maxBlinks) {
                if (blinkCount % 2 === 0) {
                    setFocusParts(baseColors);
                } else {
                    setFocusParts(allColors);
                }
                blinkCount++;
            } else {
                setFocusParts(allColors);
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, 400);
        
        return interval;
    }
};

// Parts Manager - handles part visibility and icon updates
const PartsManager = {
    getPartNameFromItem: function(item) {
        return item.dataset.partName;
    },
    
    updateIcon: function(partName, visible) {
        document.querySelectorAll('#parts-list .part-item').forEach(function(item) {
            if (PartsManager.getPartNameFromItem(item) === partName) {
                const icon = item.querySelector('.visibility-icon');
                if (icon) {
                    if (visible) {
                        setIcon(icon, 'icon-eye');
                        icon.classList.add('visible');
                    } else {
                        setIcon(icon, 'icon-eye-off');
                        icon.classList.remove('visible');
                    }
                }
            }
        });
    },
    
    updateAllIcons: function(visiblePartNames, showAll) {
        document.querySelectorAll('#parts-list .part-item').forEach(function(item) {
            const icon = item.querySelector('.visibility-icon');
            if (!icon) return;
            
            if (showAll) {
                setIcon(icon, 'icon-eye');
                icon.classList.add('visible');
            } else {
                const partName = PartsManager.getPartNameFromItem(item);
                const visible = visiblePartNames.includes(partName);
                if (visible) {
                    setIcon(icon, 'icon-eye');
                    icon.classList.add('visible');
                } else {
                    setIcon(icon, 'icon-eye-off');
                    icon.classList.remove('visible');
                }
            }
        });
    },
    
    ensurePartVisible: function(partName) {
        if (!window.modelViewerParts || !window.modelViewerParts[partName]) return;
        
        toArray(window.modelViewerParts[partName]).forEach(function(mesh) {
            if (!mesh.visible) {
                mesh.visible = true;
                PartsManager.updateIcon(partName, true);
            }
        });
    }
};

// DOM Helper - utility functions for DOM operations
const DOMHelper = {
    setElementDisplay: function(elementId, display) {
        const el = document.getElementById(elementId);
        if (el) el.style.display = display;
    }
};

// Color Picker Manager - handles color picker interactions
const ColorPickerManager = {
    setupColorPicker: function() {
        const overlay = document.getElementById('color-picker-overlay');
        const openBtn = document.getElementById('open-color-picker');
        
        if (!overlay || !openBtn) return;
        
        // Toggle color picker visibility
        openBtn.addEventListener('click', function() {
            this.blur();
            
            // Check if the overlay is collapsed
            const overlayContent = document.querySelector('.model-overlay-content');
            const isCollapsed = overlayContent && overlayContent.classList.contains('collapsed');
            
            // If collapsed, expand the full overlay instead of just toggling colors
            if (isCollapsed) {
                const collapseBtn = document.getElementById('collapse-parts');
                if (collapseBtn) {
                    collapseBtn.click();
                }
                // Show the color picker
                if (!overlay.classList.contains('visible')) {
                    overlay.classList.add('visible');
                }
            } else {
                // Normal toggle behavior when expanded
                overlay.classList.toggle('visible');
            }
        });
        
        // Handle color input changes
        document.querySelectorAll('.color-input').forEach(function(input) {
            input.addEventListener('input', function() {
                const colorType = this.dataset.colorType;
                const rgb = ColorManager.hexToRgb(this.value);
                
                if (rgb) {
                    ColorManager.setColor(colorType, rgb[0], rgb[1], rgb[2]);
                    
                    // Apply colors to model
                    if (modelViewerInitialized && typeof setFocusParts === 'function') {
                        setFocusParts(ColorManager.buildColorArray(true));
                    }
                    
                    // Update background color if bg type is selected
                    if (colorType === 'bg' && window.scene) {
                        window.scene.background = new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
                    }
                }
            });
        });
    }
};

// UI Manager - handles UI interactions and controls
const UIManager = {
    showLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },
    
    hideLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    },
    
    setupNavigationButtons: function() {
        document.getElementById('prev-step').addEventListener('click', function() {
            if (currentStep > 0) {
                currentStep--;
                updateStep();
            }
        });
        
        document.getElementById('next-step').addEventListener('click', function() {
            const maxStep = assemblySteps.length - 1
            if (currentStep < maxStep) {
                currentStep++;
                updateStep();
            }
        });
    },
    
    setupToggleButton: function() {
        const toggleBtn = document.getElementById('toggle-focus');
        if (!toggleBtn) return;
        
        toggleBtn.addEventListener('click', function() {
            this.blur(); // Remove focus to hide tooltip
            // Reload the current step (same as next/prev but without changing currentStep)
            updateStep();
        });
    },
    
    setupCollapseButton: function() {
        const collapseBtn = document.getElementById('collapse-parts');
        const overlayContent = document.querySelector('.model-overlay-content');
        
        if (!collapseBtn || !overlayContent) return;
        
        // Start in collapsed state
        overlayContent.classList.add('collapsed');
        
        // Set initial icon for collapsed state
        collapseBtn.innerHTML = '';
        setIcon(collapseBtn, 'icon-chevron-right');
        collapseBtn.setAttribute('data-tooltip', 'Expand Panel');
        
        collapseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.blur();
            const isCollapsed = overlayContent.classList.toggle('collapsed');
            
            // Hide color picker when collapsing
            if (isCollapsed) {
                const colorPickerOverlay = document.getElementById('color-picker-overlay');
                if (colorPickerOverlay) {
                    colorPickerOverlay.classList.remove('visible');
                }
            }
            
            // Update icon and tooltip
            if (isCollapsed) {
                setIcon(collapseBtn, 'icon-chevron-right');
                collapseBtn.setAttribute('data-tooltip', 'Expand Panel');
            } else {
                setIcon(collapseBtn, 'icon-chevron-left');
                collapseBtn.setAttribute('data-tooltip', 'Collapse Panel');
            }
        });
    },
    
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', function(event) {
            // Toggle overlay with 'o' key
            if (event.key === 'o' || event.key === 'O') {
                event.preventDefault();
                event.stopPropagation();
                
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                
                const overlay = document.getElementById('camera-overlay');
                if (overlay) {
                    const isVisible = window.getComputedStyle(overlay).display !== 'none';
                    overlay.style.display = isVisible ? 'none' : 'block';
                }
            }
            
            // Copy parts list with 'p' key
            if (event.key === 'p' || event.key === 'P') {
                event.preventDefault();
                event.stopPropagation();
                
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                
                if (!window.modelViewerParts) {
                    console.log('No parts loaded yet');
                    return;
                }
                
                // Get all part names and format as YAML list
                const partNames = Object.keys(window.modelViewerParts).sort();
                const yamlList = partNames.map(name => `  - "${name}"`).join('\n');
                
                // Copy to clipboard
                navigator.clipboard.writeText(yamlList).then(function() {
                    console.log('Parts list copied to clipboard');
                    
                    // Visual feedback - flash the parts panel
                    const partsPanel = document.getElementById('parts-panel');
                    if (partsPanel) {
                        partsPanel.style.transition = 'background-color 0.2s';
                        partsPanel.style.backgroundColor = 'rgba(110, 255, 0, 0.2)';
                        setTimeout(function() {
                            partsPanel.style.backgroundColor = '';
                        }, 200);
                    }
                }).catch(function(err) {
                    console.error('Failed to copy parts list:', err);
                });
            }
        });
    }
}

// Function to initialize the model viewer (called on first step access)
function initializeModelViewer() {
    if (modelViewerInitialized) return;
    modelViewerInitialized = true;
    
    // Show loading overlay
    UIManager.showLoading();
    
    initModelViewer(
        modelFile, 
        function() {
            // This callback runs after the model is fully loaded
            
            // Hide loading overlay
            UIManager.hideLoading();
            
            // Populate the parts list in the overlay
            createVisibilityControls('visibility-controls', window.modelViewerParts);
            
            // Apply primary and accent colors to specified parts
            if (typeof setFocusParts === 'function') {
                const coloredParts = ColorManager.buildColorArray(false);
                if (coloredParts.length > 0) {
                    setFocusParts(coloredParts);
                }
            }
            
            updateStep();
        }
    );
}

function updateStep() {
    // Clear any previous blink animation
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
    
    const step = assemblySteps[currentStep];

    document.getElementById('step-counter').textContent = `Step ${currentStep + 1} of ${assemblySteps.length}`;
    
    // Update step title and description
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    if (stepTitle && step.title) {
        stepTitle.textContent = step.title;
    }
    if (stepDescription && step.description) {
        stepDescription.textContent = step.description;
    }

    if (!modelViewerInitialized) {
        initializeModelViewer();
        return; // Model initialization callback will call updateStep() again
    }
    
    // Show/hide navigation buttons
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const maxStep = assemblySteps.length - 1;
    
    if (prevBtn) {
        // Show previous button if: not on step 0, OR on step 0 with a selected subcategory
        const showPrev = currentStep > 0 || (currentStep === 0 && selectedSubCategory);
        prevBtn.style.display = showPrev ? 'inline-block' : 'none';
    }
    if (nextBtn) {
        const showNext = currentStep < maxStep;
        nextBtn.style.display = showNext ? 'inline-block' : 'none';
    }
    
    // Only update model-related things if model is initialized
    if (!modelViewerInitialized) return;
    
    // Update visible parts if specified
    if (typeof setVisibleParts === 'function') {
        setVisibleParts(step.visible || []);
    }
    
    // Update focus colors with blinking animation if specified
    if (typeof setFocusParts === 'function') {
        const baseColors = ColorManager.buildColorArray(false);
        
        if (step.focus && step.focus.length > 0) {
            const allColors = ColorManager.buildColorArray(true);
            blinkInterval = AnimationManager.runBlinkAnimation(baseColors, allColors, function() {
                blinkInterval = null;
            });
        } else {
            setFocusParts(baseColors);
        }
    }
    
    // Update focus color display
    if (step.focus && step.focus.length > 0) {
        const color = ColorManager.getColor('focus');
        ColorManager.updateDisplay('focus', color[0], color[1], color[2]);
    }
    
    // Recenter - skip camera positioning if we have YAML camera settings
    recenterScene(!!step.camera);
    
    // Store the recentered target BEFORE applying camera settings
    if (window.modelViewerControls) {
        window.initialTarget = window.modelViewerControls.target.clone();
    }
    
    // Apply camera settings from YAML if specified
    if (step.camera) {
        const camera = window.modelViewerCamera;
        const controls = window.modelViewerControls;
        
        if (camera && controls) {
            // Get camera settings
            const azimuth = step.camera.azimuth !== undefined ? step.camera.azimuth : null;
            const polar = step.camera.polar !== undefined ? step.camera.polar : null;
            const distance = step.camera.distance !== undefined ? step.camera.distance : null;
            const pan_x = step.camera.pan_x !== undefined ? step.camera.pan_x : 0;
            const pan_y = step.camera.pan_y !== undefined ? step.camera.pan_y : 0;
            
            // Convert screen-space pan to world-space and apply to target
            // Get camera's right and up vectors at the initial camera position
            const azimuthRad = THREE.MathUtils.degToRad(azimuth);
            const polarRad = THREE.MathUtils.degToRad(polar);
            
            // Calculate camera direction from spherical coords
            const camX = distance * Math.sin(polarRad) * Math.cos(azimuthRad);
            const camY = distance * Math.cos(polarRad);
            const camZ = distance * Math.sin(polarRad) * Math.sin(azimuthRad);
            const cameraDirection = new THREE.Vector3(-camX, -camY, -camZ).normalize();
            
            // Calculate camera right and up vectors
            const worldUp = new THREE.Vector3(0, 1, 0);
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(worldUp, cameraDirection).normalize();
            
            const cameraUp = new THREE.Vector3();
            cameraUp.crossVectors(cameraDirection, cameraRight).normalize();
            
            // Convert screen-space pan to world-space
            const worldPan = new THREE.Vector3();
            worldPan.addScaledVector(cameraRight, pan_x);
            worldPan.addScaledVector(cameraUp, pan_y);
            
            // Apply world-space pan to target
            controls.target.set(
                window.initialTarget.x + worldPan.x,
                window.initialTarget.y + worldPan.y,
                window.initialTarget.z + worldPan.z
            );
            
            // Apply camera position
            if (azimuth !== null && polar !== null && distance !== null) {
                const x = distance * Math.sin(polarRad) * Math.cos(azimuthRad);
                const y = distance * Math.cos(polarRad);
                const z = distance * Math.sin(polarRad) * Math.sin(azimuthRad);
                
                camera.position.set(
                    controls.target.x + x,
                    controls.target.y + y,
                    controls.target.z + z
                );
            }
            
            controls.update();
        }
    }
    
    // Store the initial camera position after applying settings
    if (window.modelViewerCamera) {
        window.initialCameraPosition = window.modelViewerCamera.position.clone();
    }
}

// Function to update TOC active state
function updateTOCActiveState(subcategoryKey) {
    // Remove active class from all TOC links
    document.querySelectorAll('.md-nav__link').forEach(function(link) {
        link.classList.remove('md-nav__link--active');
    });
    
    if (subcategoryKey) {
        // Find and activate the TOC link for this subcategory
        const normalizedKey = subcategoryKey.toLowerCase().replace(/\s+/g, '-');
        const tocLinks = document.querySelectorAll('.md-nav__link[href="#' + normalizedKey + '"]');
        tocLinks.forEach(function(link) {
            link.classList.add('md-nav__link--active');
        });
    }
}

// Setup event listeners on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeModelViewer();

    
    // Setup button icons
    const selectAllBtn = document.getElementById('select-all-parts');
    const deselectAllBtn = document.getElementById('deselect-all-parts');
    const toggleBtn = document.getElementById('toggle-focus');
    const colorPickerBtn = document.getElementById('open-color-picker');
    
    if (selectAllBtn) {
        selectAllBtn.innerHTML = '';
        setIcon(selectAllBtn, 'icon-eye');
    }
    if (deselectAllBtn) {
        deselectAllBtn.innerHTML = '';
        setIcon(deselectAllBtn, 'icon-eye-off');
    }
    if (toggleBtn) {
        toggleBtn.innerHTML = '';
        setIcon(toggleBtn, 'icon-refresh');
    }
    if (colorPickerBtn) {
        colorPickerBtn.innerHTML = '';
        setIcon(colorPickerBtn, 'icon-palette');
        // Set initial background to accent color
        const accentColor = ColorManager.getColor('accent');
        colorPickerBtn.style.background = `rgb(${accentColor[0]}, ${accentColor[1]}, ${accentColor[2]})`;
    }
    
    // Setup color picker
    ColorPickerManager.setupColorPicker();
    
    // Setup UI controls
    UIManager.setupNavigationButtons();
    UIManager.setupToggleButton();
    UIManager.setupCollapseButton();
    UIManager.setupKeyboardShortcuts();
    
    // Setup camera overlay click to copy
    const cameraOverlay = document.getElementById('camera-overlay');
    if (cameraOverlay) {
        cameraOverlay.addEventListener('click', function() {
            if (!window.modelViewerCamera || !window.modelViewerControls) return;
            
            const pos = window.modelViewerCamera.position;
            const target = window.modelViewerControls.target;
            
            // Calculate relative position
            const relX = pos.x - target.x;
            const relY = pos.y - target.y;
            const relZ = pos.z - target.z;
            
            // Calculate spherical coordinates
            const distance = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
            const polar = THREE.MathUtils.radToDeg(Math.acos(relY / distance));
            const azimuth = THREE.MathUtils.radToDeg(Math.atan2(relZ, relX));
            const normalizedAzimuth = azimuth < 0 ? azimuth + 360 : azimuth;
            
            // Calculate pan offset in camera screen space (same as overlay display)
            let panX = 0, panY = 0;
            if (window.initialTarget && window.modelViewerCamera) {
                // Get world-space pan offset
                const worldPanX = target.x - window.initialTarget.x;
                const worldPanY = target.y - window.initialTarget.y;
                const worldPanZ = target.z - window.initialTarget.z;
                
                // Transform to camera space
                const camera = window.modelViewerCamera;
                const cameraDirection = new THREE.Vector3();
                camera.getWorldDirection(cameraDirection);
                
                const cameraRight = new THREE.Vector3();
                cameraRight.crossVectors(camera.up, cameraDirection).normalize();
                
                const cameraUp = new THREE.Vector3();
                cameraUp.crossVectors(cameraDirection, cameraRight).normalize();
                
                // Project world pan onto camera axes
                const worldPan = new THREE.Vector3(worldPanX, worldPanY, worldPanZ);
                panX = worldPan.dot(cameraRight);
                panY = worldPan.dot(cameraUp);
            }
            
            // Format as YAML
            const yamlText = `    camera:
      azimuth: ${Math.round(normalizedAzimuth)}
      polar: ${Math.round(polar)}
      distance: ${Math.round(distance)}
      pan_x: ${panX.toFixed(2)}
      pan_y: ${panY.toFixed(2)}
      pan_z: 0.00`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(yamlText).then(function() {
                // Visual feedback
                const originalBg = cameraOverlay.style.background;
                cameraOverlay.style.background = 'rgba(0, 150, 0, 0.85)';
                setTimeout(function() {
                    cameraOverlay.style.background = originalBg;
                }, 200);
            }).catch(function(err) {
                console.error('Failed to copy to clipboard:', err);
            });
        });
    }
});

function recenterScene(skipCameraPosition = true) {
    if (!window.scene || !window.modelViewerCamera || !window.modelViewerControls) {
        console.warn('Scene not initialized');
        return;
    }

    const camera = window.modelViewerCamera;
    const controls = window.modelViewerControls;
    const scene = window.scene;

    // Collect all visible mesh objects
    const visibleMeshes = [];
    scene.traverse(function(object) {
        if ((object.isMesh || object.isSkinnedMesh) && object.visible) {
            // Check if any parent is invisible
            let parent = object.parent;
            let isVisible = true;
            while (parent) {
                if (parent.visible === false) {
                    isVisible = false;
                    break;
                }
                parent = parent.parent;
            }
            if (isVisible) {
                visibleMeshes.push(object);
            }
        }
    });

    if (visibleMeshes.length === 0) {
        console.warn('No visible meshes found in scene');
        return;
    }

    // Calculate bounding box of visible objects only
    const box = new THREE.Box3();
    visibleMeshes.forEach(function(mesh) {
        box.expandByObject(mesh);
    });

    // Get center and size of visible geometry
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;

    // Update orbit controls target to new center
    controls.target.copy(center);

    // Calculate optimal camera distance based on FOV
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = (radius / Math.tan(fov / 2)) * 1.25;

    // Only reposition camera if not skipping (i.e., no explicit camera settings)
    if (!skipCameraPosition) {
        // Move camera to new position (maintaining relative angle to target)
        const currentOffset = camera.position.clone().sub(controls.target);
        const currentDistance = currentOffset.length();
        
        if (currentDistance > 0) {
            // Scale the offset to the new distance
            currentOffset.normalize().multiplyScalar(distance);
            camera.position.copy(center).add(currentOffset);
        } else {
            // Fallback if camera is at target
            camera.position.set(distance, distance * 0.35, distance).add(center);
        }
    }

    // Update camera near/far planes
    camera.near = Math.max(distance / 100, 0.1);
    camera.far = distance * 10;
    camera.updateProjectionMatrix();

    // Update directional lights to follow the orbit controls target
    scene.traverse(function(object) {
        if (object.isDirectionalLight && object.userData.lightKey) {
            // Get the original light direction
            const lightKey = object.userData.lightKey;
            const direction = window.lightDirections[lightKey];
            
            if (direction) {
                // Position light at appropriate distance from the orbit target
                const lightDistance = distance * 2;
                object.position.copy(direction.clone().multiplyScalar(lightDistance)).add(controls.target);
                
                // If light has a target, update it to the orbit controls target
                if (object.target) {
                    object.target.position.copy(controls.target);
                    object.target.updateMatrixWorld();
                }
            }
        }
    });

    controls.update();
}