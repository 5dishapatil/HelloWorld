export const useSpeech = () => {
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (!text) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-IN';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  };

  return { speak };
};