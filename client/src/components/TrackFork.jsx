import { useLayoutEffect, useRef } from "react";

// A railway switch, seen from above. The main track runs left to right.
// At the switch, the top track goes straight on and the bottom track curves down, then runs parallel.
// When the player picks a side, the trolley drives along that track.

const MAIN_TRACK = "M0 50 L120 50";
const TOP_TRACK = "M120 50 L400 50";
const BOTTOM_TRACK = "M120 50 C165 50 175 150 220 150 L400 150";

// The full route of the trolley for each side, from where it waits to where it stops.
const ROUTES = {
  top: "M40 50 L340 50",
  bottom: "M40 50 L120 50 C165 50 175 150 220 150 L340 150",
};

const DRIVE_SECONDS = 1.1;

function prefersReducedMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  return false;
}

// The track the trolley did not take fades out.
function isFadedTrack(side, pickedSide) {
  if (pickedSide && pickedSide !== side) {
    return true;
  }
  return false;
}

// A track is drawn in three layers: wooden sleepers, a thick dark line, and a thinner
// paper-colored line on top. The dark line that shows on each side looks like two rails.
// A faded track gets light rails and pale sleepers.
const TRACK_LAYERS = [
  {
    attributes: { strokeWidth: 26, strokeDasharray: "4 9", strokeLinecap: "butt" },
    getStyle: (isFaded) => ({ stroke: "var(--color-line)", opacity: isFaded ? 0.4 : 1 }),
  },
  {
    attributes: { strokeWidth: 14, strokeLinecap: "round" },
    getStyle: (isFaded) => ({ stroke: isFaded ? "var(--color-line)" : "var(--color-ink)" }),
  },
  {
    attributes: { strokeWidth: 9, strokeLinecap: "round" },
    getStyle: () => ({ stroke: "var(--color-paper)" }),
  },
];

// Draw one layer for every track before the next layer starts.
// Then the rails join cleanly at the switch, and no track end draws over another track.
// In each layer the faded track comes first, so the chosen track stays on top where they touch.
function Tracks({ pickedSide }) {
  const tracks = [
    { path: MAIN_TRACK, isFaded: false },
    { path: TOP_TRACK, isFaded: isFadedTrack("top", pickedSide) },
    { path: BOTTOM_TRACK, isFaded: isFadedTrack("bottom", pickedSide) },
  ];
  const tracksInDrawOrder = [
    ...tracks.filter((track) => track.isFaded),
    ...tracks.filter((track) => !track.isFaded),
  ];

  return TRACK_LAYERS.map((layer, layerIndex) => (
    <g key={layerIndex} fill="none">
      {tracksInDrawOrder.map((track) => (
        <path
          key={track.path}
          d={track.path}
          className="transition-[stroke,opacity] duration-700"
          style={layer.getStyle(track.isFaded)}
          {...layer.attributes}
        />
      ))}
    </g>
  ));
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

// <animateMotion> is built into SVG. It moves its parent along a path, and rotate="auto"
// turns the trolley to follow the curve. begin="indefinite" waits until beginElement() starts it.
function DrivingTrolley({ route }) {
  const motionRef = useRef(null);

  // useLayoutEffect runs before the browser paints, so the trolley never shows at the wrong place.
  useLayoutEffect(() => {
    motionRef.current.beginElement();
  }, []);

  return (
    <g>
      <animateMotion
        ref={motionRef}
        path={route}
        dur={prefersReducedMotion() ? "0.01s" : `${DRIVE_SECONDS}s`}
        begin="indefinite"
        fill="freeze"
        rotate="auto"
        calcMode="spline"
        keyPoints="0;1"
        keyTimes="0;1"
        keySplines="0.45 0 0.55 1"
      />
      <Trolley />
    </g>
  );
}

export default function TrackFork({ pickedSide = null }) {
  return (
    <svg viewBox="0 0 400 200" className="mx-auto block h-full w-full max-w-2xl" aria-hidden="true">
      <Tracks pickedSide={pickedSide} />

      {pickedSide ? (
        <DrivingTrolley route={ROUTES[pickedSide]} />
      ) : (
        <g transform="translate(40 50)">
          <g className="trolley-wait">
            <Trolley />
          </g>
        </g>
      )}
    </svg>
  );
}
