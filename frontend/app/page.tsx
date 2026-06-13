import Link from "next/link";
import TopBar from "./(landing)/components/TopBar";

export default function Home() {

  return (
    <>
      <TopBar/>
      <Link style={{ display: "flex", alignItems: "center", justifyContent: "center", }} href="/visuals">
        Vantage Dashboard
      </Link>   
    </>
  );
}


