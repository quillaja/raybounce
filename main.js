
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
    circles[0].mat.emit = createVector(1, 1, 1);

    const w = width / 2;
    const h = height / 2;
    for (let i = 0; i < 20; i++) {
        let c = new Circle(
            createVector(random(-w, w), random(-h, h), 0),
            random(10, 100));
        c.mat = new Material(brightColor(random(360)));
        circles.push(c);
    }

    // create random planes (lines in 2d)
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
    r.col = brightColor(random(360));
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
    noStroke();
    for (const circ of circles) {
        fill(vecToColor(circ.mat.color));
        ellipse(circ.c.x, circ.c.y, 2 * circ.r);
    }
    noFill();

    // draw planes
    stroke(200);
    for (const plane of planes) {
        let [p1, p2] = plane.line();
        line(p1.x, p1.y, p2.x, p2.y);
    }

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

