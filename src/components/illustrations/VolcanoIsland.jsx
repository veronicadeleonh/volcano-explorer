// Volcano island seen through binoculars, night palette.
// Source SVG: src/assets/illustrations/1714680108island-seen-through-the-binoculars.svg (public domain, CC0, via freesvg.org).
// Converted to a component so every colour comes from the design tokens
// (see illustrations.css). Decorative only: wrap it in <SceneFrame> or aria-hidden.
export default function VolcanoIsland({ viewBox = '0 190 880 440' }) {
  return (
    <svg className="ill" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="vi-clipPath21" clipPathUnits="userSpaceOnUse">
          <path d="M 0,660 H 660 V 0 H 0 Z" />
        </clipPath>
      </defs>
      <g>
        <g>
          <path className="ill-sky" fillRule="nonzero" d="M 0,0 H 660 V 660 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sea" fillRule="nonzero" d="M 0,0 H 660 V 264.208 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sky-band" fillRule="nonzero" d="m 0,292.708 h 660 v 1.672 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sky-band" fillRule="nonzero" d="m 0,306.084 h 660 v 1.672 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sky-band" fillRule="nonzero" d="m 0,349.001 h 660 v 3.764 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sky-band" fillRule="nonzero" d="m 0,445.984 h 660 v 27.31 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sky-band" fillRule="nonzero" d="m 0,390.523 h 660 v 12.263 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-rock" fillRule="evenodd" d="m 0,0 64.096,35.093 31.132,48.618 31.133,27.782 15.872,3.29 21.975,-3.656 20.755,1.462 31.132,-27.416 13.431,-34.361 65.904,-53.93 z" transform="matrix(1.3333333,0,0,-1.3333333,230.2376,498.59893)" />
          <path className="ill-rock-light" fillRule="evenodd" d="M 0,0 -2.745,-12.063 4.58,-26.502 -8.239,-40.393 3.358,-65.616 l 15.872,-6.031 2.443,-13.709 22.891,-17.181 92.719,-2.341 -49.99,40.907 L 73.862,-29.609 42.73,-2.194 21.976,-3.655 Z" transform="matrix(1.3333333,0,0,-1.3333333,419.88147,345.55533)" />
          <path className="ill-sand" fillRule="evenodd" d="M 0,0 40.13,17.906 371.767,21.251 468.193,0 Z" transform="matrix(1.3333333,0,0,-1.3333333,133.65427,527.72267)" />
          <path className="ill-rock-deep" fillRule="evenodd" d="m 0,0 -27.126,-30.709 -30.933,-51.278 -37.345,-26.475 -20.858,2.498 53.997,29.564 31.133,48.618 z m 17.781,-101.448 -11.148,8.468 1.951,17 -15.048,14.491 6.687,17.28 -19.228,-18.115 -6.411,-17.558 -25.638,-7.245 -12.918,-13.7 29.639,-19.464 z" transform="matrix(1.3333333,0,0,-1.3333333,398.7188,349.94147)" />
          <path className="ill-rock" fillRule="evenodd" d="m 0,0 -13.125,25.439 -20.065,12.262 -0.28,20.066 -8.081,17.557 17,-17.279 4.46,-15.606 20.622,-6.131 42.073,-39.857 z" transform="matrix(1.3333333,0,0,-1.3333333,511.9596,479.79813)" />
          <path className="ill-green" fillRule="evenodd" d="m 0,0 20.273,12.634 85.556,10.591 h 1.116 L 199.19,22.109 241.55,38.83 333.796,24.896 391.079,2.458 344.107,8.175 280.009,3.158 271.926,6.781 172.158,-2.973 165.469,4.552 151.535,-2.136 120.877,3.995 84.371,-1.3 56.781,4.552 Z" transform="matrix(1.3333333,0,0,-1.3333333,162.7324,514.74867)" />
          <path className="ill-green-light" fillRule="evenodd" d="m 0,0 -60.699,14.349 -84.163,10.869 -28.139,-18.351 -108.976,13.056 92.246,-1.115 42.36,16.72 92.246,-13.933 z" transform="matrix(1.3333333,0,0,-1.3333333,681.29427,510.3464)" />
          <path className="ill-rock-warm" fillRule="evenodd" d="m 0,0 -19.376,32.481 -28.426,25.082 -17.515,2.752 20.755,1.462 31.131,-27.416 z" transform="matrix(1.3333333,0,0,-1.3333333,536.27213,430.8496)" />
          <path className="ill-sea-light" fillRule="nonzero" d="m 0,238.917 h 660 v 25.291 H 0 Z" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" />
          <path className="ill-sea-mid" fillRule="evenodd" d="m 0,0 53.997,-16.81 31.133,-27.641 31.132,-15.796 15.872,-1.873 21.976,2.08 20.755,-0.831 31.131,15.587 13.431,19.537 44.849,20.867 8.793,0.755 57.28,12.758 55.308,6.93 H -82.536 l 21.81,-5.535 20.271,-7.181 z" transform="matrix(1.3333333,0,0,-1.3333333,243.70253,548.47267)" />
          <path className="ill-sea" fillRule="evenodd" d="m 0,0 h 468.193 l -55.308,-6.93 -57.28,-12.758 -8.793,-0.754 -10.418,-4.849 H 113.783 l -31.247,9.728 -40.454,2.847 -20.271,7.182 z" transform="matrix(1.3333333,0,0,-1.3333333,133.65427,527.72267)" />
          <path className="ill-surround" fillRule="evenodd" d="M -0.601,-0.601 H 660 v 660.6 H -0.601 Z m 190.189,504.182 c 74.937,0 111.366,-31.573 140.112,-78.844 28.747,47.271 65.175,78.844 140.11,78.844 74.935,0 163.867,-73.367 163.867,-163.868 0,-90.501 -88.932,-163.866 -163.867,-163.866 -74.935,0 -111.363,31.571 -140.11,78.842 -28.746,-47.271 -65.175,-78.842 -140.112,-78.842 -74.934,0 -163.865,73.365 -163.865,163.866 0,90.501 88.931,163.868 163.865,163.868" transform="matrix(1.3333333,0,0,-1.3333333,0,880)" clipPath="url(#vi-clipPath21)" />
        </g>
      </g>
    </svg>
  )
}
