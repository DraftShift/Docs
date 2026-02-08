Input your `max_z_accel`, `max_z_velocity`, and Z travel distance to visualise the velocity profile during a Z move. The gold curve shows the actual velocity over time. If the distance is long enough for the axis to reach `max_z_velocity`, a dashed blue line marks the cruise speed.

<div id="z-calc" class="z-calc-wrapper" markdown="0">
  <div class="z-calc-inputs">
    <div class="z-calc-field">
      <label for="z-calc-accel">max_z_accel</label>
      <div class="z-calc-input-row">
        <input type="number" id="z-calc-accel" value="1000" min="1" step="100">
        <span class="z-calc-unit">mm/s²</span>
      </div>
    </div>
    <div class="z-calc-field">
      <label for="z-calc-velocity">max_z_velocity</label>
      <div class="z-calc-input-row">
        <input type="number" id="z-calc-velocity" value="100" min="1" step="10">
        <span class="z-calc-unit">mm/s</span>
      </div>
    </div>
    <div class="z-calc-field">
      <label for="z-calc-distance">Dock Z Position</label>
      <div class="z-calc-input-row">
        <input type="number" id="z-calc-distance" value="200" min="1" step="10">
        <span class="z-calc-unit">mm</span>
      </div>
    </div>
  </div>
  <div class="z-calc-canvas-wrap">
    <canvas id="z-calc-canvas"></canvas>
  </div>
  <div class="z-calc-results">
    <div class="z-calc-result">
      <div class="z-calc-result-label">Travel Time</div>
      <div id="z-calc-time" class="z-calc-value">—</div>
    </div>
    <div class="z-calc-result">
      <div class="z-calc-result-label">Peak Velocity</div>
      <div id="z-calc-peak" class="z-calc-value">—</div>
    </div>
    <div class="z-calc-result">
      <div class="z-calc-result-label">Reaches max_z_velocity</div>
      <div id="z-calc-reaches" class="z-calc-value">—</div>
    </div>
  </div>
</div>