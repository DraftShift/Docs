/**
 * Z-Axis Speed Calculator
 * Interactive graph showing the relationship between max_z_accel, max_z_velocity, and distance.
 * Similar to Prusa's acceleration calculator but focused on Z-axis motion.
 */
(function () {
  "use strict";

  function initZCalc() {
    const container = document.getElementById("z-calc");
    if (!container) return;

    const canvas = container.querySelector("#z-calc-canvas");
    const ctx = canvas.getContext("2d");

    const accelInput = container.querySelector("#z-calc-accel");
    const velocityInput = container.querySelector("#z-calc-velocity");
    const distanceInput = container.querySelector("#z-calc-distance");
    const timeOutput = container.querySelector("#z-calc-time");
    const peakOutput = container.querySelector("#z-calc-peak");
    const reachesOutput = container.querySelector("#z-calc-reaches");

    function getColors() {
      const style = getComputedStyle(document.documentElement);
      // MkDocs Material sets data-md-color-scheme on <body>.
      // In "auto" mode it may be toggled dynamically via media query.
      const scheme = document.body.getAttribute("data-md-color-scheme");
      let isDark;
      if (scheme === "slate") {
        isDark = true;
      } else if (scheme === "default") {
        isDark = false;
      } else {
        // Auto / unset – fall back to the OS preference
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      return {
        bg: "transparent",
        grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        axis: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
        axisLabel: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
        velocityCurve: "#e6a817",
        velocityFill: isDark
          ? "rgba(230,168,23,0.12)"
          : "rgba(230,168,23,0.08)",
        desiredLine: "#42a5f5",
        desiredFill: isDark
          ? "rgba(66,165,245,0.15)"
          : "rgba(66,165,245,0.10)",
        text: isDark ? "#e0e0e0" : "#333333",
      };
    }

    function compute(accel, maxVel, distance) {
      // Time to accelerate from 0 to maxVel
      const t_accel = maxVel / accel;
      // Distance covered during acceleration phase
      const d_accel = 0.5 * accel * t_accel * t_accel;

      // If we can't reach max velocity in half the distance, it's a triangle profile
      const isTriangle = d_accel > distance / 2;

      let totalTime, peakVelocity;

      if (isTriangle) {
        // Triangle profile: accelerate then decelerate, never reaching maxVel
        // d = 2 * (0.5 * a * t_half^2) => t_half = sqrt(d / a)
        const t_half = Math.sqrt(distance / accel);
        peakVelocity = accel * t_half;
        totalTime = 2 * t_half;
      } else {
        // Trapezoid profile: accelerate, cruise at maxVel, decelerate
        const d_cruise = distance - 2 * d_accel;
        const t_cruise = d_cruise / maxVel;
        totalTime = 2 * t_accel + t_cruise;
        peakVelocity = maxVel;
      }

      return { totalTime, peakVelocity, isTriangle, reachesMax: !isTriangle };
    }

    function buildProfile(accel, maxVel, distance, numPoints) {
      const points = [];
      const t_accel = maxVel / accel;
      const d_accel = 0.5 * accel * t_accel * t_accel;
      const isTriangle = d_accel > distance / 2;

      if (isTriangle) {
        const t_half = Math.sqrt(distance / accel);
        const totalTime = 2 * t_half;
        for (let i = 0; i <= numPoints; i++) {
          const t = (i / numPoints) * totalTime;
          let v;
          if (t <= t_half) {
            v = accel * t;
          } else {
            v = accel * (totalTime - t);
          }
          points.push({ t, v: Math.max(0, v) });
        }
      } else {
        const d_cruise = distance - 2 * d_accel;
        const t_cruise = d_cruise / maxVel;
        const totalTime = 2 * t_accel + t_cruise;
        for (let i = 0; i <= numPoints; i++) {
          const t = (i / numPoints) * totalTime;
          let v;
          if (t <= t_accel) {
            v = accel * t;
          } else if (t <= t_accel + t_cruise) {
            v = maxVel;
          } else {
            v = accel * (totalTime - t);
          }
          points.push({ t, v: Math.max(0, v) });
        }
      }
      return points;
    }

    function drawGraph() {
      const accel = parseFloat(accelInput.value) || 500;
      const maxVel = parseFloat(velocityInput.value) || 100;
      const distance = parseFloat(distanceInput.value) || 200;

      if (accel <= 0 || maxVel <= 0 || distance <= 0) return;

      const result = compute(accel, maxVel, distance);
      const profile = buildProfile(accel, maxVel, distance, 300);

      // Update outputs
      timeOutput.textContent = result.totalTime.toFixed(3) + "s";
      peakOutput.textContent = result.peakVelocity.toFixed(1) + " mm/s";
      reachesOutput.textContent = result.reachesMax ? "Yes" : "No";
      reachesOutput.className = "z-calc-value " + (result.reachesMax ? "z-calc-yes" : "z-calc-no");

      const colors = getColors();
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;

      // Graph area with padding
      const pad = { top: 20, right: 20, bottom: 70, left: 55 };
      const gW = W - pad.left - pad.right;
      const gH = H - pad.top - pad.bottom;

      // Clear canvas (transparent so page background shows through)
      ctx.clearRect(0, 0, W, H);

      // Determine axis ranges
      const maxT = result.totalTime;
      // Y-axis: show at least maxVel, or peakVelocity if triangle and peak > maxVel
      const maxY = Math.max(maxVel, result.peakVelocity) * 1.15;

      function toX(t) {
        return pad.left + (t / maxT) * gW;
      }
      function toY(v) {
        return pad.top + gH - (v / maxY) * gH;
      }

      // Grid lines
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;

      // Resolve site font for canvas text
      const siteFont = getComputedStyle(document.documentElement).getPropertyValue("--md-text-font-family").trim() || "Roboto, sans-serif";

      // Horizontal grid
      const ySteps = niceSteps(0, maxY, 6);
      ctx.font = "11px " + siteFont;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const yVal of ySteps) {
        const y = toY(yVal);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.fillStyle = colors.axisLabel;
        ctx.fillText(Math.round(yVal), pad.left - 8, y);
      }

      // Vertical grid
      const tSteps = niceSteps(0, maxT, 6);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const tVal of tSteps) {
        const x = toX(tVal);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + gH);
        ctx.stroke();
        ctx.fillStyle = colors.axisLabel;
        ctx.fillText(tVal.toFixed(2) + "s", x, pad.top + gH + 6);
      }

      // Axis labels
      ctx.fillStyle = colors.text;
      ctx.font = "16px " + siteFont;
      ctx.textAlign = "center";
      ctx.fillText("Time (s)", pad.left + gW / 2, pad.top + gH + 40);

      ctx.save();
      ctx.translate(4, pad.top + gH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "top";
      ctx.fillText("Velocity (mm/s)", 0, 0);
      ctx.restore();

      // Draw desired velocity line (horizontal) and fill below
      if (result.reachesMax) {
        const yDesired = toY(maxVel);

        // Fill area where velocity >= maxVel (the cruise region)
        ctx.fillStyle = colors.desiredFill;
        ctx.beginPath();
        let started = false;
        for (const p of profile) {
          if (p.v >= maxVel - 0.01) {
            if (!started) {
              ctx.moveTo(toX(p.t), toY(maxVel));
              started = true;
            }
            ctx.lineTo(toX(p.t), toY(maxVel));
          }
        }
        // Close back along the bottom of the cruise
        for (let i = profile.length - 1; i >= 0; i--) {
          if (profile[i].v >= maxVel - 0.01) {
            ctx.lineTo(toX(profile[i].t), toY(maxVel));
          }
        }
        ctx.closePath();
        ctx.fill();

        // Desired velocity line
        ctx.strokeStyle = colors.desiredLine;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, yDesired);
        ctx.lineTo(W - pad.right, yDesired);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = colors.desiredLine;
        ctx.font = "11px " + siteFont;
        ctx.textAlign = "left";
        ctx.fillText("max_z_velocity", W - pad.right - 90, yDesired - 18);
      }

      // Fill under velocity curve
      ctx.fillStyle = colors.velocityFill;
      ctx.beginPath();
      ctx.moveTo(toX(profile[0].t), toY(0));
      for (const p of profile) {
        ctx.lineTo(toX(p.t), toY(p.v));
      }
      ctx.lineTo(toX(profile[profile.length - 1].t), toY(0));
      ctx.closePath();
      ctx.fill();

      // Velocity curve
      ctx.strokeStyle = colors.velocityCurve;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < profile.length; i++) {
        const x = toX(profile[i].t);
        const y = toY(profile[i].v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Axes
      ctx.strokeStyle = colors.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top);
      ctx.lineTo(pad.left, pad.top + gH);
      ctx.lineTo(W - pad.right, pad.top + gH);
      ctx.stroke();
    }

    function niceSteps(min, max, targetCount) {
      const range = max - min;
      if (range <= 0) return [0];
      const rough = range / targetCount;
      const mag = Math.pow(10, Math.floor(Math.log10(rough)));
      let step;
      const norm = rough / mag;
      if (norm < 1.5) step = mag;
      else if (norm < 3) step = 2 * mag;
      else if (norm < 7) step = 5 * mag;
      else step = 10 * mag;

      const steps = [];
      let v = Math.ceil(min / step) * step;
      while (v <= max) {
        steps.push(v);
        v += step;
      }
      return steps;
    }

    // Debounced redraw
    let rafId = null;
    function requestDraw() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(drawGraph);
    }

    accelInput.addEventListener("input", requestDraw);
    velocityInput.addEventListener("input", requestDraw);
    distanceInput.addEventListener("input", requestDraw);

    // Redraw on resize
    window.addEventListener("resize", requestDraw);

    // Observe theme changes on <body> (MkDocs Material sets data-md-color-scheme there)
    const observer = new MutationObserver(requestDraw);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-md-color-scheme"],
    });
    // Also listen for OS-level color scheme changes (auto mode)
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", requestDraw);

    // Initial draw
    requestDraw();
  }

  // Initialize when DOM is ready, also handle MkDocs instant navigation
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initZCalc);
  } else {
    initZCalc();
  }
  // Re-init on MkDocs Material instant navigation
  document.addEventListener("DOMContentSwitch", initZCalc);
  // For newer versions of MkDocs Material
  if (typeof document$ !== "undefined") {
    document$.subscribe(initZCalc);
  }
})();
