
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