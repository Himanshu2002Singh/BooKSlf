import LegalFooter from '../../components/LegalFooter.jsx';

export default function LandingFooter({ app }) {
  const isOtherUsecases = window.location.pathname === '/other-usecases' || app?.pathname === '/other-usecases';

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = id;
    }
  }

  function handleHomeClick(e) {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (app?.navigate) {
      e.preventDefault();
      app.navigate('/');
    }
  }

  function handleOtherUsecasesClick(e) {
    if (isOtherUsecases) {
      e.preventDefault();
      scrollTo('examples');
    } else if (app?.navigate) {
      e.preventDefault();
      app.navigate('/other-usecases');
    }
  }

  function handleSignInClick(e) {
    if (app?.user) {
      e.preventDefault();
      app.navigate(app.books?.length ? '/shelf' : '/themes');
    }
  }

  const destination = app?.user ? (app.books?.length ? '/shelf' : '/themes') : '/login';

  return (
    <footer className="footer-wrap">
      {/* Exact Nav Bar layout and styles */}
      <div className="nav nav--footer">
        <a className="logo" href="/" onClick={handleHomeClick}>Bookfolio.live</a>
        <nav className="nav__links" aria-label="Footer navigation">
          <a className="nav__link" href="/" onClick={handleHomeClick}>Home</a>
          <a className={`nav__link${isOtherUsecases ? ' nav__link--active' : ''}`} href="/other-usecases" onClick={handleOtherUsecasesClick}>Other Usecases</a>
          <a className="nav__link" href="mailto:amangupta.ux@gmail.com">Contact Us</a>
          <a className="nav__btn" href={destination} onClick={handleSignInClick}>Sign In</a>
        </nav>
      </div>

      {/* Extra resource links */}
      <div className="footer-extra">
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSe1eG6q1MAQKkfRvDTqkQaGRi38TCVGMxKRUdVNNO21cpc9bA/viewform?usp=dialog" target="_blank" rel="noreferrer">
          Submit Feedback
        </a>
      </div>

      {/* Legal & Credits */}
      <LegalFooter />
    </footer>
  );
}


