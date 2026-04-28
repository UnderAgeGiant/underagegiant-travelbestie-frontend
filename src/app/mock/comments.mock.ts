import { Comment } from '../core/models/comment.model';

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  paris_0: [
    { id: 'mc1', attractionId: 'paris_0', name: 'Sofia',  text: 'Breathtaking at sunset! Worth every minute of the queue.', rating: 5, color: '#A78BFA', date: 'Apr 22' },
    { id: 'mc2', attractionId: 'paris_0', name: 'Carlos', text: 'Go early in the morning to avoid the crowds.',              rating: 4, color: '#34D399', date: 'Mar 10' },
  ],
  paris_1: [
    { id: 'mc3', attractionId: 'paris_1', name: 'Léa',   text: 'The glass pyramid is stunning from every angle.',           rating: 5, color: '#F472B6', date: 'Feb 28' },
  ],
  rome_0: [
    { id: 'mc4', attractionId: 'rome_0',  name: 'Mia',   text: 'Absolutely unmissable — the scale still surprises you in person.', rating: 5, color: '#34D399', date: 'Mar 15' },
  ],
  tokyo_0: [
    { id: 'mc5', attractionId: 'tokyo_0', name: 'Yuki',  text: 'Best view of the city. Sunset is magical.',                 rating: 5, color: '#FBBF24', date: 'Jan 5' },
  ],
};
