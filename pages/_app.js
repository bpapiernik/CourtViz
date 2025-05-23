import NavBar from '../components/NavBar';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react'; // ✅ import this

export default function App({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
      <Analytics /> {/* ✅ include this at the bottom */}
    </>
  );
}
