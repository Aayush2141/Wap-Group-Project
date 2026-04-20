// WHAT THIS FILE DOES:
// A simple wrapper page that renders the full-page MoodChat component.
// The actual chat logic lives in components/MoodChat.jsx.

import MoodChat from '../components/MoodChat';

export default function MoodPage() {
  return (
    // page-enter triggers the CSS fade-in animation on route change
    <div className="h-full flex flex-col overflow-hidden page-enter">
      <MoodChat />
    </div>
  );
}
