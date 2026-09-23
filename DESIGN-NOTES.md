# A Beautiful Beginning — scrolling invitation film

## Reference choreography

The supplied 40.921-second video was studied as an animation sequence. The rebuilt web application follows its principal order and layered movement:

1. Names in open sky; a temple rises and scales from below.
2. An ornate gateway travels into view around the invitation.
3. Framed celebration cards move horizontally.
4. Temple scenery fills the viewport while the illustrated couple rises.
5. A plum and gold arch introduces a moving framed portrait and temple foreground.
6. Venue information appears within the continuing architectural world.
7. The family invitation gives way to a countdown.
8. Scattered photographs gather and travel out of view.
9. Terracotta hills, foliage and a temple rise into the ending.

This is a new authored timeline based on the visible reference, not the reference's original source code or a claim of frame-identical reproduction. The reference recording contains physical scrolling pauses; user-driven speed will naturally vary.

## Original artwork and identity

Five original image-generated RGBA illustrations: tall Chola-inspired temple, jasmine-and-mango-leaf gateway, bride and groom cutout, plum scalloped arch, and layered ending landscape. Compressed WebP files preserve alpha for independent composition and animation. Four original wedding photographs from the earlier concept are retained only as images within the film.

Warm ivory, antique gold, muted jade, plum and terracotta replace the reference's bright visual treatment. Cormorant Garamond and Jost are self-hosted. All names, copy and venues are original demonstration content.

## Implementation

One fixed viewport stage and a native scroll track. Normalized scroll position drives independent layer transforms and section travel in one requestAnimationFrame loop, with exponential smoothing and smoothstep easing. Scroll updates are applied directly to active layers, without triggering React renders. Assets decode before the entrance veil fades. Offscreen scenes and inactive cards cannot receive keyboard focus. Mobile uses its own framing and portrait-oriented event cards.

The invitation advances exclusively through normal scrolling. Video-style controls and all automatic playback logic have been removed. Browser keyboard scrolling is unmodified.

## Content

Sample Ananya and Karthik celebration: Mehendi and Sangeet on 19 February 2027; wedding and reception on 20 February 2027. Calendar download contains all four events. Replace demonstration details before sending this as a real invitation.

## Smooth scrolling and opening atmosphere

The revised renderer caches styles and accessibility changes, avoids inherited CSS writes during animation, and updates only visible or approaching scene layers. Native wheel input is interpolated with a 190 ms response and native touch with 80 ms. Idle animation frames stop; CSS butterflies and clouds animate on the compositor and pause when the opening is offscreen. Separate ambient loops rest during scrolling while their parent follows the scrolling scene, giving the cinematic movement rendering priority. The floating monogram uses a solid translucent surface to avoid expensive backdrop resampling.

The two new transparent assets match the existing ivory, gold and jade palette. Clouds use slow drift and shallow pointer parallax. Four miniature butterflies use two masked image halves for wingbeats, separate flight paths and light pointer depth. No new navigation, content sections, or event details were introduced.
