"use strict";

const GLOBE_LIBS = [
	"vendor/d3-array.min.js",
	"vendor/d3-geo.min.js",
	"vendor/topojson-client.min.js"
];

const GLOBE_COLORS = {
	ocean: "#dbeafe",
	land: "#e7e5e4",
	covered: "#86efac",
	border: "#78716c"
};

let globeLibsPromise = null;

function loadScript(src) {
	return new Promise(function (resolve, reject) {
		const tag = document.createElement("script");
		tag.src = src;
		tag.onload = resolve;
		tag.onerror = function () {
			reject(new Error("Failed to load " + src));
		};
		document.head.append(tag);
	});
}

function ensureGlobeLibs() {
	if (!globeLibsPromise) {
		const built = GLOBE_LIBS.reduce(
			function (chain, src) {
				return chain.then(function () {
					return loadScript(src);
				});
			}, Promise.resolve());
		globeLibsPromise = built.catch(function (err) {
			globeLibsPromise = null;
			throw err;
		});
	}
	return globeLibsPromise;
}

async function mountGlobe(container) {
	const gen = navGen;
	await ensureGlobeLibs();
	const world = await loadJson(
		"vendor/countries-110m.json");
	const index = await loadIndex();
	if (gen !== navGen) {
		return;
	}

	const countries = topojson.feature(
		world, world.objects.countries).features;
	const slugByIsoNum = {};
	for (const c of index.countries) {
		slugByIsoNum[c.iso_num] = c.slug;
	}
	const infoByIsoNum = {};
	for (const c of index.countries) {
		infoByIsoNum[c.iso_num] = c;
	}

	container.replaceChildren();
	const wrap = el("div", "globe-wrap");
	const canvas = el("canvas", "globe-canvas");
	wrap.append(canvas);
	const tip = el("div", "globe-tooltip");
	tip.hidden = true;
	wrap.append(tip);
	container.append(wrap);
	container.append(el("p", "globe-hint",
		"Drag to spin · pinch or scroll to zoom · " +
		"tap a green country"));
	const toast = el("p", "globe-toast");
	toast.hidden = true;
	container.append(toast);

	const size = Math.min(
		container.clientWidth || 360, 480);
	const dpr = window.devicePixelRatio || 1;
	canvas.width = size * dpr;
	canvas.height = size * dpr;
	canvas.style.width = size + "px";
	canvas.style.height = size + "px";
	const ctx = canvas.getContext("2d");

	const projection = d3.geoOrthographic().fitExtent(
		[[8, 8], [size - 8, size - 8]],
		{type: "Sphere"});
	const baseScale = projection.scale();
	const geoPath = d3.geoPath(projection, ctx);

	function draw() {
		ctx.save();
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, size, size);
		ctx.beginPath();
		geoPath({type: "Sphere"});
		ctx.fillStyle = GLOBE_COLORS.ocean;
		ctx.fill();
		for (const f of countries) {
			ctx.beginPath();
			geoPath(f);
			ctx.fillStyle = slugByIsoNum[f.id]
				? GLOBE_COLORS.covered
				: GLOBE_COLORS.land;
			ctx.fill();
			ctx.strokeStyle = GLOBE_COLORS.border;
			ctx.lineWidth = 0.5;
			ctx.stroke();
		}
		ctx.beginPath();
		geoPath({type: "Sphere"});
		ctx.strokeStyle = GLOBE_COLORS.border;
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();
	}

	let toastTimer = null;
	function showToast(msg) {
		toast.textContent = msg;
		toast.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () {
			toast.hidden = true;
		}, 2200);
	}

	function visible(coord) {
		const rot = projection.rotate();
		return d3.geoDistance(coord,
			[-rot[0], -rot[1]]) < Math.PI / 2;
	}

	function onSphere(x, y) {
		const t = projection.translate();
		return Math.hypot(x - t[0], y - t[1]) <=
			projection.scale();
	}

	function nearestCovered(x, y) {
		let best = null;
		let bestDist = 14;
		for (const f of countries) {
			if (!slugByIsoNum[f.id]) {
				continue;
			}
			const c = d3.geoCentroid(f);
			if (!visible(c)) {
				continue;
			}
			const p = projection(c);
			const dist = Math.hypot(
				p[0] - x, p[1] - y);
			if (dist < bestDist) {
				bestDist = dist;
				best = f;
			}
		}
		return best;
	}

	function featureAt(x, y) {
		if (!onSphere(x, y)) {
			return null;
		}
		const geo = projection.invert([x, y]);
		for (const f of countries) {
			if (d3.geoContains(f, geo)) {
				return f;
			}
		}
		return null;
	}

	function hideTip() {
		cancelAnimationFrame(hoverRaf);
		hoverRaf = 0;
		tip.hidden = true;
		canvas.style.cursor = "grab";
	}

	function showTip(x, y) {
		const f = featureAt(x, y);
		if (!f) {
			hideTip();
			return;
		}
		const info = infoByIsoNum[f.id];
		tip.replaceChildren();
		if (info) {
			tip.append(el("div", "tip-name",
				info.flag + " " + info.name));
			tip.append(el("div", "tip-langs",
				info.languages.join(", ")));
		} else {
			tip.append(el("div", "tip-name",
				f.properties.name));
			tip.append(el("div", "tip-langs",
				"not covered yet"));
		}
		tip.hidden = false;
		const max = size - tip.offsetWidth - 4;
		tip.style.left = (canvas.offsetLeft +
			Math.max(0, Math.min(max, x + 14))) +
			"px";
		tip.style.top = (canvas.offsetTop + y + 14) +
			"px";
		canvas.style.cursor = info ? "pointer" : "grab";
	}

	function tap(x, y) {
		if (!onSphere(x, y)) {
			return;
		}
		let hit = featureAt(x, y);
		if (!hit) {
			hit = nearestCovered(x, y);
		}
		if (!hit) {
			return;
		}
		const slug = slugByIsoNum[hit.id];
		if (slug) {
			location.hash = "#/" + slug;
		} else {
			showToast(hit.properties.name +
				" isn't covered yet.");
		}
	}

	function setScale(s) {
		projection.scale(Math.max(baseScale,
			Math.min(baseScale * 6, s)));
		draw();
	}

	const pointers = new Map();
	let start = null;
	let pinched = false;
	let lastPinch = 0;
	let hoverPt = null;
	let hoverRaf = 0;

	function pinchDist() {
		const pts = Array.from(pointers.values());
		return Math.hypot(pts[0][0] - pts[1][0],
			pts[0][1] - pts[1][1]);
	}

	canvas.addEventListener("pointerdown", function (ev) {
		hideTip();
		try {
			canvas.setPointerCapture(ev.pointerId);
		} catch (err) {
			/* pointer already gone; ignore */
		}
		pointers.set(ev.pointerId,
			[ev.offsetX, ev.offsetY]);
		if (pointers.size === 1) {
			start = [ev.offsetX, ev.offsetY];
			pinched = false;
		} else if (pointers.size === 2) {
			pinched = true;
			lastPinch = pinchDist();
		}
	});

	canvas.addEventListener("pointermove", function (ev) {
		if (pointers.size === 0 &&
				ev.pointerType === "mouse") {
			hoverPt = [ev.offsetX, ev.offsetY];
			if (!hoverRaf) {
				hoverRaf =
					requestAnimationFrame(
						function () {
							hoverRaf = 0;
							showTip(
								hoverPt[0],
								hoverPt[1]);
						});
			}
			return;
		}
		if (!pointers.has(ev.pointerId)) {
			return;
		}
		const prev = pointers.get(ev.pointerId);
		const cur = [ev.offsetX, ev.offsetY];
		pointers.set(ev.pointerId, cur);
		if (pointers.size === 1) {
			const k = 90 / projection.scale();
			const rot = projection.rotate();
			projection.rotate([
				rot[0] + (cur[0] - prev[0]) * k,
				Math.max(-90, Math.min(90,
					rot[1] -
					(cur[1] - prev[1]) * k))
			]);
			draw();
		} else if (pointers.size === 2) {
			const dist = pinchDist();
			if (lastPinch > 0) {
				setScale(projection.scale() *
					dist / lastPinch);
			}
			lastPinch = dist;
		}
	});

	function endPointer(ev) {
		const pt = pointers.get(ev.pointerId);
		pointers.delete(ev.pointerId);
		if (pointers.size < 2) {
			lastPinch = 0;
		} else if (pointers.size === 2) {
			lastPinch = pinchDist();
		}
		if (pointers.size === 0) {
			if (!pinched && start && pt &&
					Math.hypot(
						pt[0] - start[0],
						pt[1] - start[1])
					< 5) {
				tap(pt[0], pt[1]);
			}
			start = null;
		}
	}

	canvas.addEventListener("pointerup", endPointer);
	canvas.addEventListener("pointercancel", endPointer);
	canvas.addEventListener("pointerleave", hideTip);

	canvas.addEventListener("wheel", function (ev) {
		ev.preventDefault();
		setScale(projection.scale() *
			Math.pow(1.001, -ev.deltaY));
	}, {passive: false});

	window.hwGlobe = {
		rotateTo: function (lon, lat) {
			projection.rotate([-lon, -lat]);
			draw();
		},
		tapAt: function (x, y) {
			tap(x, y);
		},
		hoverAt: function (x, y) {
			showTip(x, y);
		},
		projection: projection,
		size: size
	};

	draw();
}
