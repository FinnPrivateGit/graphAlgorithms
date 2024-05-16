const canvas = document.getElementById('drawingArea');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearButton');
const visualizeON3Button = document.getElementById('visualizeON3');
const visualizeONhButton = document.getElementById('visualizeONh');

let points = []; //to store the coords of the points
let visualizationInProgress = false; //prevent drawing points during visualization
let pointCount = 0; //to count the number of points already drawn
let maxPoints = 15; //maximum number of points to draw
let isRunning = false; //stopping/starting algo

//counting checked edges
let checkedEdges = 0;
let counterDiv = document.getElementById('edgeCounter');

//status div
let statusDiv = document.getElementById('status');

//slider
let sliderValue = 100; //initial value
let slider = document.getElementById('myRange');

document.getElementById('myRange').addEventListener('input', function() {
    sliderValue = this.value;
    console.log(sliderValue);
});

//code for the info button
document.getElementById('infoButton').addEventListener('click', function() {
    window.open('info.html', '_blank');
});

//code to get coords for points (drawing and saving)
canvas.addEventListener('click', function(event) {
    if (!visualizationInProgress) { //check if visualization is ongoing
        if (pointCount < maxPoints) { //check if to many points have been painted
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            drawPoint(x, y);
            points.push({x, y});
            localStorage.setItem('points', JSON.stringify(points)); //save the points in the local storage (as strings)
            pointCount++; //inc point counter
        } else {
            alert('You have reached the maximum number of points!');
        }
    }
});

// Code to clear the canvas
clearButton.addEventListener('click', function() {
    isRunning = false;
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    localStorage.removeItem('points'); //remove the points from the local storage
    visualizationInProgress = false; //stop visualization
    visualizeON3Button.disabled = false; //enable the buttons
    visualizeONhButton.disabled = false;
    slider.disabled = false; //enable slider
    pointCount = 0; //reset the point counter
    visualizeON3Button.classList.remove('button-active'); //remove outline from buttons
    visualizeONhButton.classList.remove('button-active');

    //clear the edge counter
    checkedEdges = 0;
    counterDiv.textContent = 'Checks made: ' + checkedEdges;

    statusDiv.textContent = 'Current status: Drawing';

    setTimeout(function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        statusDiv.textContent = 'Current status: Drawing';
    }, sliderValue + 1000); //delay higher than algo delay (that canvas is always empty)
});

// Code to draw points on canvas
function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2, true);
    ctx.fill();
}

// Code for ON3 button
visualizeON3Button.addEventListener('click', function() {
    visualizationInProgress = true;
    visualizeONhButton.disabled = true; //disable buttons
    visualizeON3Button.disabled = true;
    slider.disabled = true; //disable slider
    const savedPoints = JSON.parse(localStorage.getItem('points')); //get the points from the local storage
    visualizeON3Button.classList.add('button-active'); //adding outline to button

    isRunning = true;
    convexHullON3(savedPoints); //call function

});

// Code for ONh button
visualizeONhButton.addEventListener('click', function() {
    visualizationInProgress = true;
    visualizeON3Button.disabled = true; //disable buttons
    visualizeONhButton.disabled = true;
    slider.disabled = true; //disable slider
    const savedPoints = JSON.parse(localStorage.getItem('points')); //get the points from the local storage
    visualizeONhButton.classList.add('button-active'); //adding outline to button

    isRunning = true;
    convexHullONh(savedPoints); //call function

});

// Code to visualize convex hull in O(n^3)
async function convexHullON3(points) {
    statusDiv.textContent = 'Current status: Algo running';
    const n = points.length;
    let redLines = new Set(); //to store the red lines

    for (let i = 0; i < n; i++) {
        if (!isRunning) break;

        for (let j = 0; j < n; j++) {
            if (i == j) continue;

            if (!isRunning) break;

            let q = points[i], r = points[j];
            let isEdge = true;

            checkedEdges++;
            counterDiv.textContent = 'Checks made: ' + checkedEdges;

            //continue if theres a red line already
            if (redLines.has(`${q.x},${q.y}-${r.x},${r.y}`) || redLines.has(`${r.x},${r.y}-${q.x},${q.y}`)) {
                continue;
            }
            
            //draw blue line between q and r
            ctx.beginPath(); //cant use my drawLine function, because q is already read as points[i] and that doesnt support the drawLine function
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(r.x, r.y);
            ctx.strokeStyle = 'blue';
            ctx.stroke();

            await new Promise(resolve => setTimeout(resolve, sliderValue)); //1 sec delay

            for (let k = 0; k < n; k++) {
                if (!isRunning) break;

                if (k === i || k === j) continue;

                let p = points[k];
                let crossProduct = (r.x - q.x) * (p.y - q.y) - (r.y - q.y) * (p.x - q.x);

                if (crossProduct > 0) {
                    isEdge = false;
                    break;
                }
            }
            
            if (!isRunning) break;

            if (isEdge) {
                //change line color to red (symbolizes final edgeKante)
                ctx.beginPath();
                ctx.moveTo(q.x, q.y);
                ctx.lineTo(r.x, r.y);
                ctx.strokeStyle = 'red';
                ctx.stroke();

                //add red line to set
                redLines.add(`${q.x},${q.y}-${r.x},${r.y}`);

            } else {
                //change line color to grey (symbolizes not final edgeKante)
                ctx.beginPath();
                ctx.moveTo(q.x, q.y);
                ctx.lineTo(r.x, r.y);
                ctx.strokeStyle = 'grey';
                ctx.stroke();
            }
            await new Promise(resolve => setTimeout(resolve, sliderValue)); //1 sec delay
        }
    }
    if (!isRunning) return;

    statusDiv.textContent = 'Current status: Algo finished';
}

//TODO: the first green line can be overwritten by a blue line, fix this sometime
//TODO: sometimes the second red line can be overwritten, fix this sometime
// Code to visualize convex hull in O(nh)
async function convexHullONh(points) {
    let hull = []; //store final points

    const n = points.length;

    if (n < 3) {
        alert('Convex hull in O(nh) requires at least 3 points!');

        //doing stuff from clear button, but not clearing canvas
        isRunning = false;
        ctx.fillStyle = 'black';
        visualizationInProgress = false;
        visualizeON3Button.disabled = false;
        visualizeONhButton.disabled = false;
        slider.disabled = false; //enable slider
        pointCount = 0;
        visualizeON3Button.classList.remove('button-active');
        visualizeONhButton.classList.remove('button-active');
        checkedEdges = 0;
        counterDiv.textContent = 'Checks made: ' + checkedEdges;
        statusDiv.textContent = 'Current status: Drawing';

        return;
    }

    statusDiv.textContent = 'Current status: finding leftmost point';

    //find leftmost point
    let l = 0;
    ctx.fillStyle = 'green'; //green = current leftmost point
    drawPoint(points[l].x, points[l].y);

    for (let i = 1; i < n; i++) {
        if (!isRunning) break;

        ctx.fillStyle = 'blue'; //blue = this point more left?
        drawPoint(points[i].x, points[i].y);

        checkedEdges++;
        counterDiv.textContent = 'Checks made: ' + checkedEdges;

        await new Promise(resolve => setTimeout(resolve, sliderValue)); //1 sec delay

        if (!isRunning) break;

        if (points[i].x == points[l].x) {
            if (points[i].y < points[l].y) {
                ctx.fillStyle = 'green';
                drawPoint(points[i].x, points[i].y);
                ctx.fillStyle = 'grey'; //not leftmost point
                drawPoint(points[l].x, points[l].y);
                l = i;
            }
        } else if (points[i].x < points[l].x) {
            ctx.fillStyle = 'green';
            drawPoint(points[i].x, points[i].y);
            ctx.fillStyle = 'grey';
            drawPoint(points[l].x, points[l].y);
            l = i;
        } else {
            ctx.fillStyle = 'grey';
            drawPoint(points[i].x, points[i].y);
        }
    }

    if (!isRunning) return;

    statusDiv.textContent = 'Current status: algo running';

    //start from leftmost point, keep moving counterclockwise
    //until we reach the start point again
    let p = l, q;
    do {
        if (!isRunning) break;

        q = (p + 1) % n;
        drawLine(p, q, 'green', 1);
    
        for (let i = 0; i < n; i++) {
            if (!isRunning) break;

            //skip if point is already in hull array
            if (pointExistsInHull(hull, points[i]) || q == i) continue;
            
            checkedEdges++;
            counterDiv.textContent = 'Checks made: ' + checkedEdges;
            
            drawLine(q, i, 'blue', 1);

            ctx.fillStyle = 'blue'; //current point more right?
            drawPoint(points[i].x, points[i].y);

            await new Promise(resolve => setTimeout(resolve, sliderValue)); //1 sec delay

            if (!isRunning) break;

            if (orientationPoint(points[p], points[i], points[q]) == 2) {
                drawLine(p, i, 'green', 1);

                drawLine(p, q, '#f0f0f0', 3);

                drawLine(q, i, '#f0f0f0', 3);

                ctx.fillStyle = 'grey';
                drawPoint(points[i].x, points[i].y);

                q = i;
            } else {
                drawLine(q, i, '#f0f0f0', 3);

                ctx.fillStyle = 'grey';
                drawPoint(points[i].x, points[i].y);
            }
        }
        if (!isRunning) break;

        drawLine(p, q, 'red', 1);

        ctx.fillStyle = 'red';
        drawPoint(points[q].x, points[q].y);
    
        hull.push(points[q]);
        p = q;
    
    } while (p != l);

    hull.push(points[l]); //add to final points

    for (let i = 0; i < hull.length; i++) {
        if (!isRunning) break;

        ctx.fillStyle = 'red';
        drawPoint(hull[i].x, hull[i].y);

        ctx.beginPath();
        ctx.moveTo(hull[i].x, hull[i].y);
        ctx.lineTo(hull[(i + 1) % hull.length].x, hull[(i + 1) % hull.length].y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }
    if (!isRunning) return;

    statusDiv.textContent = 'Current status: Algo finished';
}

function orientationPoint(p, q, r) {
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0;  //collinear
    return (val > 0)? 1 : 2; //clock or counterclockwise
}

function pointExistsInHull(hull, point) {
    if (!isRunning) return;

    let exists = false;
    for (let i = 0; i < hull.length; i++) {
        if (!isRunning) break;

        if (hull[i].x == point.x && hull[i].y == point.y) {
            exists = true;
            break;
        }
    }
    return exists;
}

function drawLine(pointOne, pointTwo, color, width) {
    if (!isRunning) return;

    ctx.beginPath();
    ctx.moveTo(points[pointOne].x, points[pointOne].y);
    ctx.lineTo(points[pointTwo].x, points[pointTwo].y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}