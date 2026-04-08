import Link from "next/link";
// import Image from "next/image";

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Link href="/dashboard">
        Click to go to dashboard
      </Link>      
    </div>
  );
}
