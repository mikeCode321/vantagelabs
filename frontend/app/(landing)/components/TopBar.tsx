import "../styles/TopBar.css";
import Image from "next/image";
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link href="/" className="landing-logo" aria-label="Firephin home">
          <Image src="/temp/firephin-logo-no-bg.png" alt="Firephin" className="landing-logo-mark" width={72}  height={72} priority/>
          <span className="landing-logo-text">
            <span className="landing-logo-fire">fire</span>
            <span className="landing-logo-phin">phin</span>
          </span>
        </Link>

        <Link href="/dashboard" className="landing-try-btn">
          Try Now
        </Link>
      </div>
    </header>
  );
}