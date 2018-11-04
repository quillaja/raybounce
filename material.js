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