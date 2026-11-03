import { useState } from 'react';
import usePageTitle from '../app/usePageTitle.js';
import LandingNav from '../sections/landing/LandingNav.jsx';
import LandingFooter from '../sections/landing/LandingFooter.jsx';
import CtaSection from '../sections/landing/CtaSection.jsx';
import { api } from '../lib/api.js';
import { art } from '../sections/landing/content.jsx';
import '../styles/figma-landing.css';
import '../styles/other-usecases.css';

/* ----------------- MAIN PAGE COMPONENT ----------------- */

export default function OtherUsecasesPage({ app }) {
  usePageTitle('Other Usecases · Bookfolio.live');

  const [idea, setIdea] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  function scrollToExamples(e) {
    e.preventDefault();
    document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleIdeaSubmit(e) {
    e.preventDefault();
    if (!idea.trim()) {
      setErrorMsg('Please tell us what kind of shelf you would like to create.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email so we can get in touch.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    try {
      await api('/messages', {
        method: 'POST',
        body: {
          kind: 'usecase',
          text: idea.trim(),
          email: email.trim(),
        },
      });
      setStatus('sent');
      setIdea('');
      setEmail('');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="fg-landing uc-page">
      <LandingNav app={app} />

      <main>
        {/* HERO SECTION */}
        <section className="uc-hero">
          <div className="uc-hero__decor" aria-hidden="true">
            {/* Top Left Yellow Book */}
            <img
              src={art('30f91.svg')}
              alt=""
              className="uc-hero__decor-item uc-hero__decor-top-left"
            />
            {/* Top Right Cyan Open Book */}
            <img
              src={art('a7d82.svg')}
              alt=""
              className="uc-hero__decor-item uc-hero__decor-top-right"
            />
            {/* Bottom Left Book */}
            <img
              src={art('954b2.svg')}
              alt=""
              className="uc-hero__decor-item uc-hero__decor-bottom-left"
            />
            {/* Bottom Right Book */}
            <img
              src={art('63ee2.svg')}
              alt=""
              className="uc-hero__decor-item uc-hero__decor-bottom-right"
            />
          </div>

          <div className="uc-hero__content">
            <h1 className="uc-hero__title">
              Not just for books.
              <span>Shelf what you love.</span>
            </h1>
            <p className="uc-hero__subtitle">
              Your taste is bigger than a reading list. Turn the music, movies, games, podcasts, and ideas that shape you into one beautiful, shareable place.
            </p>
            <div className="btns">
              <button type="button" className="btn s av" onClick={() => app?.startSetup ? app.startSetup() : (window.location.href = '/login')}>
                Create your bookshelf -  It’s Free
              </button>
              <a href="#examples" className="btn o av" onClick={scrollToExamples}>
                Explore Examples ↓
              </a>
            </div>
          </div>
        </section>

        {/* USECASES SHOWCASE SECTION */}
        <section className="uc-showcases" id="examples">
          {/* 1. MUSIC ALBUMS */}
          <div className="uc-item">
            <div className="uc-item__text">
              <h2 className="uc-item__title">Music albums</h2>
              <h3 className="uc-item__sub">The records that made you</h3>
              <p className="uc-item__desc">
                Build a visual collection of the albums you love, from all-time classics to your latest obsession. Let people discover the music that defines your taste.
              </p>
            </div>
            <div className="uc-laptop">
              <img
                src="/usecases/music_album.png"
                alt="Music albums shelf view on laptop"
                loading="lazy"
              />
            </div>
          </div>

          {/* 2. FAVORITE MOVIES */}
          <div className="uc-item">
            <div className="uc-item__text">
              <h2 className="uc-item__title">Favorite movies</h2>
              <h3 className="uc-item__sub">Your own little cinema.</h3>
              <p className="uc-item__desc">
                Bring together the films you love, the stories that stayed with you, and the ones you recommend to everyone. A watchlist that feels uniquely yours.
              </p>
            </div>
            <div className="uc-laptop">
              <img
                src="/usecases/favourite_movies.png"
                alt="Favorite movies shelf view on laptop"
                loading="lazy"
              />
            </div>
          </div>

          {/* 3. NEWSLETTERS */}
          <div className="uc-item">
            <div className="uc-item__text">
              <h2 className="uc-item__title">Newsletters</h2>
              <h3 className="uc-item__sub">A reading list worth opening</h3>
              <p className="uc-item__desc">
                Showcase your top newsletters, essays that you recommended to everyone.
              </p>
            </div>
            <div className="uc-laptop">
              <img
                src="/usecases/newsletter.png"
                alt="Newsletters shelf view on laptop"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* "ANYTHING ELSE TO SHOWCASE?" SECTION */}
        <section className="uc-ideas">
          <div className="uc-ideas__container">
            <h2 className="uc-ideas__title">Anything else to showcase?</h2>
            <p className="uc-ideas__desc">
              Showcase <strong>Social Media Links</strong>, <strong>Favourite tools</strong>, <strong>Recipes</strong>, <strong>Places</strong>, <strong>Objects</strong>, if it says something about you, it belongs on your shelf.
            </p>

            {status === 'sent' ? (
              <div className="uc-ideas__success" role="status">
                🎉 Thanks for sharing! We’ve received your idea and will get in touch with you soon.
              </div>
            ) : (
              <form className="uc-ideas__form" onSubmit={handleIdeaSubmit} noValidate>
                <textarea
                  className="uc-ideas__textarea"
                  value={idea}
                  onChange={e => { setIdea(e.target.value); setErrorMsg(''); }}
                  placeholder="What would you like to create a shelf for? Tell us your idea, and we'll help bring it to life."
                  rows={3}
                  required
                />
                <input
                  type="email"
                  className="uc-ideas__input"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="Share your email so we can get in touch."
                  required
                />
                {errorMsg && (
                  <p style={{ margin: '4px 0 0', color: '#a34222', fontSize: 14 }}>
                    {errorMsg}
                  </p>
                )}
                <button type="submit" className="uc-ideas__submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <CtaSection onStart={app.startSetup} />
      </main>

      {/* FOOTER */}
      <LandingFooter app={app} />
    </div>
  );
}
