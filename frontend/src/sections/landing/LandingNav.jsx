import { useEffect, useRef, useState } from 'react';

export default function LandingNav({ app }) {
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const isOtherUsecases = window.location.pathname === '/other-usecases' || app?.pathname === '/other-usecases';

  // Close on route / navigation change
  useEffect(() => {
    setOpen(false);
  }, [app?.pathname]);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Close on window resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = id;
    }
  }

  function handleHomeClick(e) {
    setOpen(false);
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (app?.navigate) {
      e.preventDefault();
      app.navigate('/');
    }
  }

  function handleOtherUsecasesClick(e) {
    setOpen(false);
    if (isOtherUsecases) {
      e.preventDefault();
      scrollTo('examples');
    } else if (app?.navigate) {
      e.preventDefault();
      app.navigate('/other-usecases');
    }
  }

  function handleSignInClick(e) {
    setOpen(false);
    if (app?.user) {
      e.preventDefault();
      app.navigate(app.books?.length ? '/shelf' : '/themes');
    }
  }

  const destination = app?.user ? (app.books?.length ? '/shelf' : '/themes') : '/login';

  return (
    <>
      <header ref={navRef} className={`nav ${open ? 'nav--open' : ''}`}>
        <a className="logo" href="/" onClick={handleHomeClick}>Bookfolio.live</a>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className={`nav__toggle ${open ? 'nav__toggle--open' : ''}`}
          aria-expanded={open}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen(prev => !prev)}
        >
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
        </button>

        {/* Navigation Links */}
        <nav className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="Main navigation">
          <a className="nav__link" href="/" onClick={handleHomeClick}>Home</a>
          <a className={`nav__link${isOtherUsecases ? ' nav__link--active' : ''}`} href="/other-usecases" onClick={handleOtherUsecasesClick}>Other Usecases</a>
          <a className="nav__link" href="mailto:bookfoliolive@gmail.com" onClick={() => setOpen(false)}>Contact Us</a>
          <a className="nav__btn" href={destination} onClick={handleSignInClick}>
            {app?.user ? 'My Bookshelf' : 'Sign In'}
          </a>
        </nav>
      </header>

      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="nav__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
