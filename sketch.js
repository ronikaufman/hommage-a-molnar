// By Roni Kaufman
// December 2022

// License: CC BY-NC-SA 4.0

p5.disableFriendlyErrors = true;

let mySeed;
let margin; // margin around the composition
let s, gap;
let backCol, contrastCol;
let outerRatio, innerRatio;

let blocks = [];

const NO_CHANGE = 0, RAND_LINE = 1, RAND_EVERY = 2, FLIP_LINE = 3, FLIP_EVERY = 4;
let ityPos = [NO_CHANGE, RAND_LINE, RAND_EVERY, FLIP_LINE, FLIP_EVERY];

const RECT = 0, FULL_ROUND = 1, HALF_ROUND = 2, TRIANG = 3;
let capPos = [RECT, FULL_ROUND, HALF_ROUND, TRIANG];

let myWhite = 245, myBlack = 10;

let roundRandom;

function preload() {
  myFont = loadFont("./font/VictorMono-Medium.ttf");
}

function setup() {
  outerRatio = sqrt(2); // ratio of the whole image
  innerRatio = 1.5; // ratio of the inner composition (without the margin)
	let W = windowWidth, H = windowHeight;
	//let W = 620, H = 877; // dimensions for A4 300dpi
  let w = (H>outerRatio*W) ? W : H/outerRatio; // width of the whole image
  margin = floor(w*(innerRatio-outerRatio)/(2*(innerRatio-1)));
  // margin/w solves the following equation in m:
  // (w - 2*m) * innerRatio = w*outerRatio - 2*m
  createCanvas(w, w*outerRatio, WEBGL);
  pixelDensity(4);
  noStroke();
  noLoop();

  let params = getURLParams();
  mySeed = params.seed;
  if (mySeed == undefined) mySeed = ~~random(1000);
}

function draw() {
  randomSeed(mySeed);

  push();
  rotate(random([0, PI]));
  translate(-width/2, -height/2);

  [backCol, contrastCol] = shuffle([myWhite, myBlack]);
  let palette = makePalette();

  let verticality = random(ityPos);
  let a0ity = random(ityPos);
  let thinity = random([NO_CHANGE, RAND_LINE, FLIP_LINE, FLIP_EVERY]);


  let outerV = random([RECT, FULL_ROUND, TRIANG]);
  let innerV = outerV == TRIANG ? RECT : outerV;
  let outerH = random() < 0.8 ? outerV : random([RECT, FULL_ROUND, TRIANG]);
  let innerH = outerH == TRIANG ? RECT : outerH;
  roundRandom = random() < 0.1;


  let capV = random(possibleCaps(outerV));
  let capH = outerV == outerH ? capV : random(possibleCaps(outerH));
  if (roundRandom) capV = capH = RECT;


  let v = random([6, 12, 18, 24, 30, 36, 42]); // the volume (or area) of each block
  let divisors = findDivisors(v); // v's divisors
  let m = lcm(divisors); // the lower common multiplier of the divisors of v

  if (random() < 1/3) { // make a perfect grid
    let divisors2 = findDivisors(v*1.5);
    let commonDivisors = divisors.filter((n) => (divisors2.indexOf(n) > -1)); // intersection of the two arrays
    if (random() < 1/2) commonDivisors.shift();
    let di = random(commonDivisors);
    for (let i = 0; i < divisors.length; i++) divisors[i] = di;
  }

  s = (width-2*margin)/m; // size of 1 grid unit
  sHalf = s/2; // used for thin blocks
  gap = s/random([4, 5, 6, 7, 8]); // gap between blocs
  let canThin = (sHalf-2*gap)/width > 0.004;
  if (!canThin) thinity = NO_CHANGE;
  let remaining = v*innerRatio;

  let y = margin;
  if (random() < 1/2) divisors.pop(); // remove the very tall lines
  let vertical = random() < 1/2;
  let a0 = (random() < 1/2) ? 0 : 1;
  let thin = (!canThin || thinity == NO_CHANGE) ? false : random() < 1/2;
  let lineCount = random([0, 1]);
  let alternate = random() < 2/3; // whether we alternate lines with white
  let col1 = ~~random(palette.length-1), col2 = ~~random(palette.length-1);
  while (col1 == col2) {
    col2 = ~~random(palette.length-1);
  }
  if (alternate) col2 = -1;
  while (remaining > 0) {
    let possibleDivisors = [];
    for (let di of divisors) {
      if (di <= remaining) possibleDivisors.push(di);
    }
    let d = random(possibleDivisors);
    remaining -= d;
    let h = d*s;
    let w = (v/d)*s;
    let x = margin;

    for (let i = 0; i < v; i += v/d) {
      //col = palette[k++%palette.length];
      if (verticality == RAND_EVERY) vertical = random() < 1/2;
      if (verticality == FLIP_EVERY) vertical = !vertical;
      if (a0ity == RAND_EVERY) a0 = random() < 0.5 ? 0 : 1;
      if (a0ity == FLIP_EVERY) a0 = 1 - a0;
      //if (thinity == RAND_EVERY) thin = random() < 1/2;
      if (thinity == FLIP_EVERY) thin = !thin;
      if (v/d == 1) {
        vertical = true;
        a0 = 0;
      }
      else if (d == 1) {
        vertical = false;
        a0 = 0;
      }
      let col = (lineCount % 2 == 0) ? col1 : col2;
      blocks.push({
        x: x,
        y: y,
        nw: v/d,
        nh: d,
        col: col,
        a0: a0,
        vertical: vertical,
        outerV: outerV,
        innerV: innerV,
        outerH: outerH,
        innerH: innerH,
        capV: capV,
        capH: capH,
        line: lineCount,
        thin: thin
      });

      x += w;
    }
    y += h;
    if (verticality == RAND_LINE) vertical = random() < 1/2;
    if (verticality == FLIP_LINE) vertical = !vertical;
    if (a0ity == RAND_LINE) a0 = random() < 1/2 ? 0 : 1;
    if (a0ity == FLIP_LINE) a0 = 1 - a0;
    if (thinity == RAND_LINE) thin = random() < 1/2;
    if (thinity == FLIP_LINE) thin = !thin;
    lineCount++;
  }

  let idx = ~~random(blocks.length);
  //while (blocks[idx].nw < 2 || blocks[idx].nh < 2) idx = ~~random(blocks.length);
  if (a0ity == NO_CHANGE && random() < 1/2) blocks[idx].a0 = 1-blocks[idx].a0;
  if (verticality == NO_CHANGE && random() < 1/2 && blocks[idx].nw > 1 && blocks[idx].nh > 1) blocks[idx].vertical = !blocks[idx].vertical;
  if (thinity == NO_CHANGE && random() < 1/2 && canThin) blocks[idx].thin = true;
  //blocks[idx].col = ~~random(palette.length-1)


  let entireGradient = (palette.length == 8) || (random() < 1/2); // true if the gradient is over the whole canvas, false if it's block-wise
  let colorLines = !entireGradient || (random() < 1/2); // true if the lines have color, false if it's the background (which is only possible if !entireGradient)
  let pg = createGraphics(width, height, WEBGL);
	pg.background(backCol);
  pg.translate(-width/2, -height/2);
  pg.noStroke();

  if (entireGradient) {
    let h = height/(palette.length-1);
    let k = 0;
    for (let y = 0; y < height; y += h) {
      pg.beginShape();
      pg.fill(palette[k]);
      pg.vertex(0, y);
      pg.vertex(width, y);
      pg.fill(palette[(k+1)%palette.length]);
      pg.vertex(width, y+h);
      pg.vertex(0, y+h);
      pg.endShape();
      k++;
    }
  }

  background(backCol);

  let secondContrastCol = (random() < 1/2) ? contrastCol : 127;
  let col2off = (secondContrastCol == contrastCol  || !alternate) ? 1 : random([0, 1]); // if it's 0, the color won't have a gradient (in case of alternate, !entireGradient and colorLines)
  let theBit = (backCol == myBlack) ? 1 : 0; // bit used for the case where entireGradient, colorLines and alternate
  for (let b of blocks) {
    if (b.thin) {
      s = sHalf;
      b.nw *= 2;
      b.nh *= 2;
    } else {
      s = 2*sHalf;
    }
    if (entireGradient && alternate) {
      if (b.line % 2 == 1) {
        contrastCol = myBlack;
        backCol = myWhite;
      } else {
        contrastCol = myWhite;
        backCol = myBlack;
      }
      fill(backCol);
      blendMode(BLEND);
      if (!colorLines) rect(b.x, b.y, b.nw*s, b.nh*s);
    }
    drawBlock(b.x, b.y, b.nw, b.nh, b.a0, b.vertical, b.outerV, b.innerV, b.outerH, b.innerH, b.capV, b.capH);
    if (entireGradient && alternate) {
      let darkestMode = brightness(color(backCol)) > 50;
      if (colorLines) darkestMode = !darkestMode;
      blendMode(darkestMode ? DARKEST : LIGHTEST);
      image(pg, b.x, b.y, b.nw*s, b.nh*s, b.x, b.y, b.nw*s, b.nh*s);

      if (colorLines && b.line % 2 == theBit) {
        blendMode(BLEND);
        fill(contrastCol);
        rect(b.x, b.y, b.nw*s, b.nh*s);
        [backCol, contrastCol] = [contrastCol, backCol];
        drawBlock(b.x, b.y, b.nw, b.nh, b.a0, b.vertical, b.outerV, b.innerV, b.outerH, b.innerH, b.capV, b.capH);
        [backCol, contrastCol] = [contrastCol, backCol];
      }
    }
    if (!entireGradient) {
      let col1 = (b.col == -1) ? contrastCol : palette[b.col%palette.length];
      let col2 = (b.col == -1) ? secondContrastCol : palette[(b.col+col2off)%palette.length];
      if (b.a0 == 1) [col1, col2] = [col2, col1];
      pg.beginShape()
      pg.fill(col1);
      pg.vertex(b.x, b.y);
      if (b.nw < b.nh) pg.vertex(b.x+b.nw*s, b.y);
      else pg.vertex(b.x, b.y+b.nh*s);
      pg.fill(col2);
      pg.vertex(b.x+b.nw*s, b.y+b.nh*s);
      if (b.nw < b.nh) pg.vertex(b.x, b.y+b.nh*s);
      else pg.vertex(b.x+b.nw*s, b.y);
      pg.endShape();
    }
  }

  if (entireGradient && alternate) {
    if (!colorLines) {
      blendMode(BLEND);
      image(pg, 0, 0, margin, height, 0, 0, margin, height);
      image(pg, width-margin, 0, margin, height, width-margin, 0, margin, height);
      image(pg, margin, 0, width-2*margin, margin, margin, 0, width-2*margin, margin);
      image(pg, margin, height-margin, width-2*margin, margin, margin, height-margin, width-2*margin, margin);
    } else {
      [backCol, contrastCol] = [contrastCol, backCol];
    }
  } else {
    let darkestMode = brightness(color(backCol)) > 50;
    if (colorLines) darkestMode = !darkestMode;
    blendMode(darkestMode ? DARKEST : LIGHTEST);
    image(pg, 0, 0);
  }

  pop();
  blendMode(BLEND);
  noStroke();
  fill(contrastCol);
  textSize(width/50);
  textFont(myFont);
  text(`seed=${mySeed}`, margin/4-width/2, height/2-margin/4);
}

// returns all divisors of x in an array
function findDivisors(x) {
  let arr = [1];
  for (let i = 2; i <= x; i++) {
    if (floor(x/i) == x/i) arr.push(i);
  }
  return arr;
}

// finds the lower common multiple of the elements of arr (an array)
function lcm(arr) {
  let k = 2;
  let e = arr[0];
  while (true) {
    let m = e*k;
    // is this multiple of arr[0] also a multiple of all other elements?
    let allGood = true;
    for (let i = 1; i < arr.length; i++) {
      if (floor(m/arr[i]) != m/arr[i]) {
        allGood = false;
        break;
      }
    }
    if (allGood) return m;
    k++;
  }
}

function makePalette() {
  let allColors = ["#f4d718", "#fc9d0f", "#ed361a", "#f260c1", "#b940e5", "#1e6ddb", "#18cdf2", "#7ae01a"];
  let idx1 = ~~random(allColors.length);
  let idx2 = idx1 + ~~random(3, 5);
	if (random() < 0.01) idx2 = idx1 + allColors.length;
  pal = [];
  for (let i = idx1; i < idx2; i++) {
    pal.push(allColors[i%allColors.length]);
  }

  if (random() < 0.1) pal = [220, 127, 35];

  if (random() < 1/2) pal.reverse();
  return pal;
}

function drawBlock(x, y, nw, nh, a0, vertical, outerV, innerV, outerH, innerH, capV, capH) {
  let a = a0;

  if (roundRandom) {
    outerV = random([RECT, FULL_ROUND, TRIANG]);
    innerV = random([RECT, FULL_ROUND, TRIANG]);
    outerH = random([RECT, FULL_ROUND, TRIANG]);
    innerH = random([RECT, FULL_ROUND, TRIANG]);
  }

  fill(contrastCol);
  if (vertical) {
    // vertical zig zag (up-down)

    if (a == 0) {
      // bottom left cap
      if (capV == RECT) rect(x+gap, y+(nh-1)*s, s-2*gap, s-gap);

      if (capV == HALF_ROUND) rect(x+gap, y+(nh-1)*s, s-2*gap, gap);
      if (capV == HALF_ROUND) arc(x+gap, y+(nh-1)*s+gap, 2*s-4*gap, 2*s-4*gap, 0, PI/2);

      if (capV == FULL_ROUND || capV == TRIANG) rect(x+gap, y+(nh-1)*s, s-2*gap, s/2);
      if (capV == FULL_ROUND) arc(x+s/2, y+(nh-1/2)*s, s-2*gap, s-2*gap, 0, PI);
      if (capV == TRIANG) {
        triangle(x+gap, y+(nh-1/2)*s, x+s/2, y+(nh-1/2)*s, x+s/2, y+(nh-1/2)*s+s/2-gap);
        square(x+s/2, y+(nh-1/2)*s, s/2-gap);
      }
    } else {
      // top left cap
      if (capV == RECT) rect(x+gap, y+gap, s-2*gap, s-gap);

      if (capV == HALF_ROUND) rect(x+gap, y+s-gap, s-2*gap, gap);
      if (capV == HALF_ROUND) arc(x+gap, y+s-gap, 2*s-4*gap, 2*s-4*gap, 3*PI/2, TAU);

      if (capV == FULL_ROUND || capV == TRIANG) rect(x+gap, y+s/2, s-2*gap, s/2);
      if (capV == FULL_ROUND) arc(x+s/2, y+s/2, s-2*gap, s-2*gap, PI, TAU);
      if (capV == TRIANG) {
        triangle(x+gap, y+s/2, x+s/2, y+s/2, x+s/2, y+gap);
        square(x+s/2, y+gap, s/2-gap);
      }
    }
    if ((a == 0 && nw % 2 == 0) || (a == 1 && nw % 2 == 1)) {
      // bottom right cap
      if (capV == RECT) rect(x+gap+(nw-1)*s, y+(nh-1)*s, s-2*gap, s-gap);

      if (capV == HALF_ROUND) rect(x+gap+(nw-1)*s, y+(nh-1)*s, s-2*gap, gap);
      if (capV == HALF_ROUND) arc(x+s-gap+(nw-1)*s, y+(nh-1)*s+gap, 2*s-4*gap, 2*s-4*gap, PI/2, PI);

      if (capV == FULL_ROUND || capV == TRIANG) rect(x+gap+(nw-1)*s, y+(nh-1)*s, s-2*gap, s/2);
      if (capV == FULL_ROUND) arc(x+s/2+(nw-1)*s, y+(nh-1/2)*s, s-2*gap, s-2*gap, 0, PI);
      if (capV == TRIANG) {
        triangle(x+(nw-1/2)*s, y+(nh-1/2)*s, x+nw*s-gap, y+(nh-1/2)*s, x+(nw-1/2)*s, y+nh*s-gap);
        square(x+gap+(nw-1)*s, y+(nh-1/2)*s, s/2-gap);
      }
    } else {
      // top right cap
      if (capV == RECT) rect(x+gap+(nw-1)*s, y+gap, s-2*gap, s-gap);

      if (capV == HALF_ROUND) rect(x+gap+(nw-1)*s, y+s-gap, s-2*gap, gap);
      if (capV == HALF_ROUND) arc(x+nw*s-gap, y+s-gap, 2*s-4*gap, 2*s-4*gap, PI, 3*PI/2);

      if (capV == FULL_ROUND || capV == TRIANG) rect(x+gap+(nw-1)*s, y+s/2, s-2*gap, s/2);
      if (capV == FULL_ROUND) arc(x+(nw-1/2)*s, y+s/2, s-2*gap, s-2*gap, PI, TAU);
      if (capV == TRIANG) {
        triangle(x+(nw-1/2)*s, y+gap, x+(nw-1/2)*s, y+s/2, x+nw*s-gap, y+s/2);
        square(x+gap+(nw-1)*s, y+gap, s/2-gap);
      }
    }

    for (let i = 0; i < nw; i++) {
      fill(contrastCol);
      rect(x+i*s+gap, y+s, s-2*gap, (nh-2)*s);

      if (i < nw - 1) {
        if (a == 0) {
          // top
          if (outerV == FULL_ROUND) arc(x+(i+1)*s, y+s, 2*s-2*gap, 2*s-2*gap, PI, 0);
          else rect(x+i*s+gap, y+gap, 2*s-2*gap, s-gap);
        } else {
          // bottom
          if (outerV == FULL_ROUND) arc(x+(i+1)*s, y+(nh-1)*s, 2*s-2*gap, 2*s-2*gap, 0, PI);
          else rect(x+i*s+gap, y+(nh-1)*s, 2*s-2*gap, s-gap);
        }
        fill(backCol);
        if (a == 0) {
          // top
          if (innerV == FULL_ROUND) arc(x+(i+1)*s, y+s, 2*gap, 2*gap, PI, 0);
          else {
            rect(x+(i+1)*s-gap, y+s-gap, 2*gap, 2*gap);
            if (outerV == TRIANG) {
              triangle(x+i*s+gap, y+gap, x+i*s+s/2, y+gap, x+i*s+gap, y+s/2);
              triangle(x+(i+3/2)*s, y+gap, x+(i+2)*s-gap, y+gap, x+(i+2)*s-gap, y+s/2);
            }
          }
        } else {
          // bottom
          if (innerV == FULL_ROUND) arc(x+(i+1)*s, y+(nh-1)*s, 2*gap, 2*gap, 0, PI);
          else {
            rect(x+(i+1)*s-gap, y+(nh-1)*s-gap, 2*gap, 2*gap);
            if (outerV == TRIANG) {
              triangle(x+i*s+gap, y+nh*s-gap, x+i*s+gap, y+(nh-1/2)*s, x+i*s+s/2, y+nh*s-gap);
              triangle(x+(i+3/2)*s, y+nh*s-gap, x+(i+2)*s-gap, y+nh*s-gap, x+(i+2)*s-gap, y+(nh-1/2)*s);
            }
          }
        }
      }

      if (a == 0) a = 1;
      else a = 0;
    }
  } else {
    // horizontal zig zag (right-left)

    if (a == 0) {
      // top right cap
      if (capH == RECT) rect(x+(nw-1)*s, y+gap, s-gap, s-2*gap);

      if (capH == HALF_ROUND) rect(x+(nw-1)*s, y+gap, gap, s-2*gap);
      if (capH == HALF_ROUND) arc(x+(nw-1)*s+gap, y+gap, 2*s-4*gap, 2*s-4*gap, 0, PI/2);

      if (capH == FULL_ROUND || capH == TRIANG) rect(x+(nw-1)*s, y+gap, s/2, s-2*gap);
      if (capH == FULL_ROUND) arc(x+(nw-1/2)*s, y+s/2, s-2*gap, s-2*gap, 3*PI/2, PI/2);
      if (capH == TRIANG) {
        triangle(x+(nw-1/2)*s, y+gap, x+(nw-1/2)*s, y+s/2, x+nw*s-gap, y+s/2);
        square(x+(nw-1/2)*s, y+s/2, s/2-gap);
      }
    } else {
      // top left cap
      if (capH == RECT) rect(x+gap, y+gap, s-gap, s-2*gap);

      if (capH == HALF_ROUND) rect(x+s-gap, y+gap, gap, s-2*gap);
      if (capH == HALF_ROUND) arc(x+s-gap, y+gap, 2*s-4*gap, 2*s-4*gap, PI/2, PI);

      if (capH == FULL_ROUND || capH == TRIANG) rect(x+s/2, y+gap, s/2, s-2*gap);
      if (capH == FULL_ROUND) arc(x+s/2, y+s/2, s-2*gap, s-2*gap, PI/2, 3*PI/2);
      if (capH == TRIANG) {
        triangle(x+s/2, y+gap, x+s/2, y+s/2, x+gap, y+s/2);
        square(x+gap, y+s/2, s/2-gap);
      }
    }
    if ((a == 0 && nh % 2 == 0) || (a == 1 && nh % 2 == 1)) {
      // bottom right cap
      if (capH == RECT) rect(x+(nw-1)*s, y+gap+(nh-1)*s, s-gap, s-2*gap);

      if (capH == HALF_ROUND) rect(x+(nw-1)*s, y+gap+(nh-1)*s, gap, s-2*gap);
      if (capH == HALF_ROUND) arc(x+(nw-1)*s+gap, y+nh*s-gap, 2*s-4*gap, 2*s-4*gap, 3*PI/2, TAU);

      if (capH == FULL_ROUND || capH == TRIANG) rect(x+(nw-1)*s, y+(nh-1)*s+gap, s/2, s-2*gap);
      if (capH == FULL_ROUND) arc(x+(nw-1/2)*s, y+s/2+(nh-1)*s, s-2*gap, s-2*gap, 3*PI/2, PI/2);
      if (capH == TRIANG) {
        triangle(x+(nw-1/2)*s, y+(nh-1/2)*s, x+(nw-1/2)*s, y+nh*s-gap, x+nw*s-gap, y+(nh-1/2)*s);
        square(x+(nw-1/2)*s, y+(nh-1)*s+gap, s/2-gap);
      }
    } else {
      // bottom left cap
      if (capH == RECT) rect(x+gap, y+gap+(nh-1)*s, s-gap, s-2*gap);

      if (capH == HALF_ROUND) rect(x+s-gap, y+(nh-1)*s+gap, gap, s-2*gap);
      if (capH == HALF_ROUND) arc(x+s-gap, y+nh*s-gap, 2*s-4*gap, 2*s-4*gap, PI, 3*PI/2);

      if (capH == FULL_ROUND || capH == TRIANG) rect(x+s/2, y+(nh-1)*s+gap, s/2, s-2*gap);
      if (capH == FULL_ROUND) arc(x+s/2, y+(nh-1/2)*s, s-2*gap, s-2*gap, PI/2, 3*PI/2);
      if (capH == TRIANG) {
        triangle(x+gap, y+(nh-1/2)*s, x+s/2, y+(nh-1/2)*s, x+s/2, y+nh*s-gap);
        square(x+gap, y+gap+(nh-1)*s, s/2-gap);
      }
    }

    for (let j = 0; j < nh; j++) {
      fill(contrastCol);
      rect(x+s, y+gap+j*s, (nw-2)*s, s-2*gap);

      if (j < nh - 1) {
        if (a == 0) {
          // left
          if (outerH == FULL_ROUND) arc(x+s, y+(j+1)*s, 2*s-2*gap, 2*s-2*gap, PI/2, 3*PI/2);
          else rect(x+gap, y+j*s+gap, s-gap, 2*s-2*gap);
        } else {
          // right
          if (outerH == FULL_ROUND) arc(x+(nw-1)*s, y+(j+1)*s, 2*s-2*gap, 2*s-2*gap, 3*PI/2, PI/2);
          else rect(x+(nw-1)*s, y+j*s+gap, s-gap, 2*s-2*gap);
        }
        fill(backCol);
        if (a == 0) {
          // left
          if (innerH == FULL_ROUND) arc(x+s, y+(j+1)*s, 2*gap, 2*gap, PI/2, 3*PI/2);
          else {
            rect(x+s-gap, y+(j+1)*s-gap, 2*gap, 2*gap);
            if (outerH == TRIANG) {
              triangle(x+gap, y+j*s+gap, x+gap, y+j*s+s/2, x+s/2, y+j*s+gap);
              triangle(x+gap, y+(j+3/2)*s, x+gap, y+(j+2)*s-gap, x+s/2, y+(j+2)*s-gap);
            }
          }
        } else {
          // right
          if (innerH == FULL_ROUND) arc(x+(nw-1)*s, y+(j+1)*s, 2*gap, 2*gap, 3*PI/2, PI/2);
          else {
            rect(x+(nw-1)*s-gap, y+(j+1)*s-gap, 2*gap, 2*gap);
            if (outerH == TRIANG) {
              triangle(x+nw*s-gap, y+j*s+gap, x+(nw-1/2)*s, y+j*s+gap, x+nw*s-gap, y+j*s+s/2);
              triangle(x+nw*s-gap, y+(j+3/2)*s, x+nw*s-gap, y+(j+2)*s-gap, x+(nw-1/2)*s, y+(j+2)*s-gap);
            }
          }
        }
      }

      a = 1 - a;
    }
  }
}

function possibleCaps(type) {
  pos = [RECT];
  if (type == FULL_ROUND) {
    pos.push(FULL_ROUND, HALF_ROUND);
  } else {
    pos.push(TRIANG);
  }
  return pos;
}
