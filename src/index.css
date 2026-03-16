@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

:root {
  --motion-fast: 160ms;
  --motion-base: 220ms;
  --motion-slow: 300ms;
  --motion-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

.motion-fast {
  transition-duration: var(--motion-fast);
  transition-timing-function: var(--motion-ease-out);
}

.motion-base {
  transition-duration: var(--motion-base);
  transition-timing-function: var(--motion-ease-out);
}

.motion-slow {
  transition-duration: var(--motion-slow);
  transition-timing-function: var(--motion-ease-out);
}


html, body {
  background-color: black;
}

#root {
  min-height: 100vh;
}
.fade-in {
    animation: fadeIn 0.2s ease-out forwards;
    will-change: transform, opacity;
  }

  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  /* Add this to your CSS file */
@media (max-width: 640px) {
  .genre-item {
    white-space: nowrap; /* Prevent wrapping on small screens */
  }
}

@media (min-width: 640px) {
  .genre-item {
    white-space: normal; /* Allow wrapping on larger screens */
  }
}
.scrollable {
  position: relative;
  overflow-y: auto; /* Enable scrolling */
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 4px;
}

/* Completely hide scrollbar while keeping scroll functionality */
.hide-scrollbar {
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE / Edge */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;                /* Chrome / Safari / Opera */
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

.genre-item {
  outline: none;               /* Remove the default focus outline */
  caret-color: transparent;     /* Hide the blinking caret */
}

.genre-item:focus {
  outline: 2px solid #8b5cf6;   /* Customize focus outline to match the color scheme */
  caret-color: transparent;     /* Ensures caret stays hidden on focus */
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
