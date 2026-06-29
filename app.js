import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "./shared/genlayer-lite.js";

const CONTRACT = "0xdD32b18f974E954930BFD06860a5790Ba50C29D4";
const { read } = makeReader(CONTRACT);
const SUBMITTED = 0, CONFIRMED = 1, DISPUTED = 2;
const STLABEL = ["Pending", "Confirmed", "Disputed"];
const STCLS = ["s-posted", "s-verified", "s-disputed"];
let account = null, records = [];
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("contractLink").textContent = "Contract " + short(CONTRACT);

function toast(msg, kind = "", title = "witness") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

const _io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); _io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => _io.observe(el));

function countUp(el, to) {
  if (!window.gsap || !el) { if (el) el.textContent = to; return; }
  const target = parseFloat(to) || 0; const obj = { v: 0 };
  gsap.to(obj, { v: target, duration: 1.3, ease: "power2.out",
    onUpdate: () => { el.textContent = Math.round(obj.v); }, onComplete: () => { el.textContent = Math.round(target); } });
}

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) { let bal = 0n; try { bal = await balanceOf(account); } catch (_) {} slot.innerHTML = `<span class="mono" style="font-size:12px;color:var(--txt2)">${short(account)} · ${toGen(bal)} GEN</span>`; }
  else { slot.innerHTML = `<button class="btn ghost sm" id="connectBtn">Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function load() {
  try {
    const count = Number(await read("get_attestation_count"));
    const out = [];
    for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_attestation", [i])) });
    records = out; renderTicker(); renderList(); drawDonut();
    $("feedMeta").textContent = count + (count === 1 ? " claim" : " claims");
    countUp($("stTotal"), count);
    countUp($("stConf"), out.filter((r) => Number(r.status) === CONFIRMED).length);
    countUp($("stDisp"), out.filter((r) => Number(r.status) === DISPUTED).length);
  } catch (e) { $("recordList").innerHTML = `<div class="empty">Could not reach the chain. ${fmtErr(e)}</div>`; }
}

function renderTicker() {
  const el = $("ticker"); if (!el) return;
  const conf = records.filter((r) => Number(r.status) === CONFIRMED);
  if (!conf.length) { el.innerHTML = `<span class="tk dim">No confirmed claims yet · attest the first</span>`; return; }
  const items = conf.map((r) => `<span class="tk"><i class="ph-bold ph-seal-check"></i> ${esc(r.subject)}: ${esc(r.claim.slice(0, 40))}</span>`).join("");
  el.innerHTML = items + items;
}

function renderList() {
  const el = $("recordList");
  if (!records.length) { el.innerHTML = `<div class="empty">No attestations yet.</div>`; return; }
  el.innerHTML = "";
  [...records].reverse().forEach((r) => {
    const st = Number(r.status);
    const row = document.createElement("div"); row.className = "frow";
    row.innerHTML = `<div class="fr-l"><span class="fr-asset">${esc(r.subject)}</span><span class="fr-src">${esc(r.claim)}</span></div>
      <div class="fr-r"><span class="fr-badge ${STCLS[st]}">${STLABEL[st]}</span></div>`;
    row.onclick = () => openDetail(r.id);
    el.appendChild(row);
  });
}

function drawDonut() {
  const node = $("stageChart"); if (!node || !window.d3) return;
  const svg = d3.select(node); svg.selectAll("*").remove();
  const W = node.clientWidth || 380, H = 240; svg.attr("viewBox", `0 0 ${W} ${H}`);
  const counts = [0, 0, 0]; // confirmed, pending, disputed
  records.forEach((r) => { const s = Number(r.status); counts[s === CONFIRMED ? 0 : s === SUBMITTED ? 1 : 2]++; });
  const total = counts.reduce((a, b) => a + b, 0);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 16;
  if (!total) { svg.append("text").attr("x", cx).attr("y", cy).attr("text-anchor", "middle").attr("fill", "#46597a").attr("font-family", "JetBrains Mono").attr("font-size", 12).text("No claims yet"); return; }
  const COL = ["#54b8ff", "#ffc857", "#ff6b8a"];
  const pie = d3.pie().sort(null).value((d) => d.v)([{ v: counts[0] }, { v: counts[1] }, { v: counts[2] }]);
  const arc = d3.arc().innerRadius(R * 0.58).outerRadius(R).cornerRadius(4).padAngle(0.04);
  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
  g.selectAll("path").data(pie).enter().append("path").attr("fill", (d, i) => COL[i]).attr("opacity", (d) => d.value ? 0.92 : 0)
    .attr("d", function (d) { const a = { ...d, endAngle: d.startAngle }; this._c = d3.interpolate(a, d); return arc(a); })
    .transition().duration(800).attrTween("d", function (d) { return (t) => arc(this._c(t)); });
  g.append("text").attr("text-anchor", "middle").attr("dy", -4).attr("fill", "#e8f3ff").attr("font-family", "Space Grotesk").attr("font-weight", 700).attr("font-size", 30).text(total);
  g.append("text").attr("text-anchor", "middle").attr("dy", 16).attr("fill", "#46597a").attr("font-family", "JetBrains Mono").attr("font-size", 10).text("CLAIMS");
}

function openDrawer() { $("scrim").classList.add("on"); $("drawer").classList.add("on"); }
function closeDrawer() { $("scrim").classList.remove("on"); $("drawer").classList.remove("on"); }

function openNew() {
  $("drawerTitle").textContent = "[+] FILE AN ATTESTATION";
  $("drawerBody").innerHTML = `
    <div class="compose">
      <span class="compose-tag">WITNESS RECORD // DRAFT</span>
      <p class="statement">I attest that <input id="nSubject" class="blank" placeholder="SUBJECT" autocomplete="off" /> <input id="nClaim" class="blank wide" placeholder="IS TRUE \u2014 STATE THE CLAIM" autocomplete="off" />, verifiable at <input id="nSource" class="blank url" placeholder="HTTPS://SOURCE" autocomplete="off" />.</p>
      <button class="btn fill lg block" id="createBtn">FILE INTO THE RECORD [\u2192]</button>
      <p class="hint">A VALIDATOR SET WILL FETCH THE SOURCE AND CONFIRM \u2014 OR DISPUTE \u2014 THIS RECORD ON-CHAIN.</p>
    </div>`;
  $("createBtn").onclick = doCreate; openDrawer();
}

function openDetail(id) {
  const r = records.find((x) => x.id === id); if (!r) return;
  const st = Number(r.status);
  $("drawerTitle").textContent = "Attestation #" + id;
  let verdict = "";
  if (st === CONFIRMED) verdict = `<div class="verdict-box vb-ok"><b style="color:var(--green)">Confirmed.</b> ${r.rationale ? esc(r.rationale) : "The source confirms this claim."}</div>`;
  if (st === DISPUTED) verdict = `<div class="verdict-box vb-no"><b style="color:var(--red)">Disputed.</b> ${r.rationale ? esc(r.rationale) : "The source does not confirm this claim."}</div>`;
  const actions = st === SUBMITTED
    ? `<button class="btn primary block" id="verifyBtn"><i class="ph-bold ph-magnifying-glass"></i> Run AI verification</button><div class="hint" style="text-align:center;margin-top:8px">Validators fetch the source and agree. Calls a real LLM.</div>`
    : "";
  $("drawerBody").innerHTML = `
    <div class="post-body">${esc(r.subject)}</div>
    <div style="color:var(--txt2);font-size:16px;margin-bottom:8px">${esc(r.claim)}</div>
    ${verdict}
    <div class="kv"><span class="k">Source</span><span class="v"><a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source_url)}</a></span></div>
    <div class="kv"><span class="k">Attester</span><span class="v mono">${short(r.attester)}</span></div>
    <div class="kv"><span class="k">Status</span><span class="v">${STLABEL[st]}</span></div>
    <div style="margin-top:16px">${actions}</div>`;
  openDrawer();
  if (st === SUBMITTED) $("verifyBtn").onclick = () => doVerify(id);
}

async function doCreate() {
  const subject = $("nSubject").value.trim(), claim = $("nClaim").value.trim(), source = $("nSource").value.trim();
  if (!subject) return toast("Name the subject.", "err");
  if (!claim) return toast("State the claim.", "err");
  if (!source) return toast("Cite a source URL.", "err");
  const btn = $("createBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> submitting';
  try { await ensureWallet(); await write(CONTRACT, "attest", [subject, claim, source]); toast("Attestation submitted.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Submit attestation"; }
}
async function doVerify(id) {
  if (!confirm("Run AI verification? Validators fetch the source and agree whether it confirms the claim. Calls a real LLM.")) return;
  const btn = $("verifyBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> validators reading source';
  try { await ensureWallet(); toast("Validators reading the source…", "", "verify"); await write(CONTRACT, "verify", [id]); toast("Verified on-chain.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); if (btn) { btn.disabled = false; btn.textContent = "Run AI verification"; } }
}

$("heroPostBtn").onclick = openNew;
$("ctaPostBtn").onclick = openNew;
$("refreshBtn").onclick = load;
$("closeDrawer").onclick = closeDrawer;
$("scrim").onclick = closeDrawer;
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);
window.addEventListener("resize", () => { clearTimeout(window._rs); window._rs = setTimeout(drawDonut, 200); });

refreshWallet();
load();

// ====== THREE.JS HERO: a rotating trust-globe (wireframe sphere + nodes) ======
(function heroScene() {
  const canvas = $("heroCanvas"); if (!canvas || !window.THREE) return;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b14, 0.025);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 17);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  const BLUE = 0x54b8ff, CYAN = 0x56f0d6;
  const grp = new THREE.Group(); scene.add(grp);
  const RAD = 5;
  // wireframe globe
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(RAD, 3), new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: .18 }));
  grp.add(globe);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(RAD * 0.98, 32, 32), new THREE.MeshStandardMaterial({ color: 0x0a1830, metalness: .6, roughness: .4, transparent: true, opacity: .55 }));
  grp.add(inner);
  // nodes on the surface (confirmed points of trust)
  const NODES = 90; const nodeGeo = new THREE.SphereGeometry(0.075, 8, 8);
  const nodeMat = new THREE.MeshBasicMaterial({ color: CYAN });
  const pts = [];
  for (let i = 0; i < NODES; i++) {
    const y = 1 - (i / (NODES - 1)) * 2; const r = Math.sqrt(1 - y * y); const th = i * 2.399963;
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(RAD * 1.01);
    const n = new THREE.Mesh(nodeGeo, nodeMat); n.position.copy(v); grp.add(n); pts.push(v);
  }
  // arcs between some nodes
  for (let i = 0; i < 26; i++) {
    const a = pts[Math.floor(Math.random() * pts.length)], b = pts[Math.floor(Math.random() * pts.length)];
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(RAD * 1.32);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    grp.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: .35 })));
  }
  // particles
  const PN = 340, pp = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pp[i*3]=(Math.random()-.5)*44; pp[i*3+1]=(Math.random()-.5)*30; pp[i*3+2]=(Math.random()-.5)*26; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: BLUE, size: .05, transparent: true, opacity: .45 })));

  scene.add(new THREE.AmbientLight(0x2a4a6a, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 5, 8); scene.add(key);
  const rim = new THREE.PointLight(CYAN, 1.6, 40); rim.position.set(-8, 4, 6); scene.add(rim);

  const mouse = { x: 0, y: 0 };
  addEventListener("mousemove", (e) => { mouse.x = (e.clientX / innerWidth - .5) * 2; mouse.y = (e.clientY / innerHeight - .5) * 2; });
  resize(); addEventListener("resize", resize);
  let running = true;
  const vis = new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 });
  vis.observe(canvas);
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    grp.rotation.y += 0.0024; grp.rotation.x = Math.sin(Date.now() * 0.0002) * 0.18;
    camera.position.x += (mouse.x * 2.6 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.y * 1.8 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();
})();
