import TopBar from "../components/TopBar";
import LandingDashboardShowcase from "./(landing)/components/DashboardShowcase";
import Fire from "./(landing)/components/Fire"
import Footer from "../components/Footer"
export default function Home() {

  return (
    <>
      <TopBar/>
      <LandingDashboardShowcase/>
      <Fire/>
      <Footer/>
    </>
  );
}


