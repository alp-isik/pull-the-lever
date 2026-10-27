import { useId, useLayoutEffect, useRef } from "react";

// A railway switch, seen from above. The main track runs left to right.
// At the switch, the top track goes straight on and the bottom track curves down, then runs parallel.
// What is at stake stands at the end of each track: people tied across the rails and a short label.
// When the player points at an option, the people on its track grow a little.
// When the player picks a side, the train (the trolley and a wagon) runs over the people on that
// track and drives off the drawing. Each person gets a blood splash and X eyes at the moment the
// trolley reaches them.

const VIEW_WIDTH = 500;
const VIEW_HEIGHT = 200;

// The switch is at x = 170. The bottom track's curve goes from there down to x = 270, y = 150.
// CURVE_POINTS are its four Bézier points: start, two control points, end.
const CURVE_POINTS = [
  { x: 170, y: 50 },
  { x: 215, y: 50 },
  { x: 225, y: 150 },
  { x: 270, y: 150 },
];
// The curve as a path command: "C" and the last three points.
const CURVE = `C${CURVE_POINTS.slice(1)
  .map((point) => `${point.x} ${point.y}`)
  .join(" ")}`;
// The wooden sleepers are a dashed line: each dash is one sleeper across the track.
const SLEEPER_DASHES = { strokeDasharray: "4 9", strokeLinecap: "butt" };

const MAIN_TRACK = "M0 50 L170 50";
const TOP_TRACK = "M170 50 L500 50";
const BOTTOM_TRACK = `M170 50 ${CURVE} L500 150`;

// The trolley waits at x = 90, with its wagon behind it, well before the switch.
// The train drives on past the people and off the right edge.
const START_X = 90;
const ROUTE_END_X = 580;
// The rest of each route, from wherever a car starts on the main track.
const ROUTE_AFTER_START = {
  top: `L${ROUTE_END_X} 50`,
  bottom: `L170 50 ${CURVE} L${ROUTE_END_X} 150`,
};

// The cars of the train, front first. backOffset: how far behind the trolley's center a car's
// center is. Each car follows the same route from further back, at the same speed, so it passes
// every point a moment after the trolley.
const TRAIN_CARS = [
  { kind: "trolley", backOffset: 0 },
  { kind: "wagon", backOffset: 45 },
];

function getRoute(side, backOffset) {
  return `M${START_X - backOffset} 50 ${ROUTE_AFTER_START[side]}`;
}

// Where each route reaches its last straight part, the one with the people on it, and how far the
// trolley has driven by then. The curve in BOTTOM_TRACK is 148 long (measured with getTotalLength()).
const STRAIGHT_PART = {
  top: { startX: START_X, distanceBefore: 0 },
  bottom: { startX: 270, distanceBefore: 170 - START_X + 148 },
};

// The train drives at one steady speed, in drawing units per second.
const TROLLEY_SPEED = 400;
// From the trolley's center to its front.
const TROLLEY_HALF_LENGTH = 23;

// The switch: a short piece of track at the fork. Before the pull it runs straight on, toward
// the top track. When the lever is pulled, it bends until it lies on the first part of the
// bottom track's curve (SWITCH_CURVE_SHARE of the curve).
const SWITCH_PIVOT = CURVE_POINTS[0];
const SWITCH_CURVE_SHARE = 0.22;
// The straight switch has about the same length as that part of the curve.
const SWITCH_STRAIGHT_LENGTH = 29;

// The first part of a curve, up to share (0 to 1) of the way, as its four Bézier points.
// This is de Casteljau's method: take the point that is share of the way along each line between
// the control points, then along the lines between those points, and so on, down to one point.
function getCurveStart(points, share) {
  const between = (a, b) => ({ x: a.x + (b.x - a.x) * share, y: a.y + (b.y - a.y) * share });
  const [p0, p1, p2, p3] = points;
  const p01 = between(p0, p1);
  const p12 = between(p1, p2);
  const p23 = between(p2, p3);
  const p012 = between(p01, p12);
  const p123 = between(p12, p23);
  return [p0, p01, p012, between(p012, p123)];
}

function toCurvePath([start, control1, control2, end]) {
  const format = (point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  return `M${format(start)} C${format(control1)} ${format(control2)} ${format(end)}`;
}

// The bent switch: the first part of the curve.
const SWITCH_BENT = toCurvePath(getCurveStart(CURVE_POINTS, SWITCH_CURVE_SHARE));
// The straight switch. It is written as a curve too, because an <animate> can
// only morph one path into another when both use the same commands.
const SWITCH_STRAIGHT = toCurvePath([
  SWITCH_PIVOT,
  { x: SWITCH_PIVOT.x + SWITCH_STRAIGHT_LENGTH / 3, y: SWITCH_PIVOT.y },
  { x: SWITCH_PIVOT.x + (SWITCH_STRAIGHT_LENGTH * 2) / 3, y: SWITCH_PIVOT.y },
  { x: SWITCH_PIVOT.x + SWITCH_STRAIGHT_LENGTH, y: SWITCH_PIVOT.y },
]);
// Red rails on the switch, drawn like the tracks: a wide line, a thinner one on top, and the
// sleepers in the middle. Both shapes start at the fork, like the tracks, so the sleepers line up.
const SWITCH_LAYERS = [
  { color: "var(--color-accent)", width: 14, dashes: "none" },
  { color: "var(--color-paper)", width: 9, dashes: "none" },
  { color: "var(--color-wood)", width: 9, dashes: SLEEPER_DASHES.strokeDasharray },
];
// The operator and the lever stand below the main track, low enough that the waiting train does
// not cover them. The operator is seen from the side, facing the lever.
// Lever angles are in degrees from straight up: it leans away from the operator before the pull,
// and toward them after it. Pulled, the knob still leaves a small gap in front of their chest.
const OPERATOR_HEAD = { x: 121, y: 86 };
const OPERATOR_SHOULDER = { x: OPERATOR_HEAD.x, y: OPERATOR_HEAD.y + 11 };
// Before the pull, the operator leans forward to reach the lever: they are turned around their
// feet by this many degrees, toward the lever. They stand up straight as they pull.
const OPERATOR_FEET = { x: OPERATOR_HEAD.x, y: OPERATOR_HEAD.y + 39 };
const OPERATOR_START_LEAN = 7;
const LEVER_PIVOT = { x: 136, y: 119 };
const LEVER_START_ANGLE = 24;
const LEVER_PULLED_ANGLE = -6;
// The operator holds the lever this far up from its pivot. The knob is at the top end.
const LEVER_HAND_HEIGHT = 17;
const LEVER_LENGTH = 23;
// The arm on the lever bends at the elbow, so it keeps its length while the lever moves.
// Together the two parts are just long enough to reach the lever before the pull.
const UPPER_ARM_LENGTH = 10;
const FOREARM_LENGTH = 10;
// When the player pulls the lever, the train waits this long, until the switch has moved.
const SWITCH_SECONDS = 0.35;

const TRACK_Y = { top: 50, bottom: 150 };
// The label goes above the top track and below the bottom track, away from the other track.
const LABEL_Y = { top: 17, bottom: 192 };
const LABEL_RIGHT_X = 492;
const FIRST_PERSON_X = 380;
const PERSON_SPACING = 26;

function prefersReducedMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  return false;
}

// How long the lever and the switch take to move, in seconds.
function getSwitchSeconds() {
  if (prefersReducedMotion()) {
    return 0.01;
  }
  return SWITCH_SECONDS;
}

// How long the train waits before it sets off, in seconds. On the bottom side the lever is
// pulled first, so the train waits for the switch.
function getStartDelaySeconds(side) {
  if (side === "bottom" && !prefersReducedMotion()) {
    return SWITCH_SECONDS;
  }
  return 0;
}

// How long one car drives on this side, in seconds, without the wait at the start.
// A car further back has a longer route, so it needs that much longer at the same speed.
function getDriveSeconds(side, backOffset) {
  if (prefersReducedMotion()) {
    return 0.01;
  }
  const { startX, distanceBefore } = STRAIGHT_PART[side];
  return (backOffset + distanceBefore + ROUTE_END_X - startX) / TROLLEY_SPEED;
}

// How long until the front of the trolley reaches a person at x, in seconds.
function getSecondsUntilHit(side, x) {
  if (prefersReducedMotion()) {
    return 0;
  }
  const { startX, distanceBefore } = STRAIGHT_PART[side];
  const driveDistance = distanceBefore + x - TROLLEY_HALF_LENGTH - startX;
  return getStartDelaySeconds(side) + driveDistance / TROLLEY_SPEED;
}

// The track the trolley did not take fades out.
function isFadedTrack(side, pickedSide) {
  if (pickedSide && pickedSide !== side) {
    return true;
  }
  return false;
}

function getSleeperStyle(isFaded) {
  return { stroke: "var(--color-wood)", opacity: isFaded ? 0.4 : 1 };
}

// A track is drawn in four layers: wide wooden sleepers, a thick dark line, a thinner
// paper-colored line on top, and the sleepers again in that paper-colored middle.
// The dark line that shows on each side looks like two rails, and the sleepers run under both.
// The second set of sleepers uses the same path and dashes, so they line up with the first.
// A faded track gets light rails and pale sleepers.
const TRACK_LAYERS = [
  {
    attributes: { strokeWidth: 26, ...SLEEPER_DASHES },
    getStyle: getSleeperStyle,
  },
  {
    attributes: { strokeWidth: 14, strokeLinecap: "round" },
    getStyle: (isFaded) => ({ stroke: isFaded ? "var(--color-line)" : "var(--color-ink)" }),
  },
  {
    attributes: { strokeWidth: 9, strokeLinecap: "round" },
    getStyle: () => ({ stroke: "var(--color-paper)" }),
  },
  {
    attributes: { strokeWidth: 9, ...SLEEPER_DASHES },
    getStyle: getSleeperStyle,
  },
];

// The faded track comes first, with all its layers. Then the other tracks draw over it where they
// touch at the switch, so the chosen track's rails have no gap.
// Within each group, one layer goes on for every track before the next layer starts. Then the rails
// join cleanly at the switch, and no track end draws over another track.
// All pieces share one parent and keep their keys, so React moves them instead of making new ones.
// That keeps the fade animation (the CSS transition) of the track that was not taken.
function Tracks({ pickedSide }) {
  const tracks = [
    { path: MAIN_TRACK, isFaded: false },
    { path: TOP_TRACK, isFaded: isFadedTrack("top", pickedSide) },
    { path: BOTTOM_TRACK, isFaded: isFadedTrack("bottom", pickedSide) },
  ];
  const groups = [
    tracks.filter((track) => track.isFaded),
    tracks.filter((track) => !track.isFaded),
  ];
  const pieces = groups.flatMap((group) =>
    TRACK_LAYERS.flatMap((layer, layerIndex) =>
      group.map((track) => ({ track, layer, layerIndex })),
    ),
  );

  return (
    <g fill="none">
      {pieces.map(({ track, layer, layerIndex }) => (
        <path
          key={`${track.path} ${layerIndex}`}
          d={track.path}
          className="transition-[stroke,opacity] duration-700"
          style={layer.getStyle(track.isFaded)}
          {...layer.attributes}
        />
      ))}
    </g>
  );
}

// The trolley faces right and is drawn around (0, 0). Its front window is on the right side.
function Trolley() {
  return (
    <>
      {/* Wheels */}
      <rect x="-15" y="-21" width="10" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="7" y="-21" width="10" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="-15" y="15" width="10" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="7" y="15" width="10" height="6" rx="2" fill="var(--color-ink)" />
      {/* Body and front window */}
      <rect
        x="-23"
        y="-16"
        width="46"
        height="32"
        rx="7"
        fill="var(--color-accent)"
        stroke="var(--color-ink)"
        strokeWidth="3"
      />
      <rect
        x="7"
        y="-10"
        width="10"
        height="20"
        rx="3"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
    </>
  );
}

// A wagon behind the trolley, facing right and drawn around (0, 0). It is a little shorter than
// the trolley, with a roof panel instead of a window. The coupler on its front joins it to the
// car in front.
function Wagon() {
  return (
    <>
      {/* Wheels */}
      <rect x="-13" y="-20" width="9" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="4" y="-20" width="9" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="-13" y="14" width="9" height="6" rx="2" fill="var(--color-ink)" />
      <rect x="4" y="14" width="9" height="6" rx="2" fill="var(--color-ink)" />
      {/* Coupler */}
      <rect x="17" y="-2" width="7" height="4" fill="var(--color-ink)" />
      {/* Body and roof panel */}
      <rect
        x="-18"
        y="-15"
        width="36"
        height="30"
        rx="6"
        fill="var(--color-accent)"
        stroke="var(--color-ink)"
        strokeWidth="3"
      />
      <rect
        x="-11"
        y="-8"
        width="22"
        height="16"
        rx="3"
        fill="none"
        stroke="var(--color-ink)"
        strokeOpacity="0.4"
        strokeWidth="2"
      />
    </>
  );
}

// One car of the train: the trolley or a wagon.
function TrainCar({ kind }) {
  if (kind === "trolley") {
    return <Trolley />;
  }
  return <Wagon />;
}

// The people use fixed colors (--color-figure-*), so they look the same in light and dark mode.
const LIMB = { stroke: "var(--color-figure-line)", strokeLinecap: "round" };
// The dashes make the rope look twisted.
const ROPE = {
  stroke: "var(--color-rope)",
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeDasharray: "3 1.2",
};
const SKIN = { fill: "var(--color-figure-fill)", stroke: "var(--color-figure-line)" };

// One person tied across the rails, seen from above, drawn around (0, 0).
// The head is above the track, the feet below it. One rope goes around the chest and arms,
// one around the ankles.
// filter adds a thin light border around the person, like a sticker, so the dark outline stays
// visible on the dark background too.
function Person({ filter }) {
  return (
    <g className="person" filter={filter}>
      {/* Legs */}
      <line x1="-3" y1="7" x2="-4" y2="19" strokeWidth="4" {...LIMB} />
      <line x1="3" y1="7" x2="4" y2="19" strokeWidth="4" {...LIMB} />
      {/* Arms and hands */}
      <line x1="-6.5" y1="-8" x2="-9" y2="5" strokeWidth="3.5" {...LIMB} />
      <line x1="6.5" y1="-8" x2="9" y2="5" strokeWidth="3.5" {...LIMB} />
      <circle cx="-9" cy="6.5" r="2.4" strokeWidth="1.8" {...SKIN} />
      <circle cx="9" cy="6.5" r="2.4" strokeWidth="1.8" {...SKIN} />
      {/* Body */}
      <rect x="-7" y="-11" width="14" height="19" rx="5" strokeWidth="2" {...SKIN} />
      {/* Head: two eyes and a small, scared mouth */}
      <circle cy="-18" r="7" strokeWidth="2" {...SKIN} />
      <circle cx="-2.6" cy="-19" r="1.2" fill="var(--color-figure-line)" />
      <circle cx="2.6" cy="-19" r="1.2" fill="var(--color-figure-line)" />
      <ellipse cy="-14.6" rx="1.6" ry="1.2" fill="var(--color-figure-line)" />
      {/* Ropes */}
      <line x1="-11" y1="-2" x2="11" y2="-2" {...ROPE} />
      <line x1="-6.5" y1="15" x2="6.5" y2="15" {...ROPE} />
    </g>
  );
}

// The head of a person who was run over, with crosses for eyes and a flat mouth.
// It goes on top of the blood splash, so the head sticks out of it.
// The class "dead-head" in index.css shows it after delaySeconds, when the trolley hits.
function DeadHead({ filter, delaySeconds }) {
  return (
    <g className="dead-head" style={{ animationDelay: `${delaySeconds}s` }} filter={filter}>
      <circle cy="-18" r="7" strokeWidth="2" {...SKIN} />
      <path
        d="M-4.1 -20.4 L-1.3 -17.6 M-1.3 -20.4 L-4.1 -17.6 M1.3 -20.4 L4.1 -17.6 M4.1 -20.4 L1.3 -17.6"
        strokeWidth="1.5"
        {...LIMB}
      />
      <line x1="-2" y1="-14.2" x2="2" y2="-14.2" strokeWidth="1.5" {...LIMB} />
    </g>
  );
}

// A blood splash is a cartoon splat, drawn around (0, 0): a round middle, arms that end in round
// blobs, and drops that fly off. Each person gets a different splat, made from a seed number.

const SPLAT_MIDDLE_RADIUS = 9;
const SPLAT_ARMS = 7;
const SPLAT_DROPS = 4;
// How much wider the dark outline layer is than the sauce on top of it.
const SPLAT_OUTLINE_WIDTH = 2.6;
const SIDE_SEED_OFFSET = { top: 0, bottom: 10 };

// A small random number generator with a seed. The same seed always gives the same numbers,
// so a splat keeps its shape every time React draws it again.
function makeRandom(seed) {
  let state = (seed * 48271) % 2147483647;
  return function random() {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

function randomBetween(random, min, max) {
  return min + random() * (max - min);
}

function makeSplat(seed) {
  const random = makeRandom(seed);

  // The arms go around the middle at even steps, each pushed a little to the side.
  const arms = [];
  for (let index = 0; index < SPLAT_ARMS; index += 1) {
    const angle = ((index + randomBetween(random, -0.3, 0.3)) / SPLAT_ARMS) * 2 * Math.PI;
    const length = randomBetween(random, 9, 15);
    arms.push({
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
      width: randomBetween(random, 3.5, 5.5),
      blobRadius: randomBetween(random, 2.5, 4),
    });
  }

  const drops = [];
  for (let index = 0; index < SPLAT_DROPS; index += 1) {
    const angle = random() * 2 * Math.PI;
    const distance = randomBetween(random, 18, 23);
    drops.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      radius: randomBetween(random, 1.3, 2.4),
    });
  }

  return { arms, drops };
}

// The shapes of one splat in one color. extraWidth makes every shape that much wider, so a dark
// layer with extraWidth under a red layer without it shows as an outline around the whole splat.
// In index.css, "splash-drop" makes each drop fly out from the middle. --from-x and --from-y tell
// a drop where its flight starts.
function SplatLayer({ arms, drops, color, extraWidth, delay }) {
  return (
    <g fill={color} stroke={color} strokeWidth={extraWidth}>
      <circle r={SPLAT_MIDDLE_RADIUS} />
      {arms.map((arm, index) => (
        <g key={index}>
          <line x2={arm.x} y2={arm.y} strokeWidth={arm.width + extraWidth} strokeLinecap="round" />
          <circle cx={arm.x} cy={arm.y} r={arm.blobRadius} />
        </g>
      ))}
      {drops.map((drop, index) => (
        <circle
          key={index}
          className="splash-drop"
          cx={drop.x}
          cy={drop.y}
          r={drop.radius}
          style={{ ...delay, "--from-x": `${-drop.x * 0.8}px`, "--from-y": `${-drop.y * 0.8}px` }}
        />
      ))}
    </g>
  );
}

// A blood splash over a person who was run over: a dark red outline layer, the red blood on
// top, and a shine. In index.css, "splash" makes it pop in after delaySeconds.
function Splash({ seed, delaySeconds }) {
  const { arms, drops } = makeSplat(seed);
  const delay = { animationDelay: `${delaySeconds}s` };

  return (
    <g className="splash" style={delay}>
      <SplatLayer
        arms={arms}
        drops={drops}
        color="var(--color-blood-dark)"
        extraWidth={SPLAT_OUTLINE_WIDTH}
        delay={delay}
      />
      <SplatLayer
        arms={arms}
        drops={drops}
        color="var(--color-blood)"
        extraWidth={0}
        delay={delay}
      />
      {/* Shine: a light spot on the middle and on the first blob makes the blood look wet. */}
      <ellipse
        cx="-3.5"
        cy="-4"
        rx="4"
        ry="2.2"
        transform="rotate(-30 -3.5 -4)"
        fill="var(--color-blood-shine)"
      />
      <circle cx={arms[0].x - 1} cy={arms[0].y - 1} r="1.2" fill="var(--color-blood-shine)" />
    </g>
  );
}

// What stands on one track: up to 5 people and a short label.
// "people-at-risk" (index.css): the player points at this track's option, so the people grow.
// When the trolley takes this track, each person fades under a splash when the trolley reaches
// them. The label stays, so the player can still read who was hit.
// stickerFilter: the sticker border filter from TrackFork, for the people.
function Stake({ side, stake, isHit, isAtRisk, stickerFilter }) {
  const people = Array.from({ length: stake.people }, (_, index) => index);

  return (
    <>
      <g className={isAtRisk ? "people-at-risk" : ""}>
        {people.map((index) => {
          const x = FIRST_PERSON_X + index * PERSON_SPACING;
          const secondsUntilHit = getSecondsUntilHit(side, x);
          return (
            <g key={index} transform={`translate(${x} ${TRACK_Y[side]})`}>
              <g
                className={isHit ? "person-hit" : ""}
                style={isHit ? { transitionDelay: `${secondsUntilHit}s` } : undefined}
              >
                <Person filter={stickerFilter} />
              </g>
              {/* The seed differs for each person and each track, so no two splats match. */}
              {isHit && (
                <>
                  <Splash
                    seed={index + 1 + SIDE_SEED_OFFSET[side]}
                    delaySeconds={secondsUntilHit}
                  />
                  <DeadHead filter={stickerFilter} delaySeconds={secondsUntilHit} />
                </>
              )}
            </g>
          );
        })}
      </g>
      {stake.label && (
        <text
          x={LABEL_RIGHT_X}
          y={LABEL_Y[side]}
          textAnchor="end"
          fontSize="17"
          fontWeight="700"
          fill="var(--color-ink)"
        >
          {stake.label}
        </text>
      )}
    </>
  );
}

// The timing of one car's drive for <animateMotion>. The car stays at the start of its route
// (keyPoints 0) for the start delay, then drives to the end (keyPoints 1) at one steady speed.
// keyTimes says when each key point is reached, as a share of the whole time.
function getMotionTiming(side, backOffset) {
  const delaySeconds = getStartDelaySeconds(side);
  const totalSeconds = delaySeconds + getDriveSeconds(side, backOffset);
  if (delaySeconds === 0) {
    return { dur: `${totalSeconds}s`, keyPoints: "0;1", keyTimes: "0;1" };
  }
  const delayShare = delaySeconds / totalSeconds;
  return { dur: `${totalSeconds}s`, keyPoints: "0;0;1", keyTimes: `0;${delayShare};1` };
}

// <animateMotion> is built into SVG. It moves its parent along a path, and rotate="auto"
// turns the car to follow the curve. begin="indefinite" waits until beginElement() starts it.
// calcMode="linear" moves the car at one steady speed between the key points, so the splash
// times from getSecondsUntilHit() match where the trolley is.
function DrivingCar({ side, car }) {
  const motionRef = useRef(null);

  // useLayoutEffect runs before the browser paints, so the car never shows at the wrong place.
  // All cars start in the same render, so they start moving together.
  useLayoutEffect(() => {
    motionRef.current.beginElement();
  }, []);

  return (
    <g>
      <animateMotion
        ref={motionRef}
        path={getRoute(side, car.backOffset)}
        begin="indefinite"
        fill="freeze"
        rotate="auto"
        calcMode="linear"
        {...getMotionTiming(side, car.backOffset)}
      />
      <TrainCar kind={car.kind} />
    </g>
  );
}

// A point on the lever, distance up from its pivot, when the lever leans at angleDegrees.
function getLeverPoint(distance, angleDegrees) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: LEVER_PIVOT.x + Math.sin(angle) * distance,
    y: LEVER_PIVOT.y - Math.cos(angle) * distance,
  };
}

// How far the pull has gone (0 to 1) at a few steps from start to end.
function getPullShares() {
  const steps = 6;
  const shares = [];
  for (let step = 0; step <= steps; step += 1) {
    shares.push(step / steps);
  }
  return shares;
}

// Where the operator's hand is when the pull has gone share (0 to 1) of the way.
function getHandPoint(share) {
  const angle = LEVER_START_ANGLE + (LEVER_PULLED_ANGLE - LEVER_START_ANGLE) * share;
  return getLeverPoint(LEVER_HAND_HEIGHT, angle);
}

// point turned around center by angleDegrees, the same way as SVG's rotate(): a positive angle
// turns clockwise on the screen.
function rotatePoint(point, center, angleDegrees) {
  const angle = (angleDegrees * Math.PI) / 180;
  const fromCenter = { x: point.x - center.x, y: point.y - center.y };
  return {
    x: center.x + fromCenter.x * Math.cos(angle) - fromCenter.y * Math.sin(angle),
    y: center.y + fromCenter.x * Math.sin(angle) + fromCenter.y * Math.cos(angle),
  };
}

// How far the operator leans forward when the pull has gone share (0 to 1) of the way.
function getLean(share) {
  return OPERATOR_START_LEAN * (1 - share);
}

// Where the operator's shoulder is when the pull has gone share (0 to 1) of the way.
// It moves with the lean.
function getShoulderPoint(share) {
  return rotatePoint(OPERATOR_SHOULDER, OPERATOR_FEET, getLean(share));
}

// The elbow, for the shoulder and the hand. The elbow is where a circle around the shoulder (as
// wide as the upper arm) meets a circle around the hand (as wide as the forearm). Of the two
// points where they meet, this takes the one behind the line from the shoulder to the hand, so
// the elbow points back, as in a real pull.
function getElbowPoint(shoulder, hand) {
  const toHand = { x: hand.x - shoulder.x, y: hand.y - shoulder.y };
  const handDistance = Math.hypot(toHand.x, toHand.y);
  const direction = { x: toHand.x / handDistance, y: toHand.y / handDistance };
  // How far the elbow is along the line from the shoulder to the hand, and how far out from it.
  const along =
    (UPPER_ARM_LENGTH ** 2 - FOREARM_LENGTH ** 2 + handDistance ** 2) / (2 * handDistance);
  const out = Math.sqrt(UPPER_ARM_LENGTH ** 2 - along ** 2);
  // (-direction.y, direction.x) is the direction turned a quarter turn, back from the line.
  return {
    x: shoulder.x + direction.x * along - direction.y * out,
    y: shoulder.y + direction.y * along + direction.x * out,
  };
}

// The arm as the "points" of a <polyline>: shoulder, elbow, hand, when the pull has gone share
// (0 to 1) of the way.
function getArmPoints(share) {
  const shoulder = getShoulderPoint(share);
  const hand = getHandPoint(share);
  return [shoulder, getElbowPoint(shoulder, hand), hand]
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

// The "values" list of an <animate> for the hand during the pull, so it stays on the lever.
function getHandPathValues(coordinate) {
  return getPullShares()
    .map((share) => getHandPoint(share)[coordinate].toFixed(1))
    .join(";");
}

// The "values" list of an <animate> for the arm's points during the pull.
function getArmPathValues() {
  return getPullShares().map(getArmPoints).join(";");
}

// A railway worker in a red cap, standing next to the lever, drawn where they stand.
// They are seen from the side, facing right, toward the lever: one eye, a narrow body, and the
// cap's brim in front. The other arm is hidden behind the body.
// The arm that holds the lever is in SwitchAndLever, because it moves with the lever.
// The operator is drawn around the center of their head, and OPERATOR_HEAD places them.
function Operator({ stickerFilter }) {
  return (
    <g transform={`translate(${OPERATOR_HEAD.x} ${OPERATOR_HEAD.y})`} filter={stickerFilter}>
      {/* Legs, one a little in front of the other */}
      <line x1="-1" y1="26" x2="-4" y2="39" strokeWidth="4" {...LIMB} />
      <line x1="1.5" y1="26" x2="4" y2="39" strokeWidth="4" {...LIMB} />
      {/* Body and head, with one eye and the mouth on the side that faces the lever */}
      <rect x="-5.5" y="8" width="11" height="19" rx="5" strokeWidth="2" {...SKIN} />
      <circle r="7" strokeWidth="2" {...SKIN} />
      <circle cx="3.3" cy="0.5" r="1.2" fill="var(--color-figure-line)" />
      <line x1="3" y1="4" x2="5" y2="4" strokeWidth="1.3" {...LIMB} />
      {/* Cap */}
      <path
        d="M-7 -2 A7 7 0 0 1 7 -2 Z"
        fill="var(--color-accent)"
        stroke="var(--color-figure-line)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="5" y1="-2" x2="11" y2="-2" strokeWidth="2" {...LIMB} />
    </g>
  );
}

// The switch blade, the lever with its rod, and the operator's arm.
// When isPulled turns true, every <animate> and <animateTransform> in here starts together:
// the lever turns toward the operator, the operator stands up straight, the arm follows the
// lever, and the switch blade turns down.
// "fill=freeze" keeps them in the pulled position afterwards.
function SwitchAndLever({ isPulled, stickerFilter }) {
  const groupRef = useRef(null);

  useLayoutEffect(() => {
    if (!isPulled) {
      return;
    }
    const animations = groupRef.current.querySelectorAll("animate, animateTransform");
    animations.forEach((animation) => animation.beginElement());
  }, [isPulled]);

  const timing = { dur: `${getSwitchSeconds()}s`, begin: "indefinite", fill: "freeze" };
  const handStart = getHandPoint(0);

  return (
    <g ref={groupRef}>
      {/* Switch: a piece of track with red rails that bends from straight into the curve.
          Like the tracks, it is a wide red line with a thinner paper-colored line on top. */}
      {SWITCH_LAYERS.map((layer) => (
        <path
          key={layer.color}
          d={SWITCH_STRAIGHT}
          fill="none"
          stroke={layer.color}
          strokeWidth={layer.width}
          strokeDasharray={layer.dashes}
          strokeLinecap="butt"
        >
          <animate attributeName="d" from={SWITCH_STRAIGHT} to={SWITCH_BENT} {...timing} />
        </path>
      ))}
      <circle cx={SWITCH_PIVOT.x} cy={SWITCH_PIVOT.y} r="3" fill="var(--color-ink)" />

      {/* Rod from the lever to the switch */}
      <line
        x1={LEVER_PIVOT.x + 4}
        y1={LEVER_PIVOT.y}
        x2={SWITCH_PIVOT.x + 2}
        y2={SWITCH_PIVOT.y + 14}
        stroke="var(--color-muted)"
        strokeWidth="1.5"
      />

      {/* The operator leans forward to reach the lever, and stands up straight as they pull */}
      <g transform={`rotate(${getLean(0)} ${OPERATOR_FEET.x} ${OPERATOR_FEET.y})`}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`${getLean(0)} ${OPERATOR_FEET.x} ${OPERATOR_FEET.y}`}
          to={`${getLean(1)} ${OPERATOR_FEET.x} ${OPERATOR_FEET.y}`}
          {...timing}
        />
        <Operator stickerFilter={stickerFilter} />
      </g>

      {/* Lever: a stick with a red knob, turning around its pivot */}
      <rect
        x={LEVER_PIVOT.x - 7}
        y={LEVER_PIVOT.y - 3}
        width="14"
        height="6"
        rx="2"
        fill="var(--color-ink)"
      />
      <g transform={`rotate(${LEVER_START_ANGLE} ${LEVER_PIVOT.x} ${LEVER_PIVOT.y})`}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`${LEVER_START_ANGLE} ${LEVER_PIVOT.x} ${LEVER_PIVOT.y}`}
          to={`${LEVER_PULLED_ANGLE} ${LEVER_PIVOT.x} ${LEVER_PIVOT.y}`}
          {...timing}
        />
        <line
          x1={LEVER_PIVOT.x}
          y1={LEVER_PIVOT.y}
          x2={LEVER_PIVOT.x}
          y2={LEVER_PIVOT.y - LEVER_LENGTH}
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx={LEVER_PIVOT.x}
          cy={LEVER_PIVOT.y - LEVER_LENGTH}
          r="3.6"
          fill="var(--color-accent)"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
        />
      </g>

      {/* The operator's arm and hand on the lever */}
      <g filter={stickerFilter}>
        <polyline
          points={getArmPoints(0)}
          fill="none"
          strokeWidth="3.5"
          strokeLinejoin="round"
          {...LIMB}
        >
          <animate attributeName="points" values={getArmPathValues()} {...timing} />
        </polyline>
        <circle cx={handStart.x} cy={handStart.y} r="2.4" strokeWidth="1.8" {...SKIN}>
          <animate attributeName="cx" values={getHandPathValues("x")} {...timing} />
          <animate attributeName="cy" values={getHandPathValues("y")} {...timing} />
        </circle>
      </g>
    </g>
  );
}

// The cars are drawn back to front, so the trolley stays on top where they touch.
const TRAIN_CARS_BACK_TO_FRONT = [...TRAIN_CARS].reverse();

function DrivingTrain({ side }) {
  return TRAIN_CARS_BACK_TO_FRONT.map((car) => (
    <DrivingCar key={car.backOffset} side={side} car={car} />
  ));
}

// The train before the vote. "trolley-wait" (index.css) rocks it a little forward and back.
function WaitingTrain() {
  return (
    <g className="trolley-wait">
      {TRAIN_CARS_BACK_TO_FRONT.map((car) => (
        <g key={car.backOffset} transform={`translate(${START_X - car.backOffset} 50)`}>
          <TrainCar kind={car.kind} />
        </g>
      ))}
    </g>
  );
}

// stakes: what stands on each track, as { top: { label, people }, bottom: { label, people } }.
// Without stakes, both tracks are empty.
// atRiskSide: the side the player points at before the vote, or null.
export default function TrackFork({ pickedSide = null, stakes = null, atRiskSide = null }) {
  // The clip path hides everything outside the drawing, so the train really drives off it.
  // The drawing can be narrower than the space around it, and without the clip that space shows.
  // useId gives an ID that no other element on the page has.
  const baseId = useId();
  const clipId = `${baseId}-clip`;
  const stickerId = `${baseId}-sticker`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="mx-auto block h-full w-full max-w-3xl"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} />
        </clipPath>
        {/* The sticker border: grow the shape's outline a little (dilate), fill that grown
            shape with the light figure color, and draw the person on top of it. */}
        <filter id={stickerId}>
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.3" result="grown" />
          <feFlood floodColor="var(--color-figure-fill)" />
          <feComposite in2="grown" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <Drawing
          pickedSide={pickedSide}
          stakes={stakes}
          atRiskSide={atRiskSide}
          stickerFilter={`url(#${stickerId})`}
        />
      </g>
    </svg>
  );
}

function Drawing({ pickedSide, stakes, atRiskSide, stickerFilter }) {
  return (
    <>
      <Tracks pickedSide={pickedSide} />

      {/* key: if a vote fails, the pick goes back to null. A new key then draws the lever and
          the switch fresh in their start position. */}
      <SwitchAndLever
        key={pickedSide === "bottom" ? "pulled" : "waiting"}
        isPulled={pickedSide === "bottom"}
        stickerFilter={stickerFilter}
      />

      {stakes && (
        <>
          <Stake
            side="top"
            stake={stakes.top}
            isHit={pickedSide === "top"}
            isAtRisk={atRiskSide === "top"}
            stickerFilter={stickerFilter}
          />
          <Stake
            side="bottom"
            stake={stakes.bottom}
            isHit={pickedSide === "bottom"}
            isAtRisk={atRiskSide === "bottom"}
            stickerFilter={stickerFilter}
          />
        </>
      )}

      {pickedSide ? <DrivingTrain side={pickedSide} /> : <WaitingTrain />}
    </>
  );
}
