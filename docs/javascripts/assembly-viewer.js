// Assembly Viewer JavaScript
// This file contains all the JavaScript logic for the 3D assembly viewer

// Global variables
var modelFile = window.assemblyViewerData?.modelFile || '';
var assemblySteps = window.assemblyViewerData?.assemblySteps || [];
var bgColor = window.assemblyViewerData?.bgColor || [127, 127, 127];
var primaryParts = window.assemblyViewerData?.primaryParts || [];
var accentParts = window.assemblyViewerData?.accentParts || [];
var frameParts = window.assemblyViewerData?.frameParts || [];
var transparentParts = window.assemblyViewerData?.transparentParts || {};
var primaryColor = window.assemblyViewerData?.primaryColor || [37, 13, 63];
var accentColor = window.assemblyViewerData?.accentColor || [110, 63, 163];
var frameColor = window.assemblyViewerData?.frameColor || [127, 127, 127];
var focusColor = window.assemblyViewerData?.focusColor || [110, 255, 0];

// Global reference to viewer controls for external access
window.modelViewerControls = null;
window.modelViewerCamera = null;
window.modelViewerParts = null;
window.scene = null;
window.originalPartColors = {}; // Store original colors for reset
window.lightDirections = {}; // Store original light directions
window.initialCameraPosition = null; // Store initial camera position after recenter
window.initialTarget = null; // Store initial orbit target after recenter
window.referenceViewportSize = null; // Store viewport size when camera settings were applied
window.baseDistance = null; // Store the base distance from YAML

var currentStep = 0;
var blinkInterval = null;
var modelViewerInitialized = false;
var cameraOverlayHandler = null;
var resizeHandler = null;
var needsRenderGlobal = false; // Global flag for triggering renders from outside animate loop
var renderFramesRemaining = 0; // Counter for forcing multiple renders during animations

// Distance scaling configuration
// Controls how much the camera distance scales with viewport size changes
// 1.0 = full scaling (distance scales proportionally with viewport size)
// 0.5 = half scaling (distance changes less aggressively)
// 0.0 = no scaling (distance stays constant regardless of viewport size)
var distanceScaleRatio = 1.6;

// Reference viewport size - represents the typical size of the model-viewer container element
var referenceFullViewportSize = {
    width: 800,
    height: 600
};

// Light positions
const lightValues = {
    // Key light: Strong from upper front-right (primary light source)
    keyLight: {position: [1.5, 2, 1.5], intensity: 2.5, color: 0xffffff},
    // Fill light: Softer from upper front-left (reduces harsh shadows)
    fillLight: {position: [-1, 1.5, 1], intensity: 2, color: 0xffffff},
    // Rim light: Subtle from back-top (edge definition)
    rimLight: {position: [0, 1.5, -2], intensity: 1.0, color: 0xffffff},
    // Bottom bounce: Very subtle upward light (simulates ground reflection)
    bounceLight: {position: [0, -1, 0.5], intensity: 0.5, color: 0xffffff}
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

// Helper function to create gradient background texture
function createGradientBackground(rgbColor) {
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 2;
    gradientCanvas.height = 256;
    const gradientContext = gradientCanvas.getContext('2d');
    const gradient = gradientContext.createLinearGradient(0, 0, 0, 256);
    
    const baseColor = new THREE.Color(rgbColor[0] / 255, rgbColor[1] / 255, rgbColor[2] / 255);
    const topColor = baseColor.clone().multiplyScalar(1.2);  // 20% brighter at top
    const bottomColor = baseColor.clone().multiplyScalar(0.2);  // 80% darker at bottom
    
    gradient.addColorStop(0, `rgb(${Math.min(255, topColor.r * 255)}, ${Math.min(255, topColor.g * 255)}, ${Math.min(255, topColor.b * 255)})`);
    gradient.addColorStop(1, `rgb(${bottomColor.r * 255}, ${bottomColor.g * 255}, ${bottomColor.b * 255})`);
    
    gradientContext.fillStyle = gradient;
    gradientContext.fillRect(0, 0, 2, 256);
    
    return new THREE.CanvasTexture(gradientCanvas);
}

// Reusable vectors for updateCameraOverlay to avoid object creation
const overlayTempDir = new THREE.Vector3();
const overlayTempRight = new THREE.Vector3();
const overlayTempUp = new THREE.Vector3();
const overlayTempPan = new THREE.Vector3();

// Function to update camera overlay display
function updateCameraOverlay() {
    const azimuthEl = document.getElementById('overlay-azimuth');
    const polarEl = document.getElementById('overlay-polar');
    const distanceEl = document.getElementById('overlay-distance');
    const panXEl = document.getElementById('overlay-pan-x');
    const panYEl = document.getElementById('overlay-pan-y');
    
    if (!azimuthEl || !polarEl || !distanceEl || !panXEl || !panYEl || !window.modelViewerCamera || !window.modelViewerControls) return;
    
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
        // Get camera's right and up vectors (reuse vectors)
        const camera = window.modelViewerCamera;
        camera.getWorldDirection(overlayTempDir);
        
        overlayTempRight.crossVectors(camera.up, overlayTempDir).normalize();
        overlayTempUp.crossVectors(overlayTempDir, overlayTempRight).normalize();
        
        // Project world pan onto camera axes (reuse vector)
        overlayTempPan.set(worldPanX, worldPanY, worldPanZ);
        const screenPanX = overlayTempPan.dot(overlayTempRight);
        const screenPanY = overlayTempPan.dot(overlayTempUp);
        
        panXEl.textContent = screenPanX.toFixed(2);
        panYEl.textContent = screenPanY.toFixed(2);
    } else {
        panXEl.textContent = '0.00';
        panYEl.textContent = '0.00';
    }
}

// Function to set which parts are visible
function setVisibleParts(visiblePartNames, showAll) {
    if (!window.modelViewerParts) return;
    
    Object.keys(window.modelViewerParts).forEach(function(partName) {
        const meshes = window.modelViewerParts[partName];
        const shouldBeVisible = showAll || visiblePartNames.includes(partName);
        setMeshVisibility(meshes, shouldBeVisible);
    });
    
    // Update visibility icons to match visibility
    PartsManager.updateAllIcons(visiblePartNames, showAll);
    
    // Trigger multiple renders to ensure visual update
    needsRenderGlobal = true;
    renderFramesRemaining = 5;
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
    
    // Trigger multiple renders to ensure visual update during animations
    needsRenderGlobal = true;
    renderFramesRemaining = 5; // Render for 5 frames to ensure visibility
    
    // Apply colors from the array
    if (!focusArray || focusArray.length === 0) return;
    
    focusArray.forEach(function(focusItem) {
        const partName = focusItem.part;
        const color = focusItem.color;
        
        if (!partName || !color || !window.modelViewerParts[partName]) return;
        
        const threeColor = new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255);
        
        toArray(window.modelViewerParts[partName]).forEach(function(mesh) {
            mesh.traverse(function(child) {
                if (child.isMesh && child.material) {
                    // Just modify the color directly - no cloning needed
                    applyColorToMaterial(child.material, threeColor);
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

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 2000);
    window.modelViewerCamera = camera; // Make camera globally accessible
    camera.position.set(0, 50, 100);

    // Renderer setup - prioritize performance over quality
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'low-power' // Prefer integrated GPU for better battery/performance
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Limit pixel ratio to 1.5 for better performance (lower = faster)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.borderRadius = '8px'; // Match container border-radius
    container.appendChild(renderer.domElement);

    // Create gradient background (lighter at top, darker at bottom)
    const bgColorArray = ColorManager.getColor('bg');
    scene.background = createGradientBackground(bgColorArray);

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping;  // Disable tone mapping for accurate colors
    renderer.toneMappingExposure = 1.0;
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    

    // Add ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Lights
    Object.keys(lightValues).forEach(function(key) {
        const config = lightValues[key];
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
    window.modelViewerControls = controls; // Make controls globally accessible
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Load glTF/GLB model
    const gltfLoader = new THREE.GLTFLoader();
    
    // Setup DRACOLoader for compressed models
    if (typeof THREE.DRACOLoader !== 'undefined') {
        const dracoLoader = new THREE.DRACOLoader();
        // Use CDN for Draco decoder files
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        gltfLoader.setDRACOLoader(dracoLoader);
    }

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
            
            // Store original colors for all meshes, clone materials to prevent sharing, and add edge lines
            root.traverse(function(child) {
                if (child.isMesh && child.material) {
                    // Enable frustum culling for better performance
                    child.frustumCulled = true;
                    
                    // Clone materials to prevent shared materials between parts
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(function(mat) { return mat.clone(); });
                        // Store first material's color as representative
                        window.originalPartColors[child.uuid] = child.material[0].color.clone();
                    } else {
                        child.material = child.material.clone();
                        window.originalPartColors[child.uuid] = child.material.color.clone();
                    }
                    
                    // Add black edge lines to the mesh with higher threshold for fewer edges
                    const edges = new THREE.EdgesGeometry(child.geometry, 30); // 30 degree threshold - fewer edges for better performance
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
                    const edgeLines = new THREE.LineSegments(edges, lineMaterial);
                    edgeLines.renderOrder = 1; // Render edges after the mesh
                    edgeLines.frustumCulled = true; // Enable culling for edges too
                    child.add(edgeLines);
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
            
            // Trigger initial render now that model is loaded and positioned
            needsRenderGlobal = true;
            
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

    // Track camera position to detect changes (make global so updateStep can access)
    window.lastCameraPosition = camera.position.clone();
    window.lastCameraQuaternion = camera.quaternion.clone();
    let needsRender = true; // Flag to track if we need to render
    
    // Reusable vector to avoid object creation in loops/animate
    const tempVector = new THREE.Vector3();
    
    // Request render on control changes
    controls.addEventListener('change', function() {
        needsRender = true;
    });
    
    // Function to update light positions (only called when camera moves)
    function updateLightPositions() {
        scene.children.forEach(function(child) {
            if (child.isDirectionalLight && child.userData.lightKey) {
                const lightKey = child.userData.lightKey;
                const direction = window.lightDirections[lightKey];
                if (direction) {
                    // Transform light direction from world space to camera space
                    // Reuse tempVector to avoid creating new objects
                    tempVector.copy(direction);
                    tempVector.applyQuaternion(camera.quaternion);
                    
                    // Position light relative to camera
                    const lightDistance = 100;
                    tempVector.multiplyScalar(lightDistance);
                    child.position.copy(camera.position).add(tempVector);
                }
            }
        });
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls (this sets needsRender via the change event if camera moved)
        if (controls.enableDamping) {
            controls.update();
        }
        
        // Only update lights and overlay if camera has moved
        if (!camera.position.equals(window.lastCameraPosition) || !camera.quaternion.equals(window.lastCameraQuaternion)) {
            updateLightPositions();
            updateCameraOverlay();
            window.lastCameraPosition.copy(camera.position);
            window.lastCameraQuaternion.copy(camera.quaternion);
            needsRender = true;
        }
        
        // Check global render flag (set by animations, visibility changes, etc.)
        if (needsRenderGlobal) {
            needsRender = true;
            needsRenderGlobal = false;
        }
        
        // Check if we need to keep rendering for animation visibility
        if (renderFramesRemaining > 0) {
            needsRender = true;
            renderFramesRemaining--;
        }
        
        // Only render if something changed
        if (needsRender) {
            renderer.render(scene, camera);
            needsRender = false;
        }
    }
    animate();

    // Handle window resize - remove old handler first
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
    }
    resizeHandler = function () {
        if (!container.clientWidth || !container.clientHeight) return;
        
        // Calculate scale factor based on viewport size change
        // Use the smaller dimension to determine scale (maintains framing in both orientations)
        if (window.referenceViewportSize && window.baseDistance) {
            const currentSize = Math.min(container.clientWidth, container.clientHeight);
            const referenceSize = Math.min(window.referenceViewportSize.width, window.referenceViewportSize.height);
            const rawScaleFactor = referenceSize / currentSize;
            
            // Apply the configurable ratio to control how much scaling occurs
            // scaleFactor = 1 + (rawScaleFactor - 1) * ratio
            // When ratio = 1.0: full scaling
            // When ratio = 0.5: half the scaling effect
            // When ratio = 0.0: no scaling (scaleFactor = 1.0)
            const scaleFactor = 1 + (rawScaleFactor - 1) * distanceScaleRatio;
            
            // Scale the distance: smaller viewport = larger distance (object appears same size)
            const scaledDistance = window.baseDistance * scaleFactor;
            
            // Get current camera position in spherical coordinates
            const pos = camera.position;
            const target = controls.target;
            const relX = pos.x - target.x;
            const relY = pos.y - target.y;
            const relZ = pos.z - target.z;
            
            const currentDistance = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
            const polar = Math.acos(relY / currentDistance);
            const azimuth = Math.atan2(relZ, relX);
            
            // Reposition camera at scaled distance with same angles
            const x = scaledDistance * Math.sin(polar) * Math.cos(azimuth);
            const y = scaledDistance * Math.cos(polar);
            const z = scaledDistance * Math.sin(polar) * Math.sin(azimuth);
            
            camera.position.set(
                target.x + x,
                target.y + y,
                target.z + z
            );
            
            controls.update();
        }
        
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        // Trigger render after resize
        needsRenderGlobal = true;
        renderFramesRemaining = 2;
    };
    window.addEventListener('resize', resizeHandler);

}

// Populate visibility controls
function createVisibilityControls(modelParts) {
    const partsList = document.getElementById('parts-list');
    if (!partsList) return;
    
    // Clear existing parts list to prevent duplicates
    partsList.innerHTML = '';

    // Wire up All/None buttons - using onclick to automatically replace old handlers
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
            // Trigger renders to show the change
            needsRenderGlobal = true;
            renderFramesRemaining = 5;
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
            // Trigger renders to show the change
            needsRenderGlobal = true;
            renderFramesRemaining = 5;
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
            // Look up meshes from global reference to avoid stale closures
            const currentMeshes = window.modelViewerParts ? window.modelViewerParts[partName] : null;
            if (!currentMeshes) return;
            
            const isVisible = icon.classList.contains('visible');
            setMeshVisibility(currentMeshes, !isVisible);
            
            if (isVisible) {
                setIcon(icon, 'icon-eye-off');
                icon.classList.remove('visible');
            } else {
                setIcon(icon, 'icon-eye');
                icon.classList.add('visible');
            }
            
            // Trigger renders to show the change
            needsRenderGlobal = true;
            renderFramesRemaining = 5;
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
    
    // localStorage key for global colors
    storageKey: 'assemblyViewerColors',
    
    // Load colors from localStorage
    loadFromStorage: function() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const savedColors = JSON.parse(stored);
                // Merge saved colors with current colors
                Object.keys(savedColors).forEach(function(key) {
                    if (ColorManager.colors[key]) {
                        ColorManager.colors[key] = savedColors[key];
                    }
                });
                return true;
            }
        } catch (e) {
            console.warn('Failed to load colors from localStorage:', e);
        }
        return false;
    },
    
    // Save colors to localStorage
    saveToStorage: function() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.colors));
        } catch (e) {
            console.warn('Failed to save colors to localStorage:', e);
        }
    },
    
    // Reset colors to template defaults
    resetToDefaults: function() {
        // Clear localStorage
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('Failed to clear colors from localStorage:', e);
        }
        
        // Reset to template defaults (from global variables)
        this.colors.primary = primaryColor;
        this.colors.accent = accentColor;
        this.colors.frame = frameColor;
        this.colors.focus = focusColor;
        this.colors.bg = bgColor;
        
        return this.colors;
    },
    
    // Get color by type
    getColor: function(type) {
        return this.colors[type] || [127, 127, 127];
    },
    
    // Set color without saving (for live preview)
    setColorWithoutSave: function(type, r, g, b) {
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
};

// Color Picker Manager - handles color picker interactions
const ColorPickerManager = {
    colorPickerHandler: null,
    resetButtonHandler: null,
    pendingColorUpdate: false,
    colorInputHandlers: new Map(),
    
    setupColorPicker: function() {
        const overlay = document.getElementById('color-picker-overlay');
        const openBtn = document.getElementById('open-color-picker');
        
        if (!overlay || !openBtn) return;
        
        // Remove old handler if exists
        if (this.colorPickerHandler) {
            openBtn.removeEventListener('click', this.colorPickerHandler);
        }
        
        // Create and store new handler
        this.colorPickerHandler = function() {
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
                const overlay = document.getElementById('color-picker-overlay');
                if (overlay && !overlay.classList.contains('visible')) {
                    overlay.classList.add('visible');
                }
            } else {
                // Normal toggle behavior when expanded
                const overlay = document.getElementById('color-picker-overlay');
                if (overlay) {
                    overlay.classList.toggle('visible');
                }
            }
        };
        
        // Add the handler
        openBtn.addEventListener('click', this.colorPickerHandler);
        
        // Remove old color input handlers
        this.colorInputHandlers.forEach(function(handlers, input) {
            input.removeEventListener('input', handlers.input);
            input.removeEventListener('change', handlers.change);
        });
        this.colorInputHandlers.clear();
        
        // Handle color input changes
        const self = this;
        document.querySelectorAll('.color-input').forEach(function(input) {
            // Create handlers
            const inputHandler = function() {
                const colorType = this.dataset.colorType;
                const rgb = ColorManager.hexToRgb(this.value);
                
                if (rgb) {
                    // Always update the color value immediately
                    ColorManager.setColorWithoutSave(colorType, rgb[0], rgb[1], rgb[2]);
                    
                    // Only update model if color picker is visible
                    const overlay = document.getElementById('color-picker-overlay');
                    if (!overlay || !overlay.classList.contains('visible')) {
                        return; // Don't update model if picker isn't visible
                    }
                    
                    // Throttle expensive operations with requestAnimationFrame
                    if (!ColorPickerManager.pendingColorUpdate) {
                        ColorPickerManager.pendingColorUpdate = true;
                        
                        requestAnimationFrame(function() {
                            ColorPickerManager.pendingColorUpdate = false;
                            
                            // Apply colors to model
                            if (modelViewerInitialized && typeof setFocusParts === 'function') {
                                setFocusParts(ColorManager.buildColorArray(true));
                            }
                            
                            // Update background color if bg type is selected
                            if (colorType === 'bg' && window.scene) {
                                const currentRgb = ColorManager.getColor('bg');
                                window.scene.background = createGradientBackground(currentRgb);
                            }
                        });
                    }
                }
            };
            
            const changeHandler = function() {
                // Apply colors when done (in case picker was closed)
                if (modelViewerInitialized && typeof setFocusParts === 'function') {
                    setFocusParts(ColorManager.buildColorArray(true));
                }
                ColorManager.saveToStorage();
            };
            
            // Store handlers
            self.colorInputHandlers.set(input, {
                input: inputHandler,
                change: changeHandler
            });
            
            // Add event listeners
            input.addEventListener('input', inputHandler);
            input.addEventListener('change', changeHandler);
        });
        
        // Handle reset button
        const resetBtn = document.getElementById('reset-colors');
        if (resetBtn) {
            // Remove old handler if exists
            if (this.resetButtonHandler) {
                resetBtn.removeEventListener('click', this.resetButtonHandler);
            }
            
            // Create and store new handler
            this.resetButtonHandler = function() {
                this.blur();
                
                // Reset colors to template defaults
                ColorManager.resetToDefaults();
                
                // Update all color picker inputs and displays
                ['primary', 'accent', 'frame', 'focus', 'bg'].forEach(function(type) {
                    const color = ColorManager.getColor(type);
                    const colorInput = document.querySelector(`.color-input[data-color-type="${type}"]`);
                    const colorBox = document.getElementById(`${type}-color-box`);
                    
                    if (colorInput) {
                        colorInput.value = ColorManager.rgbToHex(color[0], color[1], color[2]);
                    }
                    if (colorBox) {
                        colorBox.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    }
                });
                
                // Update accent color on color picker button
                const colorPickerBtn = document.getElementById('open-color-picker');
                if (colorPickerBtn) {
                    const accentColor = ColorManager.getColor('accent');
                    colorPickerBtn.style.background = `rgb(${accentColor[0]}, ${accentColor[1]}, ${accentColor[2]})`;
                }
                
                // Apply colors to model
                if (modelViewerInitialized && typeof setFocusParts === 'function') {
                    setFocusParts(ColorManager.buildColorArray(true));
                }
                
                // Update background
                if (window.scene) {
                    const bgColorArray = ColorManager.getColor('bg');
                    window.scene.background = createGradientBackground(bgColorArray);
                }
            };
            
            // Add the handler
            resetBtn.addEventListener('click', this.resetButtonHandler);
        }
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
    
    prevButtonHandler: null,
    nextButtonHandler: null,
    
    setupNavigationButtons: function() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        if (!prevBtn || !nextBtn) return;
        
        // Remove old handlers if they exist
        if (this.prevButtonHandler) {
            prevBtn.removeEventListener('click', this.prevButtonHandler);
        }
        if (this.nextButtonHandler) {
            nextBtn.removeEventListener('click', this.nextButtonHandler);
        }
        
        // Create and store new handlers
        this.prevButtonHandler = function() {
            if (currentStep > 0) {
                currentStep--;
                updateStepHash();
                updateStep();
            }
        };
        
        this.nextButtonHandler = function() {
            const maxStep = assemblySteps.length - 1;
            if (currentStep < maxStep) {
                currentStep++;
                updateStepHash();
                updateStep();
            }
        };
        
        // Add the handlers
        prevBtn.addEventListener('click', this.prevButtonHandler);
        nextBtn.addEventListener('click', this.nextButtonHandler);
    },
    
    toggleButtonHandler: null,
    
    setupToggleButton: function() {
        const toggleBtn = document.getElementById('toggle-focus');
        if (!toggleBtn) return;
        
        // Remove old handler if exists
        if (this.toggleButtonHandler) {
            toggleBtn.removeEventListener('click', this.toggleButtonHandler);
        }
        
        // Create and store new handler
        this.toggleButtonHandler = function() {
            this.blur(); // Remove focus to hide tooltip
            // Reload the current step (same as next/prev but without changing currentStep)
            updateStep();
        };
        
        // Add the handler
        toggleBtn.addEventListener('click', this.toggleButtonHandler);
    },
    
    collapseButtonHandler: null,
    
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
        
        // Remove old handler if exists
        if (this.collapseButtonHandler) {
            collapseBtn.removeEventListener('click', this.collapseButtonHandler);
        }
        
        // Create and store new handler
        this.collapseButtonHandler = function(e) {
            e.stopPropagation();
            this.blur();
            
            // Query for overlayContent inside handler to avoid stale references
            const overlayContent = document.querySelector('.model-overlay-content');
            if (!overlayContent) return;
            
            const isCollapsed = overlayContent.classList.toggle('collapsed');
            
            // Hide color picker when collapsing
            if (isCollapsed) {
                const colorPickerOverlay = document.getElementById('color-picker-overlay');
                if (colorPickerOverlay) {
                    colorPickerOverlay.classList.remove('visible');
                }
            }
            
            // Update icon and tooltip
            const collapseBtn = document.getElementById('collapse-parts');
            if (collapseBtn) {
                if (isCollapsed) {
                    setIcon(collapseBtn, 'icon-chevron-right');
                    collapseBtn.setAttribute('data-tooltip', 'Expand Panel');
                } else {
                    setIcon(collapseBtn, 'icon-chevron-left');
                    collapseBtn.setAttribute('data-tooltip', 'Collapse Panel');
                }
            }
        };
        
        // Add the handler
        collapseBtn.addEventListener('click', this.collapseButtonHandler);
    },
    
    keyboardHandler: null,
    
    setupKeyboardShortcuts: function() {
        // Remove existing handler if present
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        // Create new handler
        this.keyboardHandler = function(event) {
            // Only handle if we're on an assembly viewer page
            if (!document.getElementById('model-viewer')) return;
            
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
                
                // Get only visible part names and format as YAML list
                const visiblePartNames = Object.keys(window.modelViewerParts).filter(function(partName) {
                    const meshes = window.modelViewerParts[partName];
                    // Check if at least one mesh in this part is visible
                    const meshArray = Array.isArray(meshes) ? meshes : [meshes];
                    return meshArray.some(function(mesh) {
                        return mesh.visible;
                    });
                }).sort();
                const yamlList = visiblePartNames.map(name => `      - "${name}"`).join('\n');
                
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
        };
        
        // Add the handler
        document.addEventListener('keydown', this.keyboardHandler);
    }
}

// Function to initialize the model viewer (called on first step access)
function initializeModelViewer() {
    if (modelViewerInitialized) return;
    modelViewerInitialized = true;
    
    // Show loading overlay
    UIManager.showLoading();
    
    // Defer model loading until browser is idle to avoid blocking the main thread
    const loadModel = function() {
        initModelViewer(
        modelFile, 
        function() {
            // This callback runs after the model is fully loaded
            
            // Hide loading overlay
            UIManager.hideLoading();
            
            // Populate the parts list in the overlay
            createVisibilityControls(window.modelViewerParts);
            
            // Don't call updateStep here - it will be called and will handle colors
            updateStep();
        }
    );
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(loadModel, { timeout: 1000 });
    } else {
        setTimeout(loadModel, 100);
    }
}

// Helper function to update URL hash
function updateStepHash() {
    const stepNum = currentStep + 1; // Convert to 1-indexed
    const newHash = `#step-${stepNum}`;
    if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
    }
}

function updateStep() {
    // Clear any previous blink animation
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
        
    const step = assemblySteps[currentStep];

    document.getElementById('step-counter').textContent = `Step ${currentStep + 1} of ${assemblySteps.length}`;
        
    // Update step description
    const stepDescription = document.getElementById('step-description');
    if (stepDescription && step.description) {
        // Convert markdown links [text](url){target="_blank"} to HTML links with target attribute
        // First handle links with target="_blank" attribute
        let htmlDescription = step.description.replace(/\[([^\]]+)\]\(([^)]+)\)\{target="_blank"\}/g, '<a href="$2" target="_blank">$1</a>');
        // Then handle regular links without attributes
        htmlDescription = htmlDescription.replace(/\[([^\]]+)\]\(([^)]+)\)(?!\{)/g, '<a href="$2">$1</a>');
        stepDescription.innerHTML = htmlDescription;
    }

    if (!modelViewerInitialized) {
        initializeModelViewer();
        return; // Model initialization callback will call updateStep() again
    }
    
    // Enable/disable navigation buttons
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const maxStep = assemblySteps.length - 1;
    
    if (prevBtn) {
        // Enable previous button if not on step 0
        const canGoPrev = currentStep > 0;
        prevBtn.disabled = !canGoPrev;
    }
    if (nextBtn) {
        const canGoNext = currentStep < maxStep;
        nextBtn.disabled = !canGoNext;
    }
    
    // Only update model-related things if model is initialized
    if (!modelViewerInitialized) return;
    
    // Update visible parts if specified
    if (typeof setVisibleParts === 'function') {
        const visibleParts = step.visible || [];
        // Empty array means show all parts
        const showAll = visibleParts.length === 0;
        setVisibleParts(visibleParts, showAll);
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
            // Apply base colors (primary, accent, frame)
            if (baseColors.length > 0) {
                setFocusParts(baseColors);
            }
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
            
            // Apply camera position with initial scaling based on viewport size
            if (azimuth !== null && polar !== null && distance !== null) {
                // Get current viewport size
                const container = document.getElementById('model-viewer');
                let scaledDistance = distance;
                
                if (container) {
                    // Calculate scale factor based on current viewport vs reference viewport
                    const currentSize = Math.min(container.clientWidth, container.clientHeight);
                    const referenceSize = Math.min(referenceFullViewportSize.width, referenceFullViewportSize.height);
                    const rawScaleFactor = referenceSize / currentSize;
                    
                    // Apply the configurable ratio to control how much scaling occurs
                    const scaleFactor = 1 + (rawScaleFactor - 1) * distanceScaleRatio;
                    
                    // Scale the distance for initial load
                    scaledDistance = distance * scaleFactor;
                }
                
                const x = scaledDistance * Math.sin(polarRad) * Math.cos(azimuthRad);
                const y = scaledDistance * Math.cos(polarRad);
                const z = scaledDistance * Math.sin(polarRad) * Math.sin(azimuthRad);
                
                camera.position.set(
                    controls.target.x + x,
                    controls.target.y + y,
                    controls.target.z + z
                );
            }
            
            controls.update();
            
            // Store the reference viewport size (from config) and base distance for scaling on resize
            // Always use referenceFullViewportSize as the baseline, not the current viewport size
            if (distance !== null) {
                window.referenceViewportSize = {
                    width: referenceFullViewportSize.width,
                    height: referenceFullViewportSize.height
                };
                window.baseDistance = distance;
            }
            
            // Force camera change detection by clearing last position
            // This ensures lights update on next animate loop iteration
            if (window.lastCameraPosition && window.lastCameraQuaternion) {
                window.lastCameraPosition.set(-999, -999, -999);
                window.lastCameraQuaternion.set(-999, -999, -999, -999);
            }
            
            // Trigger render since camera was moved programmatically
            needsRenderGlobal = true;
            renderFramesRemaining = 5;
        }
    }
    
    // Store the initial camera position after applying settings
    if (window.modelViewerCamera) {
        window.initialCameraPosition = window.modelViewerCamera.position.clone();
    }
}

// Setup function to initialize viewer and UI
function setupAssemblyViewer() {
    // Check if we're on an assembly viewer page
    const modelViewerContainer = document.getElementById('model-viewer');
    if (!modelViewerContainer) {
        return; // Not an assembly viewer page
    }
    
    // Prevent double initialization
    if (modelViewerContainer.dataset.initialized === 'true') {
        return;
    }
    modelViewerContainer.dataset.initialized = 'true';
    
    // Clean up old Three.js instance if it exists
    if (window.scene) {
        // Dispose of geometries and materials
        window.scene.traverse(function(object) {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Clear the scene
        while(window.scene.children.length > 0) {
            window.scene.remove(window.scene.children[0]);
        }
    }
    
    // Remove old renderer canvas if it exists
    const oldCanvas = modelViewerContainer.querySelector('canvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }
    
    // Clear the container's parts list
    const partsList = document.getElementById('parts-list');
    if (partsList) {
        partsList.innerHTML = '';
    }
    
    // Reload data from window.assemblyViewerData (it changes on each page)
    if (window.assemblyViewerData) {
        modelFile = window.assemblyViewerData.modelFile || '';
        assemblySteps = window.assemblyViewerData.assemblySteps || [];
        bgColor = window.assemblyViewerData.bgColor || [127, 127, 127];
        primaryParts = window.assemblyViewerData.primaryParts || [];
        accentParts = window.assemblyViewerData.accentParts || [];
        frameParts = window.assemblyViewerData.frameParts || [];
        transparentParts = window.assemblyViewerData.transparentParts || {};
        primaryColor = window.assemblyViewerData.primaryColor || [37, 13, 63];
        accentColor = window.assemblyViewerData.accentColor || [110, 63, 163];
        frameColor = window.assemblyViewerData.frameColor || [127, 127, 127];
        focusColor = window.assemblyViewerData.focusColor || [110, 255, 0];
        
        // Update ColorManager with template colors (as defaults)
        ColorManager.colors.primary = primaryColor;
        ColorManager.colors.accent = accentColor;
        ColorManager.colors.frame = frameColor;
        ColorManager.colors.focus = focusColor;
        ColorManager.colors.bg = bgColor;
        
        // Load saved colors from localStorage (overrides template defaults)
        ColorManager.loadFromStorage();
    }
    
    // Reset state for new page
    modelViewerInitialized = false;
    
    // Check URL hash for initial step (e.g., #step-5)
    const hash = window.location.hash;
    const stepMatch = hash.match(/^#step-(\d+)$/);
    if (stepMatch) {
        const stepNum = parseInt(stepMatch[1], 10) - 1; // Convert to 0-indexed
        if (stepNum >= 0 && stepNum < assemblySteps.length) {
            currentStep = stepNum;
        } else {
            currentStep = 0;
        }
    } else {
        currentStep = 0;
    }
    
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
    
    // Reset global references
    window.modelViewerControls = null;
    window.modelViewerCamera = null;
    window.modelViewerParts = null;
    window.scene = null;
    window.originalPartColors = {};
    window.lightDirections = {};
    window.initialCameraPosition = null;
    window.initialTarget = null;
    
    initializeModelViewer();

    
    // Setup button icons
    const selectAllBtn = document.getElementById('select-all-parts');
    const deselectAllBtn = document.getElementById('deselect-all-parts');
    const toggleBtn = document.getElementById('toggle-focus');
    const colorPickerBtn = document.getElementById('open-color-picker');
    const resetColorsBtn = document.getElementById('reset-colors');
    
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
    if (resetColorsBtn) {
        resetColorsBtn.innerHTML = '';
        setIcon(resetColorsBtn, 'icon-refresh');
    }
    
    // Setup navigation button icons
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    if (prevBtn) {
        prevBtn.innerHTML = '';
        setIcon(prevBtn, 'icon-chevron-left');
    }
    if (nextBtn) {
        nextBtn.innerHTML = '';
        setIcon(nextBtn, 'icon-chevron-right');
    }
    
    // Setup step info toggle button
    const toggleStepInfoBtn = document.getElementById('toggle-step-info');
    const stepContentOverlay = document.getElementById('step-content-overlay');
    if (toggleStepInfoBtn && stepContentOverlay) {
        toggleStepInfoBtn.innerHTML = '';
        setIcon(toggleStepInfoBtn, 'icon-info');
        toggleStepInfoBtn.setAttribute('data-tooltip', 'Hide Step Info');
        
        // Start visible by default
        stepContentOverlay.classList.remove('hidden');
        
        toggleStepInfoBtn.onclick = function() {
            this.blur();
            const isHidden = stepContentOverlay.classList.toggle('hidden');
            
            if (isHidden) {
                toggleStepInfoBtn.setAttribute('data-tooltip', 'Show Step Info');
            } else {
                toggleStepInfoBtn.setAttribute('data-tooltip', 'Hide Step Info');
            }
        };
    }
    
    // Setup color picker
    ColorPickerManager.setupColorPicker();
    
    // Update color picker inputs to reflect loaded colors
    ['primary', 'accent', 'frame', 'focus', 'bg'].forEach(function(type) {
        const color = ColorManager.getColor(type);
        const colorInput = document.querySelector(`.color-input[data-color-type="${type}"]`);
        const colorBox = document.getElementById(`${type}-color-box`);
        
        if (colorInput) {
            colorInput.value = ColorManager.rgbToHex(color[0], color[1], color[2]);
        }
        if (colorBox) {
            colorBox.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        }
    });
    
    // Setup UI controls
    UIManager.setupNavigationButtons();
    UIManager.setupToggleButton();
    UIManager.setupCollapseButton();
    UIManager.setupKeyboardShortcuts();
    
    // Setup hash change listener for browser back/forward
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        const stepMatch = hash.match(/^#step-(\d+)$/);
        if (stepMatch) {
            const stepNum = parseInt(stepMatch[1], 10) - 1;
            if (stepNum >= 0 && stepNum < assemblySteps.length && stepNum !== currentStep) {
                currentStep = stepNum;
                updateStep();
            }
        }
    });
    
    // Setup camera overlay click to copy
    const cameraOverlay = document.getElementById('camera-overlay');
    if (cameraOverlay) {
        // Remove old handler if exists
        if (cameraOverlayHandler) {
            cameraOverlay.removeEventListener('click', cameraOverlayHandler);
        }
        
        cameraOverlayHandler = function() {
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
      pan_y: ${panY.toFixed(2)}`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(yamlText).then(function() {
                // Visual feedback
                cameraOverlay.style.background = 'rgba(0, 150, 0, 0.85)';
                setTimeout(function() {
                    // Clear inline style to restore CSS default
                    cameraOverlay.style.background = '';
                }, 200);
            }).catch(function(err) {
                console.error('Failed to copy to clipboard:', err);
            });
        };
        
        // Add the handler
        cameraOverlay.addEventListener('click', cameraOverlayHandler);
    }
}

// Setup event listeners for both initial page load and instant navigation
document.addEventListener('DOMContentLoaded', setupAssemblyViewer);

// MkDocs Material instant navigation support
if (typeof document$ !== 'undefined') {
    document$.subscribe(function() {
        // Clear initialization flag on navigation to allow re-initialization on new pages
        const oldContainer = document.getElementById('model-viewer');
        if (oldContainer) {
            delete oldContainer.dataset.initialized;
        }
        setTimeout(setupAssemblyViewer, 0);
    });
}

// Reusable vectors for recenterScene
const recenterTempOffset = new THREE.Vector3();
const recenterTempDir = new THREE.Vector3();

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
        recenterTempOffset.copy(camera.position).sub(controls.target);
        const currentOffset = recenterTempOffset;
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
                recenterTempDir.copy(direction).multiplyScalar(lightDistance);
                object.position.copy(recenterTempDir).add(controls.target);
                
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