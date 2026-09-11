'use strict';

const bindPasswordHoldReveal = (input, button) => {
  const conceal = () => {
    input.type = 'password';
    button.setAttribute('aria-pressed', 'false');
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    input.type = 'text';
    button.setAttribute('aria-pressed', 'true');
    if (button.setPointerCapture && event.pointerId != null) button.setPointerCapture(event.pointerId);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture', 'blur'].forEach((name) => button.addEventListener(name, conceal));
  button.addEventListener('click', (event) => event.preventDefault());
};

if (typeof window !== 'undefined') window.NeutralPasswordHoldReveal = { bind: bindPasswordHoldReveal };
if (typeof module !== 'undefined' && module.exports) module.exports = { bindPasswordHoldReveal };
