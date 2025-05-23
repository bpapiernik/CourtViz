import NavBar from '../components/NavBar';     // ✅ new NavBar import
import '../styles/globals.css';                // ✅ keep global styles

export default function App({ Component, pageProps }) {
  return (
    <>
      <NavBar />                               {/* navbar appears on every page */}
      <Component {...pageProps} />            {/* actual page content */}
    </>
  );
}
