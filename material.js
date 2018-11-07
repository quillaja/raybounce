class Material {
    /**
     * 
     * @param {p5.Color} col 
     */
    constructor(col = undefined) {
        this.emit = createVector(0, 0, 0);
        if (col == undefined) {
            this.color = createVector(1, 1, 1);
        } else {
            this.color = colorToVec(col);
        }
        this.specularity = 1;
        this.n = 1;
    }

    static get WhiteEmitter() {
        let m = new Material();
        m.emit = createVector(1, 1, 1);
        m.color = createVector(0, 0, 0);
        return m;
    }
}

function hadamard(a, b) {
    return createVector(a.x * b.x, a.y * b.y, a.z * b.z);
}

function vecToColor(colVec) {
    return color(255 * colVec.x, 255 * colVec.y, 255 * colVec.z);
}

function colorToVec(col) {
    return createVector(red(col), green(col), blue(col)).div(255);
}

/**
 * super janky version of the rendering equation
 * @param {Material} mat 
 * @param {p5.Vector} inCol 
 */
function renderingEquation(mat, inCol) {
    let matCol = mat.color;
    let col = createVector(inCol.x * matCol.x, inCol.y * matCol.y, inCol.z * matCol.z);
    col.add(mat.emit);
    return col;
}

/**
 * 
 * @param {p5.Vector} incident 
 * @param {p5.Vector} surfaceNormal 
 * @param {number} n1 
 * @param {number} n2 
 * @returns {[number,number]}
 */
function schlick(incident, surfaceNormal, n1, n2) {
    // R = r0 + (1-r0)(1-N⋅I)^5
    // r0 = ((n1-n2)/(n1+n2))^2
    // R = reflective power
    // N = surface normal (normalized)
    // I = incident light (normalized)
    // n1, n2 = indicies of refraction
    // T = 1-R = transmitted power (refracted)
    let r0 = Math.pow((n1 - n2) / (n1 + n2), 2);
    let r = r0 + (1 - r0) * Math.pow(1 - surfaceNormal.dot(incident), 5);
    return [r, 1 - r];
}

/**
 * 
 * @param {number} n1 the higher of the 2 indicies of refraction
 * @param {number} n2 the lower of the 2
 */
function criticalAngle(n1, n2) {
    return Math.asin(n2 / n1);
}