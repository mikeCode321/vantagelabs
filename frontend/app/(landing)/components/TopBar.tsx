import "../styles/TopBar.css";
import Image from "next/image";
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link href="/" className="landing-logo" aria-label="Fire Phin home">
          <Image src="/temp/firephin-logo-no-bg.png" alt="Fire Phin" className="landing-logo-mark" width={72}  height={72} priority/>
          <span className="landing-logo-text">
            <span className="landing-logo-fire">Fire</span>
            <span className="landing-logo-phin">Phin</span>
          </span>
        </Link>

        <Link href="/dashboard" className="landing-try-btn">
          Try Now
        </Link>
      </div>
    </header>
  );
}