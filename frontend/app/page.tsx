import Link from "next/link";
// import Image from "next/image";

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Link href="/testing">
        Click to go to testing site
      </Link>      
    </div>
  );
}
