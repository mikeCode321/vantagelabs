import Link from "next/link";
// import Image from "next/image";
// import About from "./about/page";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
    <Link href={{ pathname: "/about", query: { name: "John", age: 25, byeName: "Mike", byeAge: 30}}}>
      Click to go to about
    </Link>      
    </div>
  );
}
