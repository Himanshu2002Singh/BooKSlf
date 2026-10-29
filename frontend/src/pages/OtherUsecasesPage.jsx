import { useState } from 'react';
import usePageTitle from '../app/usePageTitle.js';
import LandingNav from '../sections/landing/LandingNav.jsx';
import LandingFooter from '../sections/landing/LandingFooter.jsx';
import CtaSection from '../sections/landing/CtaSection.jsx';
import { api } from '../lib/api.js';
import { art } from '../sections/landing/content.jsx';
import '../styles/figma-landing.css';
import '../styles/other-usecases.css';

/* ----------------- MOCKUP COMPONENTS ----------------- */

function MusicAlbumsShelf() {
  const topAlbums = [
    { title: 'The Dark Side of the Moon', artist: 'Pink Floyd', bg: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e24 100%)', label: '#e13a00', art: '🌈' },
    { title: 'Random Access Memories', artist: 'Daft Punk', bg: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', label: '#f59e0b', art: '🤖' },
    { title: 'Rumours', artist: 'Fleetwood Mac', bg: 'linear-gradient(135deg, #3d312a 0%, #635043 100%)', label: '#d97706', art: '✨' },
    { title: 'Thriller', artist: 'Michael Jackson', bg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', label: '#ef4444', art: '⚡' },
  ];

  const bottomAlbums = [
    { title: 'Abbey Road', artist: 'The Beatles', bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', label: '#10b981', art: '🚶‍♂️' },
    { title: 'Blonde', artist: 'Frank Ocean', bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', label: '#60a5fa', art: '🌊' },
    { title: 'Currents', artist: 'Tame Impala', bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', label: '#a78bfa', art: '🔮' },
    { title: 'DAMN.', artist: 'Kendrick Lamar', bg: 'linear-gradient(135deg, #831843 0%, #be185d 100%)', label: '#f43f5e', art: '🔥' },
  ];

  return (
    <div className="uc-laptop__screen uc-screen--music">
      <div className="uc-screen-head">
        <h4>My Top Albums</h4>
        <span>12 albums · listening since 2018</span>
      </div>
      <div className="uc-music-shelf">
        <div className="uc-music-row">
          <div className="uc-music-items">
            {topAlbums.map((item, idx) => (
              <div key={idx} className="uc-album" title={`${item.title} by ${item.artist}`}>
                <div className="uc-album__vinyl">
                  <div className="uc-album__label" style={{ background: item.label }} />
                </div>
                <div className="uc-album__cover" style={{ background: item.bg }}>
                  <span>{item.art}<br />{item.title.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>

        <div className="uc-music-row">
          <div className="uc-music-items">
            {bottomAlbums.map((item, idx) => (
              <div key={idx} className="uc-album" title={`${item.title} by ${item.artist}`}>
                <div className="uc-album__vinyl">
                  <div className="uc-album__label" style={{ background: item.label }} />
                </div>
                <div className="uc-album__cover" style={{ background: item.bg }}>
                  <span>{item.art}<br />{item.title.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>
      </div>
    </div>
  );
}

function FavoriteMoviesShelf() {
  const topMovies = [
    { title: 'Interstellar', year: '2014', bg: 'linear-gradient(180deg, #09122c 0%, #162447 50%, #e43f5a 100%)', emoji: '🚀' },
    { title: 'Inception', year: '2010', bg: 'linear-gradient(180deg, #1b1b2f 0%, #1f4068 60%, #e43f5a 100%)', emoji: '🌀' },
    { title: 'Dune', year: '2021', bg: 'linear-gradient(180deg, #3d2314 0%, #87431d 50%, #d87d35 100%)', emoji: '🏜️' },
    { title: 'The Dark Knight', year: '2008', bg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0284c7 100%)', emoji: '🦇' },
  ];

  const bottomMovies = [
    { title: 'Pulp Fiction', year: '1994', bg: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 50%, #ea580c 100%)', emoji: '🔫' },
    { title: 'Grand Budapest', year: '2014', bg: 'linear-gradient(180deg, #831843 0%, #be185d 50%, #f472b6 100%)', emoji: '🏨' },
    { title: 'Spirited Away', year: '2001', bg: 'linear-gradient(180deg, #134e4a 0%, #0f766e 50%, #f59e0b 100%)', emoji: '🐉' },
    { title: 'Parasite', year: '2019', bg: 'linear-gradient(180deg, #14532d 0%, #166534 50%, #84cc16 100%)', emoji: '🍑' },
  ];

  return (
    <div className="uc-laptop__screen uc-screen--movies">
      <div className="uc-screen-head">
        <h4>My Top Movies</h4>
        <span>Cinematic favorites · 10 films</span>
      </div>
      <div className="uc-movies-shelf">
        <div className="uc-movie-row">
          <div className="uc-movie-items">
            {topMovies.map((movie, idx) => (
              <div key={idx} className="uc-poster" style={{ background: movie.bg }} title={`${movie.title} (${movie.year})`}>
                <span style={{ fontSize: 13, marginBottom: 'auto' }}>{movie.emoji}</span>
                <span>{movie.title}</span>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>

        <div className="uc-movie-row">
          <div className="uc-movie-items">
            {bottomMovies.map((movie, idx) => (
              <div key={idx} className="uc-poster" style={{ background: movie.bg }} title={`${movie.title} (${movie.year})`}>
                <span style={{ fontSize: 13, marginBottom: 'auto' }}>{movie.emoji}</span>
                <span>{movie.title}</span>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>
      </div>
    </div>
  );
}

function NewslettersShelf() {
  const topNews = [
    { name: 'The Profile', author: 'Polina P.', color: '#ea580c', icon: '👤', snippet: 'Deep profiles of high achievers and entrepreneurs.' },
    { name: 'Dense Discovery', author: 'Kai Brach', color: '#eab308', icon: '💡', snippet: 'Weekly curation of design, productivity & ethics.' },
    { name: 'Not Boring', author: 'Packy M.', color: '#0284c7', icon: '🚀', snippet: 'Business strategy & exponential tech trends.' },
  ];

  const bottomNews = [
    { name: 'Morning Brew', author: 'Daily Brief', color: '#f59e0b', icon: '☕', snippet: 'Fast business, finance & tech news every morning.' },
    { name: 'Stratechery', author: 'Ben Thompson', color: '#6366f1', icon: '📊', snippet: 'Deep analysis of the business of technology.' },
    { name: 'The Generalist', author: 'Mario G.', color: '#ec4899', icon: '🧠', snippet: 'Clear breakdowns of breakout companies and IPOs.' },
  ];

  return (
    <div className="uc-laptop__screen uc-screen--newsletters">
      <div className="uc-screen-head">
        <h4>My Top Newsletters</h4>
        <span>Weekly reads & essays</span>
      </div>
      <div className="uc-news-shelf">
        <div className="uc-news-row">
          <div className="uc-news-items">
            {topNews.map((item, idx) => (
              <div key={idx} className="uc-news-card" title={`${item.name} by ${item.author}`}>
                <div className="uc-news-card__top">
                  <div className="uc-news-card__icon" style={{ background: item.color }}>{item.icon}</div>
                  <span className="uc-news-card__name">{item.name}</span>
                </div>
                <div className="uc-news-card__snippet">{item.snippet}</div>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>

        <div className="uc-news-row">
          <div className="uc-news-items">
            {bottomNews.map((item, idx) => (
              <div key={idx} className="uc-news-card" title={`${item.name} by ${item.author}`}>
                <div className="uc-news-card__top">
                  <div className="uc-news-card__icon" style={{ background: item.color }}>{item.icon}</div>
                  <span className="uc-news-card__name">{item.name}</span>
                </div>
                <div className="uc-news-card__snippet">{item.snippet}</div>
              </div>
            ))}
          </div>
          <div className="uc-shelf-plank" />
        </div>
      </div>
    </div>
  );
}

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
            <a href="#examples" className="uc-hero__cta" onClick={scrollToExamples}>
              See Examples Below
            </a>
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
              <img src={art('laptop.webp')} alt="Music albums shelf view on laptop" />
              <MusicAlbumsShelf />
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
              <img src={art('laptop.webp')} alt="Favorite movies shelf view on laptop" />
              <FavoriteMoviesShelf />
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
              <img src={art('laptop.webp')} alt="Newsletters shelf view on laptop" />
              <NewslettersShelf />
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
