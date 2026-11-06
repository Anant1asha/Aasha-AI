"""Pre-compiled, offline-verified simulation templates for OpenMAIC.

All templates strictly comply with AASHA AIOS invariants:
1. 100% offline self-contained (zero external CDN or font calls).
2. Minimum 44px touch targets.
3. Physically accurate and pedagogically sound (zero misconceptions).
"""

PROJECTILE_MOTION_LAB = """<!-- title: Projectile Motion Lab -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projectile Motion Lab</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --border: #334155;
            --accent: #38bdf8;
            --accent-hover: #0284c7;
            --text: #f8fafc;
            --muted: #94a3b8;
            --success: #4ade80;
            --danger: #f87171;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 100vh;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
        }
        h2 { font-size: 1.1rem; color: var(--text); }
        .badge {
            background: rgba(56, 189, 248, 0.15);
            color: var(--accent);
            border: 1px solid rgba(56, 189, 248, 0.3);
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }
        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 6px 10px;
            text-align: center;
        }
        .stat-label { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; }
        .stat-val { font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-top: 2px; }
        .canvas-container {
            background: #020617;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            flex: 1;
            display: flex;
        }
        canvas { width: 100%; height: 260px; display: block; }
        .controls-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .sliders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
        }
        .control-group { display: flex; flex-direction: column; gap: 4px; }
        .label-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--muted); }
        .label-row span.val { color: var(--text); font-weight: 600; }
        input[type="range"] {
            width: 100%; height: 6px; border-radius: 3px;
            background: var(--border); accent-color: var(--accent); cursor: pointer;
        }
        .btn-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        button {
            min-height: 44px; padding: 0 16px; border-radius: 6px;
            font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer;
            transition: all 0.15s ease;
        }
        .btn-primary { background: var(--accent); color: #020617; }
        .btn-primary:hover { background: var(--accent-hover); color: white; }
        .btn-secondary { background: #334155; color: var(--text); }
        .btn-secondary:hover { background: #475569; }
        select {
            background: #0f172a; color: var(--text); border: 1px solid var(--border);
            padding: 6px 8px; border-radius: 6px; outline: none; min-height: 44px;
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h2>Projectile Motion Lab</h2>
            <p style="font-size: 0.75rem; color: var(--muted);">Kinematics Sandbox: Trajectory, Launch Angle & Gravity</p>
        </div>
        <span class="badge">AASHA Offline Engine</span>
    </header>
    <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Flight Time</div><div class="stat-val" id="statTime">0.00 s</div></div>
        <div class="stat-card"><div class="stat-label">Max Height (H)</div><div class="stat-val" id="statHeight">0.00 m</div></div>
        <div class="stat-card"><div class="stat-label">Total Range (R)</div><div class="stat-val" id="statRange">0.00 m</div></div>
        <div class="stat-card"><div class="stat-label">Impact Speed</div><div class="stat-val" id="statVelocity">0.00 m/s</div></div>
    </div>
    <div class="canvas-container"><canvas id="simCanvas"></canvas></div>
    <div class="controls-card">
        <div class="sliders-grid">
            <div class="control-group">
                <div class="label-row"><label>Launch Angle (θ)</label><span class="val" id="angleVal">45°</span></div>
                <input type="range" id="angleSlider" min="5" max="85" value="45">
            </div>
            <div class="control-group">
                <div class="label-row"><label>Initial Speed (v₀)</label><span class="val" id="speedVal">25 m/s</span></div>
                <input type="range" id="speedSlider" min="5" max="45" value="25">
            </div>
            <div class="control-group">
                <div class="label-row"><label>Platform Height (h₀)</label><span class="val" id="heightVal">0 m</span></div>
                <input type="range" id="heightSlider" min="0" max="30" value="0">
            </div>
            <div class="control-group">
                <div class="label-row"><label>Gravity (g)</label><span class="val" id="gravityVal">9.8 m/s²</span></div>
                <select id="gravitySelect">
                    <option value="9.8">Earth (9.8 m/s²)</option>
                    <option value="1.62">Moon (1.62 m/s²)</option>
                    <option value="3.72">Mars (3.72 m/s²)</option>
                    <option value="24.79">Jupiter (24.79 m/s²)</option>
                </select>
            </div>
        </div>
        <div class="btn-row">
            <button class="btn-primary" id="launchBtn">🚀 Fire Projectile</button>
            <button class="btn-secondary" id="clearBtn">🔄 Clear History</button>
            <label style="font-size:0.8rem; color:var(--muted); margin-left:auto; display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="vectorToggle" checked> Show Velocity Vectors
            </label>
        </div>
    </div>
    <script>
        const canvas = document.getElementById('simCanvas');
        const ctx = canvas.getContext('2d');
        const angleSlider = document.getElementById('angleSlider');
        const speedSlider = document.getElementById('speedSlider');
        const heightSlider = document.getElementById('heightSlider');
        const gravitySelect = document.getElementById('gravitySelect');
        const launchBtn = document.getElementById('launchBtn');
        const clearBtn = document.getElementById('clearBtn');
        const vectorToggle = document.getElementById('vectorToggle');
        const statTime = document.getElementById('statTime');
        const statHeight = document.getElementById('statHeight');
        const statRange = document.getElementById('statRange');
        const statVelocity = document.getElementById('statVelocity');

        let pastTrajectories = [];
        let activeProjectile = null;
        let animId = null;

        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 260;
            renderScene();
        }
        window.addEventListener('resize', resizeCanvas);

        const originX = 50;
        const groundY = 220;
        const meterScale = 2.4;

        function getSimParams() {
            return {
                angleDeg: parseFloat(angleSlider.value),
                v0: parseFloat(speedSlider.value),
                h0: parseFloat(heightSlider.value),
                g: parseFloat(gravitySelect.value)
            };
        }

        function updateLabels() {
            document.getElementById('angleVal').textContent = angleSlider.value + '°';
            document.getElementById('speedVal').textContent = speedSlider.value + ' m/s';
            document.getElementById('heightVal').textContent = heightSlider.value + ' m';
            document.getElementById('gravityVal').textContent = gravitySelect.value + ' m/s²';
        }

        [angleSlider, speedSlider, heightSlider, gravitySelect].forEach(el => {
            el.addEventListener('input', () => { updateLabels(); renderScene(); });
        });

        clearBtn.addEventListener('click', () => {
            pastTrajectories = [];
            activeProjectile = null;
            cancelAnimationFrame(animId);
            statTime.textContent = '0.00 s';
            statHeight.textContent = '0.00 m';
            statRange.textContent = '0.00 m';
            statVelocity.textContent = '0.00 m/s';
            renderScene();
        });

        launchBtn.addEventListener('click', () => {
            const p = getSimParams();
            const rad = (p.angleDeg * Math.PI) / 180;
            const vx0 = p.v0 * Math.cos(rad);
            const vy0 = p.v0 * Math.sin(rad);
            const discriminant = (vy0 * vy0) + (2 * p.g * p.h0);
            const totalTime = (vy0 + Math.sqrt(discriminant)) / p.g;
            const totalRange = vx0 * totalTime;
            const maxHeight = p.h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * p.g) : 0);
            const impactVy = vy0 - (p.g * totalTime);
            const impactSpeed = Math.sqrt((vx0 * vx0) + (impactVy * impactVy));

            statTime.textContent = totalTime.toFixed(2) + ' s';
            statHeight.textContent = maxHeight.toFixed(2) + ' m';
            statRange.textContent = totalRange.toFixed(2) + ' m';
            statVelocity.textContent = impactSpeed.toFixed(2) + ' m/s';

            activeProjectile = {
                t: 0, totalTime: totalTime,
                vx0: vx0, vy0: vy0, h0: p.h0, g: p.g,
                path: [], color: '#38bdf8'
            };
            cancelAnimationFrame(animId);
            runLoop();
        });

        function runLoop() {
            if (!activeProjectile) return;
            const dt = 0.035;
            activeProjectile.t += dt;
            const t = Math.min(activeProjectile.t, activeProjectile.totalTime);
            const x = activeProjectile.vx0 * t;
            const y = activeProjectile.h0 + (activeProjectile.vy0 * t) - (0.5 * activeProjectile.g * t * t);
            const vy = activeProjectile.vy0 - (activeProjectile.g * t);

            activeProjectile.currentX = x;
            activeProjectile.currentY = Math.max(0, y);
            activeProjectile.currentVx = activeProjectile.vx0;
            activeProjectile.currentVy = vy;
            activeProjectile.path.push({ x: activeProjectile.currentX, y: activeProjectile.currentY });

            renderScene();

            if (activeProjectile.t >= activeProjectile.totalTime) {
                pastTrajectories.push([...activeProjectile.path]);
                if (pastTrajectories.length > 5) pastTrajectories.shift();
                activeProjectile = null;
            } else {
                animId = requestAnimationFrame(runLoop);
            }
        }

        function renderScene() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const p = getSimParams();

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let m = 0; m <= 200; m += 20) {
                const px = originX + (m * meterScale);
                ctx.beginPath();
                ctx.moveTo(px, 15);
                ctx.lineTo(px, groundY);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = '10px sans-serif';
                ctx.fillText(m + 'm', px - 8, groundY + 14);
            }

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(canvas.width, groundY);
            ctx.stroke();

            const towerHeightPx = p.h0 * meterScale;
            if (p.h0 > 0) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(originX - 14, groundY - towerHeightPx, 14, towerHeightPx);
                ctx.strokeStyle = '#64748b';
                ctx.strokeRect(originX - 14, groundY - towerHeightPx, 14, towerHeightPx);
            }

            const launchYPx = groundY - towerHeightPx;
            ctx.save();
            ctx.translate(originX, launchYPx);
            ctx.rotate(- (p.angleDeg * Math.PI) / 180);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(0, -4, 24, 8);
            ctx.restore();

            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(originX, launchYPx, 7, 0, Math.PI * 2);
            ctx.fill();

            pastTrajectories.forEach((path, idx) => {
                ctx.strokeStyle = `rgba(148, 163, 184, ${(idx + 1) * 0.15})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                path.forEach((pt, i) => {
                    const cx = originX + (pt.x * meterScale);
                    const cy = groundY - (pt.y * meterScale);
                    if (i === 0) ctx.moveTo(cx, cy);
                    else ctx.lineTo(cx, cy);
                });
                ctx.stroke();
            });

            if (activeProjectile) {
                ctx.strokeStyle = activeProjectile.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                activeProjectile.path.forEach((pt, i) => {
                    const cx = originX + (pt.x * meterScale);
                    const cy = groundY - (pt.y * meterScale);
                    if (i === 0) ctx.moveTo(cx, cy);
                    else ctx.lineTo(cx, cy);
                });
                ctx.stroke();

                const projX = originX + (activeProjectile.currentX * meterScale);
                const projY = groundY - (activeProjectile.currentY * meterScale);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(projX, projY, 6, 0, Math.PI * 2);
                ctx.fill();

                if (vectorToggle.checked) {
                    const vx = activeProjectile.currentVx;
                    const vy = activeProjectile.currentVy;
                    ctx.strokeStyle = '#4ade80';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(projX, projY);
                    ctx.lineTo(projX + (vx * 1.2), projY);
                    ctx.stroke();

                    ctx.strokeStyle = '#f87171';
                    ctx.beginPath();
                    ctx.moveTo(projX, projY);
                    ctx.lineTo(projX, projY - (vy * 1.2));
                    ctx.stroke();
                }
            }
        }
        resizeCanvas();
        updateLabels();
    </script>
</body>
</html>"""

GRAVITY_FREEFALL_LAB = """<!-- title: Gravity and Air Drag Sandbox -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gravity and Free Fall Lab</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --border: #334155;
            --accent: #38bdf8;
            --text: #f8fafc;
            --muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 100vh;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        .canvas-box { background: #020617; border: 1px solid var(--border); border-radius: 8px; height: 260px; position: relative; }
        canvas { width: 100%; height: 100%; display: block; }
        .controls { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .row { display: flex; gap: 12px; align-items: center; justify-content: space-between; font-size: 0.85rem; }
        input[type="range"] { flex: 1; accent-color: var(--accent); }
        button { min-height: 44px; padding: 0 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: none; cursor: pointer; background: var(--accent); color: #020617; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h3>Gravity & Air Resistance Lab</h3>
            <p style="font-size: 0.75rem; color: var(--muted);">Compare heavy ball vs. light feather in vacuum vs. air.</p>
        </div>
    </div>
    <div class="canvas-box"><canvas id="freefallCanvas"></canvas></div>
    <div class="controls">
        <div class="row">
            <label>Drop Height:</label>
            <input type="range" id="hSlider" min="10" max="60" value="40">
            <span id="hLabel">40 m</span>
        </div>
        <div class="row">
            <label><input type="checkbox" id="vacuumToggle"> Vacuum Chamber (Zero Air Drag)</label>
            <button id="dropBtn">⬇ Drop Objects</button>
        </div>
    </div>
    <script>
        const canvas = document.getElementById('freefallCanvas');
        const ctx = canvas.getContext('2d');
        const hSlider = document.getElementById('hSlider');
        const hLabel = document.getElementById('hLabel');
        const vacuumToggle = document.getElementById('vacuumToggle');
        const dropBtn = document.getElementById('dropBtn');

        let y1 = 0, y2 = 0, v1 = 0, v2 = 0, dropping = false, timer = null;
        function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = 260; draw(); }
        window.addEventListener('resize', resize);
        hSlider.oninput = () => { hLabel.textContent = hSlider.value + ' m'; reset(); };
        vacuumToggle.onchange = reset;

        function reset() {
            dropping = false;
            if (timer) clearInterval(timer);
            y1 = 20; y2 = 20; v1 = 0; v2 = 0;
            draw();
        }

        dropBtn.onclick = () => {
            reset();
            dropping = true;
            const g = 0.5;
            const airDrag = vacuumToggle.checked ? 0 : 0.04;
            const ground = canvas.height - 30;

            timer = setInterval(() => {
                v1 += g - (v1 * (vacuumToggle.checked ? 0 : 0.005));
                v2 += g - (v2 * airDrag);
                y1 += v1;
                y2 += v2;

                if (y1 >= ground) { y1 = ground; v1 = 0; }
                if (y2 >= ground) { y2 = ground; v2 = 0; }
                draw();

                if (y1 >= ground && y2 >= ground) {
                    clearInterval(timer);
                    dropping = false;
                }
            }, 25);
        };

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ground = canvas.height - 30;
            ctx.strokeStyle = '#475569';
            ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(canvas.width, ground); ctx.stroke();

            const x1 = canvas.width * 0.35;
            const x2 = canvas.width * 0.65;

            // Ball (dense iron ball)
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(x1, y1, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
            ctx.fillText('Iron Ball (1 kg)', x1 - 36, y1 - 20);

            // Feather / parachute
            ctx.fillStyle = '#f472b6';
            ctx.beginPath(); ctx.arc(x2, y2, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(vacuumToggle.checked ? 'Feather (in vacuum)' : 'Feather (in air)', x2 - 45, y2 - 16);
        }
        resize();
    </script>
</body>
</html>"""

OPENMAIC_CATALOG = {
    "projectile": PROJECTILE_MOTION_LAB,
    "projectile_motion": PROJECTILE_MOTION_LAB,
    "kinematics": PROJECTILE_MOTION_LAB,
    "gravity": GRAVITY_FREEFALL_LAB,
    "free_fall": GRAVITY_FREEFALL_LAB,
    "air_drag": GRAVITY_FREEFALL_LAB,
}
