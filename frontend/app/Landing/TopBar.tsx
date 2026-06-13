import Image from "next/image";

export default function TopBar() {
  return (
<header className="landing-header">
  <div className="landing-header-inner">
    <a href="/" className="landing-logo" aria-label="Fire Phin home">
      <img
        src="/temp/firephin-logo-no-bg.png"
        alt="Fire Phin"
        className="landing-logo-mark"
      />
      <span className="landing-logo-text">
      <span className="landing-logo-fire">Fire</span>
      <span className="landing-logo-phin">Phin</span>
      </span>    </a>

    <a href="/visuals" className="landing-try-btn">
      Try Now
    </a>
  </div>
</header>
  );
}