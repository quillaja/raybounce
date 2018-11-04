
class Ray {
    /**
     * 
     * @param {p5.Vector} orig 
     * @param {p5.Vector} dir    
     */
    constructor(orig, dir) {

        this.o = orig.copy();
        if (dir.magSq() == 1) {
            this.d = dir.copy();
        } else {
            this.d = dir.copy().normalize();
        }
        this.col = color(255);
    }

    /**
     * 
     * @param {number} t
     * @returns {p5.Vector} 
     */
    point(t) {
        return p5.Vector.add(this.o, p5.Vector.mult(this.d, t));
    }
}

class Path {
    /**
     * 
     * @param {any} col 
     */
    constructor(col) {
        /**
         * @type {p5.Vector[]}
         */
        this.points = [];
        this.col = col;
    }
}

class Circle {
    /**
     * 
     * @param {p5.Vector} c 
     * @param {number} r 
     */
    constructor(c, r) {
        this.c = c.copy();
        this.r = r;
        /** @type {Material} */
        this.mat = new Material();
    }
}

class Plane {
    /**
     * 
     * @param {p5.Vector} pt 
     * @param {p5.Vector} normal 
     */
    constructor(pt, normal) {
        /** @type {p5.Vector} */
        this.p = pt.copy();
        /** @type {p5.Vector} */
        this.n = normal.copy().normalize();
        /** @type {Material} */
        this.mat = new Material();
    }

    /**
     * @returns {p5.Vector[]}
     */
    line() {
        let r = p5.Vector.add(this.p, this.n.copy().rotate(HALF_PI).mult(5000));
        let l = p5.Vector.add(this.p, this.n.copy().rotate(-HALF_PI).mult(5000));
        return [l, r];
    }
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
    // path.points.push(r.o);

    // for (let min = findNearestIntersection(r, geoms);
    //     min.geom != null && path.points.length < maxBounces;
    //     min = findNearestIntersection(r, geoms)) {

    //     // calculate reflected ray and add to a list
    //     let p = r.point(min.t);
    //     path.points.push(p);
    //     let reflectD = reflectionDir(r.d, normal(p, min.geom));
    //     let reflectRay = new Ray(p, reflectD);
    //     reflectRay.col = r.col;
    //     r = reflectRay;
    //     if (rayList != undefined) {
    //         rayList.push(reflectRay);
    //     }
    // }
    // // add last ray to path
    // path.points.push(r.point(5000));
    let [bounces, col] = shootRay(r, geoms, maxBounces);
    path.col = vecToColor(col);
    path.points = [r.o, ...bounces];
    return path;
}

/**
 * recursive
 * @param {Ray} r 
 * @param {(Circle|Plane)[]} geoms 
 * @param {number} depth 
 * @returns {[p5.Vector[], p5.Vector]}
 */
function shootRay(r, geoms, depth) {

    let hit = findNearestIntersection(r, geoms);

    if (depth == 0 || hit.geom == null) {
        console.log("base", Material.WhiteEmitter.emit);
        return [[r.point(5000)], Material.WhiteEmitter.emit];
    }

    let p = r.point(hit.t);
    let reflectD = reflectionDir(r.d, normal(p, hit.geom));

    let [pts, inCol] = shootRay(new Ray(p, reflectD), geoms, depth - 1);
    // is something weird with the calculated color (col)?
    let col = renderingEquation(hit.geom.mat, inCol);
    console.log(col);
    return [[p, ...pts], col];
}