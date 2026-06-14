import Image from "next/image";

type LandingFloatingImageProps = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
};

export default function LandingFloatingImage({
  src,
  alt,
  className = "",
  width,
  height,
}: LandingFloatingImageProps) {
  return (
    <div className={`landing-floating-image ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="landing-floating-image-img"
      />
    </div>
  );
}