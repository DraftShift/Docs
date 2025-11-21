<link rel="stylesheet" href="/stylesheets/assembly-viewer.css">
{% set primary_color = (12, 12, 12) %}
{% set accent_color = (200, 8, 8) %}
{% set frame_color = (18, 18, 18) %}
{% set focus_color = (55, 255, 0) %}
{% set bg_color = (30,30,30) %}

<div id="model-viewer-container">
    <div id="model-viewer">
        <div id="step-content-overlay">
            <p id="step-description">{{ assembly.steps[0].description if assembly.steps is defined else "" }}</p>
        </div>
        <div class="model-overlay-content">
            <div class="parts-header">
                <div class="parts-buttons">
                    <button id="select-all-parts" class="parts-button icon-button" data-tooltip="Show All"></button>
                    <button id="deselect-all-parts" class="parts-button icon-button" data-tooltip="Hide All"></button>
                    <button id="toggle-focus" class="parts-button icon-button" data-tooltip="Reload Current Step"></button>
                    <button id="open-color-picker" class="parts-button icon-button" data-tooltip="Colors"></button>
                    <button id="toggle-step-info" class="parts-button icon-button" data-tooltip="Hide Step Info"></button>
                </div>
                <button id="collapse-parts" class="parts-button icon-button collapse-button" data-tooltip="Collapse"></button>
            </div>
            <div id="color-picker-overlay" class="color-picker-overlay">
                <div class="color-boxes-container">
                    <div class="color-box-wrapper" data-tooltip="Primary">
                        <div class="color-box" id="primary-color-box" data-color-type="primary" style="background: rgb({{ primary_color[0] }}, {{ primary_color[1] }}, {{ primary_color[2] }});">
                            <input type="color" class="color-input" data-color-type="primary" value="{{ '#%02x%02x%02x' | format(primary_color[0], primary_color[1], primary_color[2]) }}">
                        </div>
                    </div>
                    <div class="color-box-wrapper" data-tooltip="Accent">
                        <div class="color-box" id="accent-color-box" data-color-type="accent" style="background: rgb({{ accent_color[0] }}, {{ accent_color[1] }}, {{ accent_color[2] }});">
                            <input type="color" class="color-input" data-color-type="accent" value="{{ '#%02x%02x%02x' | format(accent_color[0], accent_color[1], accent_color[2]) }}">
                        </div>
                    </div>
                    <div class="color-box-wrapper" data-tooltip="Frame">
                        <div class="color-box" id="frame-color-box" data-color-type="frame" style="background: rgb({{ frame_color[0] }}, {{ frame_color[1] }}, {{ frame_color[2] }});">
                            <input type="color" class="color-input" data-color-type="frame" value="{{ '#%02x%02x%02x' | format(frame_color[0], frame_color[1], frame_color[2]) }}">
                        </div>
                    </div>
                    <div class="color-box-wrapper" data-tooltip="Focus">
                        <div class="color-box" id="focus-color-box" data-color-type="focus" style="background: rgb({{ focus_color[0] }}, {{ focus_color[1] }}, {{ focus_color[2] }});">
                            <input type="color" class="color-input" data-color-type="focus" value="{{ '#%02x%02x%02x' | format(focus_color[0], focus_color[1], focus_color[2]) }}">
                        </div>
                    </div>
                    <div class="color-box-wrapper" data-tooltip="Background">
                        <div class="color-box" id="bg-color-box" data-color-type="bg" style="background: rgb({{ bg_color[0] }}, {{ bg_color[1] }}, {{ bg_color[2] }});">
                            <input type="color" class="color-input" data-color-type="bg" value="{{ '#%02x%02x%02x' | format(bg_color[0], bg_color[1], bg_color[2]) }}">
                        </div>
                    </div>
                    <div class="color-box-wrapper" data-tooltip="Reset Colors">
                        <button id="reset-colors" class="color-box reset-button icon-button"></button>
                    </div>
                </div>
            </div>
            <div id="parts-panel">
                <div id="parts-list"></div>
            </div>
        </div>
        <div id="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading {{ assembly.title }}...</div>
        </div>
        <div id="camera-overlay">
            <div class="camera-info">
                <div>Azimuth: <span id="overlay-azimuth">0</span>°</div>
                <div>Polar: <span id="overlay-polar">0</span>°</div>
                <div>Distance: <span id="overlay-distance">0</span></div>
                <div>Pan X: <span id="overlay-pan-x">0</span></div>
                <div>Pan Y: <span id="overlay-pan-y">0</span></div>
            </div>
        </div>
        <div id="step-nav">
            <button id="prev-step" class="step-nav-button"></button>
            <span id="step-counter">Step 1 of {{ assembly.steps|length }}</span>
            <button id="next-step" class="step-nav-button"></button>
        </div>
    </div>
</div>

<!-- SVG Icon Templates -->
<svg style="display: none;">
    <symbol id="icon-eye" viewBox="0 0 24 24">
        <path d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
    </symbol>
    <symbol id="icon-eye-off" viewBox="0 0 24 24">
        <path d="M11.83 9 15 12.16V12a3 3 0 0 0-3-3h-.17m-4.3.8 1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22 21 20.73 3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7Z"/>
    </symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"/>
    </symbol>
    <symbol id="icon-chevron-left" viewBox="0 0 24 24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </symbol>
    <symbol id="icon-chevron-right" viewBox="0 0 24 24">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
    </symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1 0-.26-.1-.51-.27-.7-.17-.19-.27-.44-.27-.7 0-.55.45-1 1-1h1.18c3.03 0 5.5-2.47 5.5-5.5C20.14 5.48 16.52 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </symbol>
    <symbol id="icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </symbol>
    <symbol id="icon-info" viewBox="0 0 24 24">
        <path d="M11 7h2v2h-2V7m0 4h2v6h-2v-6m1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </symbol>
</svg>

<script>
// Assembly data embedded from YAML via Jinja
window.assemblyViewerData = {
    modelFile: 'model.glb',
    assemblySteps: {{ assembly.steps|tojson if assembly.steps is defined else [] }},
    bgColor: {{ bg_color|list }},
    primaryParts: {{ assembly.primary_parts|tojson if assembly.primary_parts is defined else []}},
    accentParts: {{ assembly.accent_parts|tojson if assembly.accent_parts is defined else [] }},
    frameParts: {{ assembly.frame_parts|tojson if assembly.frame_parts is defined else [] }},
    transparentParts: {{ assembly.transparent_parts|tojson if assembly.transparent_parts is defined else {} }},
    primaryColor: {{ primary_color|list }},
    accentColor: {{ accent_color|list }},
    frameColor: {{ frame_color|list }},
    focusColor: {{ focus_color|list }},
};
</script>
