
/**
 * @type {Ray[]}
 */
let rays = [];

/**
 * @type {Path[]}
 */
let paths = [];

/**
 * @type {Circle[]}
 */
let circles = [];

/** @type {Plane[]} */
let planes = [];

/** @type {(Circle|Plane)[]} */
let geoms = [];

function brightColor(hue) {
    colorMode(HSB);
    let c = color(hue, 100, 100);
    colorMode(RGB);
    return c;
}


function setup() {
    createCanvas(windowWidth, windowHeight - 10);

    // create random circles (and one always in center)
    circles = [new Circle(createVector(0, 0, 0), 40)];

    const w = width / 2;
    const h = height / 2;
    for (let i = 0; i < 20; i++) {
        circles.push(new Circle(
            createVector(random(-w, w), random(-h, h), 0),
            random(10, 100)));
    }

    // create planes
    // planes = [
    //     new Plane(createVector(100, 0), p5.Vector.fromAngle(-QUARTER_PI)),
    //     new Plane(createVector(0, h - 50), p5.Vector.fromAngle(HALF_PI + PI / 64)),
    // ];

    for (let i = 0; i < 3; i++) {
        let p = new Plane(createVector(random(-w, w), random(-h, h)),
            p5.Vector.fromAngle(random(TAU)));
        planes.push(p);
    }

    geoms = [...circles, ...planes];
}

/**
 * @type {p5.Vector}
 */
let dragStart = null;
let isDragging = false;
function mousePressed() {
    isDragging = true;
    dragStart = getCartesianMouse();
}

function mouseReleased() {
    isDragging = false;
    let dragEnd = getCartesianMouse();
    let r = new Ray(dragStart, dir(dragStart, dragEnd));
    r.col = brightColor(random(360)); //color(random(255), random(255), random(255));
    rays.push(r);

    let path = tracePath(r, geoms, rays);
    paths.push(path);

    console.log("RAYS DONE");
}



function draw() {
    background(0);

    if (isDragging) {
        pushCartesian();
        stroke(200);
        let end = getCartesianMouse();
        line(dragStart.x, dragStart.y, end.x, end.y);
        popCartesian();
    }

    pushCartesian();
    noFill();

    // draw rays
    // for (const r of rays) {
    //     stroke(r.col);
    //     line(r.o.x, r.o.y, r.o.x + 2000 * r.d.x, r.o.y + 2000 * r.d.y);
    // }

    // draw circles
    stroke(128);
    fill(255);
    for (const circ of circles) {
        ellipse(circ.c.x, circ.c.y, 2 * circ.r);
    }
    noFill();

    // draw paths
    for (const p of paths) {
        stroke(p.col);
        // strokeWeight(2);
        for (let i = 0; i < p.points.length - 1; i++) {
            let p1 = p.points[i];
            let p2 = p.points[i + 1];
            line(p1.x, p1.y, p2.x, p2.y);
        }
    }

    // draw planes
    stroke(200);
    for (const plane of planes) {
        let [p1, p2] = plane.line();
        line(p1.x, p1.y, p2.x, p2.y);
    }

    // draw axes
    stroke(255, 0, 0);
    line(0, 0, 0, 20); // y axis
    stroke(0, 255, 0);
    line(0, 0, 20, 0); // x axis


    popCartesian();

}

function pushCartesian() {
    push();
    translate(width / 2, height / 2);
    scale(1, -1);
}

function popCartesian() {
    pop();
}

/**
 * Gets mouse position translated to normal cartesian coords with origin
 * at center of the screen.
 * @returns {p5.Vector} */
function getCartesianMouse() {
    return createVector(mouseX - width / 2, -(mouseY - height / 2));
}

/**
 * 
 * @param {p5.Vector} from 
 * @param {p5.Vector} to 
 * @returns {p5.Vector}
 */
function dir(from, to) {
    return p5.Vector.sub(to, from).normalize();
}

/**
 * 
 * @param {p5.Vector} point 
 * @param {(Circle|Plane)} geom 
 */
function normal(point, geom) {
    if (geom instanceof Circle) {
        return dir(geom.c, point);
    } else if (geom instanceof Plane) {
        return geom.n;
    }

    throw new Error("incorrect geom");
}

/**
 *  
 * @param {p5.Vector} incident 
 * @param {p5.Vector} surfaceNormal 
 * @returns {p5.Vector}
 */
function reflectionDir(incident, surfaceNormal) {
    // reflection = I − 2(I⋅N)*N
    // I = incident ray (normalized)
    // N = surface normal
    incident = incident.copy().normalize();
    let cosThetaI = p5.Vector.dot(incident, surfaceNormal)
    return p5.Vector.sub(incident, p5.Vector.mult(surfaceNormal, 2 * cosThetaI));
}

/**
 * 
 * @param {p5.Vector} incident 
 * @param {p5.Vector} surfaceNormal 
 * @param {number} n1 
 * @param {number} n2 
 */
function refractionDir(incident, surfaceNormal, n1, n2) {
    // refraction = r*I + (r*c - sqrt(1-r^2*(1-c^2)))*N
    // I = incident ray (normalized)
    // N = surface normal
    incident = incident.copy().normalize();
    let r = n1 / n2;
    let c = -p5.Vector.dot(incident, surfaceNormal);
    return p5.Vector.add(
        p5.Vector.mult(incident, r),
        p5.Vector.mult(surfaceNormal, r * c - sqrt(1 - r * r * (1 - c * c))));
}

/**
 * 
 * @param {Ray} ray 
 * @param {Circle} circ 
 * @returns {number[]} t, the parametric point(s) on the ray
 */
function rayCircle(ray, circ) {
    // d = -(l·(o-c)) ± sqrt( (l·(o-c))^2 - ||o-c||^2 + r^2 )
    // l: ray direction
    // o: ray origin
    // c: circle center
    // r: circle radius

    let OC = p5.Vector.sub(ray.o, circ.c);
    let rside = Math.pow(p5.Vector.dot(ray.d, OC), 2) - OC.magSq() + (circ.r * circ.r);

    if (rside < 0) {
        return [];
    } else if (rside == 0) {
        let d = -p5.Vector.dot(ray.d, OC);
        return [d];
    } else if (rside > 0) {
        let d = -p5.Vector.dot(ray.d, OC);
        rside = Math.sqrt(rside);
        return [d - rside, d + rside];
    }

    // should be unreachable
    return undefined;
}

// /**
//  *  
//  * @param {Ray} ray1 
//  * @param {Ray} ray2 
//  * @returns {number[]} t1, t2. parametric points on ray1 and ray2 respectively.
//  */
// function rayRay(ray1, ray2) {
//     // t1 = |v2 × v1| / v2 · v3
//     // t2 = v1 · v3 / v2 · v3

//     let v1 = p5.Vector.sub(ray1.o, ray2.o);
//     let v2 = ray2.d;
//     let v3 = createVector(-ray1.d.y, ray1.d.x);

//     let denom = p5.Vector.dot(v2, v3);
//     let t1 = p5.Vector.cross(v2, v1).mag() / denom;
//     let t2 = p5.Vector.dot(v1, v3) / denom;

//     return [t1, t2];
// }

/**
 * 
 * @param {Ray} ray 
 * @param {Plane} plane 
 * @return {number[]}
 */
function rayPlane(ray, plane) {
    // t = (p0 - l0)·n / l·n
    // p0: point in plane
    // n: plane normal
    // l0: ray origin
    // l: ray direction

    let denom = p5.Vector.dot(ray.d, plane.n);
    if (denom == 0) {
        return [];
    } else {
        return [p5.Vector.dot(p5.Vector.sub(plane.p, ray.o), plane.n) / denom];
    }
}

/**
 * 
 * @param {Ray} ray 
 * @param {Circle|Plane} geom 
 */
function rayGeom(ray, geom) {
    if (geom instanceof Circle) {
        return rayCircle(ray, geom);
    } else if (geom instanceof Plane) {
        return rayPlane(ray, geom);
    }

    throw new Error("incorrect geom");
}

/**
 * find nearest point of nearest geom where ray intersects
 * @param {Ray} r 
 * @param {(Circle|Plane)[]} geoms 
 */
function findNearestIntersection(r, geoms) {
    const epsilon = 0.0001;

    let min = { t: Number.POSITIVE_INFINITY, geom: null };
    for (const g of geoms) {
        let tlist = rayGeom(r, g);
        for (const t of tlist) {
            if (t < min.t && t > epsilon) {
                min.t = t;
                min.geom = g;
            }
        }
    }
    return min;
}

/**
 * 
 * @param {Ray} r 
 * @param {(Circle|Plane)[]} geoms 
 * @param {Ray[]} rayList 
 * @param {number} maxBounces 
 * @returns {Path}
 */
function tracePath(r, geoms, rayList = undefined, maxBounces = 50) {
    let path = new Path(r.col);
    path.points.push(r.o);

    for (let min = findNearestIntersection(r, geoms);
        min.geom != null && path.points.length < maxBounces;
        min = findNearestIntersection(r, geoms)) {

        // calculate reflected ray and add to a list
        let p = r.point(min.t);
        path.points.push(p);
        let reflectD = reflectionDir(r.d, normal(p, min.geom));
        let reflectRay = new Ray(p, reflectD);
        reflectRay.col = r.col;
        r = reflectRay;
        if (rayList != undefined) {
            rayList.push(reflectRay);
        }
    }
    // add last ray to path
    path.points.push(r.point(5000));
    return path;
}