import { useState } from 'react';

const TINTS = ['#f6dcc9', '#efe3c4', '#dcebd9', '#e7dcef', '#d8e6f0', '#f3d6d6'];

// A reader's Google photo, or their initials on a warm tint that stays the same for their email.
export default function Avatar({ name = '', email = '', picture, size = 36 }) {
  const [broken, setBroken] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase()).join('') || email[0]?.toUpperCase() || '?';
  const tint = TINTS[[...email].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % TINTS.length];
  return (
    <span className="ap-avatar" style={{ width: size, height: size, background: tint, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {picture && !broken ? <img src={picture} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : initials}
    </span>
  );
}
