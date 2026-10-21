import * as Message from '../models/message.model.js';
import { cleanMessage } from '../validators/feedback.validator.js';

// POST /api/messages { kind: 'updates' | 'question', text, email, website }
// The landing page's two forms; the admin panel lists what they send. People never see the
// `website` field, so a request that fills it is a bot: it gets the usual answer and nothing is kept.
export async function send(request, response) {
  const message = cleanMessage(request.body, request.user);
  if (!request.body.website) await Message.create(message);
  response.json({ ok: true });
}
