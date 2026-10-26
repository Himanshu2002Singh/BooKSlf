import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import '../../styles/review.css';

const WORDS = ['Not for me', 'Could be better', 'Good', 'Really good', 'Loved it!'];

// Asks the reader to rate Bookshelf.cv out of 5 and, if they like, say why. It opens once their
// shelf is made, and from "Leave a review" on their shelf page.
export default function ReviewDialog({ review, onSave, onClose }) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [text, setText] = useState(review?.text ?? '');
  const [phase, setPhase] = useState('idle'); // idle | saving | done
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!rating) {
      setError('Pick a star rating first.');
      return;
    }
    setPhase('saving');
    setError('');
    try {
      await onSave({ rating, text: text.trim() });
      setPhase('done');
    } catch (failure) {
      setError(failure.message);
      setPhase('idle');
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="review-title" className="rv-dialog">
      {phase === 'done' ? (
        <div className="rv-done">
          <h2 id="review-title">Thank you!</h2>
          <p>Your review helps us make Bookshelf.cv better for every reader.</p>
          <button type="button" className="fg-cta" onClick={onClose}>Back to my shelf</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h2 id="review-title">{review ? 'Edit your review' : 'Your shelf is ready! How did we do?'}</h2>
          <p>Rate Bookshelf.cv and tell us what you think. We may show your words on our home page, with your name and photo.</p>
          <fieldset className="rv-stars">
            <legend className="sr-only">Your rating</legend>
            {WORDS.map((word, index) => (
              <label key={word}>
                <input className="sr-only" type="radio" name="rating" value={index + 1} checked={rating === index + 1} onChange={() => { setRating(index + 1); setError(''); }} />
                <span aria-hidden="true" data-on={index < rating}>★</span>
                <span className="sr-only">{index + 1} out of 5: {word}</span>
              </label>
            ))}
          </fieldset>
          <p className="rv-word" aria-hidden="true">{rating ? WORDS[rating - 1] : ''}</p>
          <label className="fg-panel__label" htmlFor="review-text">Your review (optional)</label>
          <textarea
            id="review-text"
            className="fg-input rv-text"
            value={text}
            onChange={event => setText(event.target.value)}
            maxLength={1000}
            placeholder="What did you like? What should we add next?"
          />
          {error && <p className="fg-field-error" role="alert">{error}</p>}
          <div className="rv-actions">
            <button type="button" className="fg-outline" onClick={onClose}>Maybe later</button>
            <button type="submit" className="fg-cta" disabled={phase === 'saving'}>{phase === 'saving' ? 'Sending…' : 'Send review'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
