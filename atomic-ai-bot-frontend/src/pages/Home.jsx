import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import user from '../assets/user.png';
import bot from '../assets/bot.png';
import code from '../assets/code.png';
import done from '../assets/done.png';
import store from '../assets/store.png';
import service from '../assets/service.png';
import education from '../assets/education.png';
import business from '../assets/business.png';
import { getAccessToken, subscribeToAuthChanges } from '../utils/token';

function scrollToHash(hash) {
  const id = hash?.replace(/^#/, '');
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function StepArrowDown() {
  return (
    <div className="flex shrink-0 items-center justify-center py-2 text-brand lg:hidden" aria-hidden>
      <svg className="h-8 w-8 opacity-90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 5v14M5 12l7 7 7-7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StepArrowRight() {
  return (
    <div className="hidden shrink-0 items-center justify-center px-1 text-brand lg:flex" aria-hidden>
      <svg className="h-8 w-8 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 12h14M12 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FeatureCheckMark() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-brand/12 text-brand"
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.5 8.2 6.4 11l6.1-6.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, bump] = useState(0);

  useEffect(() => subscribeToAuthChanges(() => bump((n) => n + 1)), []);

  const isAuth = !!getAccessToken();

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const t = window.setTimeout(() => scrollToHash(hash), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex flex-col flex-1">
      <section
        className={[
          'flex w-[100vw] ml-[calc(50%-50vw)] flex-col items-center justify-center text-center',
          'min-h-[calc(100dvh-var(--site-header-height))]',
          '-mt-8 pt-8 pb-12 px-4',
          'border-b border-line bg-background',
        ].join(' ')}
      >
        <div className="inline-flex items-center justify-center rounded-full mb-8">
          <img className="hero-logo-slow-spin w-20 h-20 md:w-24 md:h-24" src={logo} alt="logo" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground max-w-4xl">
          Atomic <span className="text-brand">AI Bot</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground-muted max-w-2xl leading-relaxed mb-10">
        They are as strong as atoms. They are as widespread as atoms. There are as many of them as there are atoms. They are as important throughout the world as atoms.
        </p>
        {isAuth ? (
          <Link to="/dashboard" className="btn-primary text-lg px-10 py-3">
            Dashboard
          </Link>
        ) : (
          <Link to="/register" className="btn-primary text-lg px-10 py-3">
            Try It Now
          </Link>
        )}
      </section>

      <section
        id="purpose"
        className="scroll-mt-28 py-16 layout-container w-full text-center"
      >
        <h2 className="text-2xl font-medium text-brand mb-4">Purpose</h2>
        <p className="text-foreground-muted mb-10 max-w-2xl mx-auto">
          We provide AI solutions for a wide range of businesses.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {[
            {
              title: 'Online shops',
              text: 'Online shops are our primary focus and target when it comes to integrating AI chatbots.',
              image: store,
            },
            {
              title: 'Services',
              text: 'Atom is ideal for service-based websites and can run whilst you sleep.',
              image: service,
            },
            {
              title: 'Educational platforms',
              text: 'The bot will be able to handle enquiries on your behalf whilst you work on your next training course.',
              image: education,
            },
            {
              title: 'Business card websites',
              text: 'Whether you have a simple business card website or a personal website with a biography, with Atom you can create your own AI avatar.',
              image: business,
            },
          ].map((item) => (
            <article
              key={item.title}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-brand"
            >
              <div className="aspect-[4/3] w-full bg-blue-50 border-b border-line flex items-center justify-center text-foreground-muted text-xs uppercase tracking-wide">
                <img src={item.image} alt={item.title} className="w-30 h-30 object-contain" />
              </div>
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground font-heading">{item.title}</h3>
                <p className="text-sm text-foreground-muted leading-snug">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-28 py-16 border-t border-line layout-container w-full"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl font-medium text-brand mb-4">How it works</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto">
          In just a few simple steps, you can create your own bot – or even several bots – each with its own intelligence, rules and personality.
          </p>
        </div>

        <div className="flex flex-col items-stretch lg:flex-row lg:items-stretch lg:justify-center">
          {[
            {
              n: '01',
              title: 'Registration and personal account',
              text: 'Sign up and log in to your account – this is where all your atoms are kept.',
              image: user,
            },
            {
              n: '02',
              title: 'Bot Settings',
              text: 'Click the “Create new bot” button and fill in the fields to configure the bot. Once configured, you will receive a bot token.',
              image: bot,
            },
            {
              n: '03',
              title: 'Adding a bot to the website',
              text: 'The bot’s details section will also provide a script that you need to embed on your website.',
              image: code,
            },
            {
              n: '04',
              title: 'Everything is ready',
              text: 'Congratulations! Your first bot is already monitoring your website and helping your users.',
              image: done,
            },
          ].map((step, index, arr) => (
            <Fragment key={step.n}>
              <article className="mx-auto flex min-h-[28rem] w-full max-w-sm flex-1 flex-col rounded-lg border border-line bg-surface px-5 py-8 text-center shadow-sm transition-colors hover:border-brand lg:mx-0 lg:min-w-0 lg:max-w-none">
                <div className="font-heading text-4xl font-bold tabular-nums text-brand mb-4">
                  {step.n}
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="grow text-sm text-foreground-muted leading-relaxed">{step.text}</p>
                <div className="mx-auto mt-6 flex h-44 w-full max-w-[220px] shrink-0 items-center justify-center rounded-md border border-dashed border-line bg-blue-50 text-foreground-muted text-xs uppercase tracking-wide">
                  <img src={step.image} alt={step.title} className="w-20 h-20 object-contain" />
                </div>
              </article>
              {index < arr.length - 1 ? (
                <div className="flex shrink-0 flex-col items-center justify-center py-2 lg:w-9 lg:max-w-[2.25rem] lg:self-stretch lg:py-0">
                  <StepArrowDown />
                  <StepArrowRight />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </section>

      <div className="max-w-2xl mx-auto w-full">
        <section id="features" className="scroll-mt-28 py-16 border-t border-line w-full text-center">
          <h2 className="text-2xl font-medium text-brand mb-4">Features and benefits</h2>
          <p className="text-foreground-muted mx-auto max-w-2xl">
            Why should you choose us? Let us show you.
          </p>
          <ul className="mx-auto mt-10 max-w-2xl space-y-5 text-left">
            {[
              'The platform allows users to create several independent bots, each with its own consciousness.',
              'The ability to modify or instantly remove the bot without affecting your website.',
              'We have robust security and privacy measures in place. The bot operates using a token that cannot be forged or easily stolen.',
              'You decide how smart your bot will be; you can give it access to your website’s information, additional details about its behaviour and settings, as well as contact details.',
              'We offer a wide range of bot customisation options to ensure your bot looks absolutely stunning. ',
              'Each bot saves the chat history for each user for one hour, which allows the bot to keep track of the conversation and also work very quickly.',
              'Setting up the bot is just as simple as chatting with it – just paste a snippet of code into your website and you’re all set.',
            ].map((text, i) => (
              <li key={i} className="flex gap-4">
                <FeatureCheckMark />
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="about" className="scroll-mt-28 py-16 border-t border-line w-full text-center">
        <h2 className="text-2xl font-medium text-brand mb-4">About</h2>
        <p className="w-full max-w-none text-foreground-muted">
        <span className="text-foreground font-bold">Atomic AI Bot</span> is a lightweight, high-performance solution designed to bridge the gap between <span className="text-foreground font-bold">businesses</span> and <span className="text-foreground font-bold">AI-driven automation</span>. The platform empowers users to deploy customized <span className="text-foreground font-bold">AI assistants</span> via a seamless iframe-integrated widget. Our motivation lies in simplifying the complexity of backend services while providing a fluid, modern user experience—featuring real-time response indicators and a robust session-based history. Whether you're looking to automate customer support or provide an interactive knowledge base, Atomic AI Bot offers a scalable, secure, and intuitive infrastructure to bring the power of <span className="text-foreground font-bold">LLMs</span> directly to your website.
        </p>
      </section>

      <section className="w-full pt-5 pb-10 text-center">
        <p className="text-foreground text-base font-medium md:text-lg">Ready to create your first atom?</p>
        <button
          type="button"
          onClick={() => navigate(isAuth ? '/dashboard' : '/login')}
          className="home-cta-logo-btn mx-auto mt-3 inline-flex cursor-pointer justify-center rounded-full border-0 bg-transparent p-1.5 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={isAuth ? 'Open dashboard' : 'Log in'}
        >
          <span className="home-cta-logo-scale">
            <span className="home-cta-logo-inner">
              <img
                className="pointer-events-none h-12 w-12 object-contain md:h-10 md:w-10"
                src={logo}
                alt=""
              />
            </span>
          </span>
        </button>
      </section>
    </div>
  );
}
