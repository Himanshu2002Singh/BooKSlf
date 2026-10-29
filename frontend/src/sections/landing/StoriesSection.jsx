import CaptureForm from './CaptureForm.jsx';
import { art, faqCards } from './content.jsx';
import Reviews from './Reviews.jsx';

// "We are an open book!": FAQ cards, the question form and reader reviews (#stories, #contact).
export default function StoriesSection({ onStart, email }) {
  return (
    <section className="open" id="stories">
      <div className="pic"><img src={art('open-book-bg.jpg')} alt="" /></div>
      <div className="oc">
        <div className="hd" data-reveal><h2 className="h2" style={{ whiteSpace: 'normal' }}>We are an open book!</h2><p>Everything you need to know about bookfolio.live</p></div>
        <div className="hcs">
          {faqCards.map((card, index) => (
            <div className="hc" key={card.title} data-reveal style={{ '--d': index + 1 }}>
              <div className="in"><h4>{card.title}</h4><div className="b">{card.body}</div></div>
              <div className="sp" style={{ background: card.color }} />
            </div>
          ))}
        </div>
        <div className="panel" id="contact" data-reveal>
          <div className="t">If you have a question, do share it. You will get an answer within 24 hours. No AI replies.</div>
          <CaptureForm kind="question" askEmail defaultEmail={email} label="Your question" placeholder="Share your questions." emptyMessage="Type your question first." />
          <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: 14, color: 'rgba(28, 18, 9, 0.7)' }}>
            Have ideas or feedback to share?{' '}
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSe1eG6q1MAQKkfRvDTqkQaGRi38TCVGMxKRUdVNNO21cpc9bA/viewform?usp=dialog" target="_blank" rel="noreferrer" style={{ color: '#e13a00', textDecoration: 'underline', fontWeight: 600 }}>
              Submit Feedback
            </a>
          </p>
        </div>
      </div>
      {/* Testimonials and redundant CTA commented out while reviews are gathered; CtaSection below provides the action */}
      {/* <Reviews /> */}
      {/* <button type="button" className="btn s av" onClick={onStart}>Create your bookshelf -  It’s Free</button> */}
    </section>
  );
}
