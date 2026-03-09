import Link from "next/link";
// import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
    <Link href={{ pathname: "/test", query: { name: "John", age: 25, byeName: "Mike", byeAge: 30}}}>
      Click to go to test
    </Link>      
    </div>
  );
}
