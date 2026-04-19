// MoodPage.jsx
// A simple wrapper page that renders the MoodChat component full-height.
// The actual chat logic lives in components/MoodChat.jsx.

import MoodChat from '../components/MoodChat';

export default function MoodPage() {
  return (
    // h-full + flex column so MoodChat fills the remaining screen height
    // page-enter triggers the CSS fade-in animation on route change
    <div className="h-full flex flex-col overflow-hidden page-enter">
      <MoodChat />
    </div>
  );
}
