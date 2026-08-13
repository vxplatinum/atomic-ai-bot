import { useEffect } from 'react';

const AtomicBot = () => {
  useEffect(() => {
    // No-op if index.html already has #atomic-ai-bot. This is the programmatic inject path.
    if (!document.getElementById('atomic-ai-bot')) {
      const script = document.createElement('script');
      script.id = 'atomic-ai-bot';
      script.src = "http://127.0.0.1:8080/static/js/widget.js";
      script.dataset.token = "token_from_webapp";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
};

export default AtomicBot;