'use client';

import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthDispatch } from '@/hooks/useAuthDispatch';
import { devLogin, isLocalDev } from '@/lib/api';
import Matter from 'matter-js';

const BUBBLES = [
  { label: 'Technology', size: 125 },
  { label: 'Entertainment', size: 135 },
  { label: 'Business', size: 115 },
  { label: 'Knowledge', size: 120 },
  { label: 'Sports', size: 95 },
  { label: 'Lifestyle', size: 105 },
] as const;

// Types for syncing Matter.js bodies with React rendering
interface BubbleRenderData {
  id: number;
  label: string;
  size: number;
  x: number;
  y: number;
  angle: number;
}

function BouncingBubbles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbleData, setBubbleData] = useState<BubbleRenderData[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Ensure we have real initial dimensions
    const startW = container.clientWidth || 393;
    const startH = container.clientHeight || 500;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.8, scale: 0.001 }
    });
    const world = engine.world;
    engine.positionIterations = 8;
    engine.velocityIterations = 8;

    // Create walls manually with large thickness and padding avoiding overflow-hidden drop
    const wallOpts = { isStatic: true, friction: 0, restitution: 0.1, render: { visible: false } };
    const floor = Matter.Bodies.rectangle(startW / 2, startH + 100, Math.max(startW * 3, 2000), 200, wallOpts);
    const leftWall = Matter.Bodies.rectangle(-100, startH / 2, 200, Math.max(startH * 3, 2000), wallOpts);
    const rightWall = Matter.Bodies.rectangle(startW + 100, startH / 2, 200, Math.max(startH * 3, 2000), wallOpts);

    Matter.World.add(world, [floor, leftWall, rightWall]);

    const bubblesWithPhysics = BUBBLES.map((b, i) => {
      // Spawn within visually safe bounds (top of screen area)
      const xStart = (startW / 2) + ((Math.random() - 0.5) * 80);
      const yStart = 20 - (i * 10);
      const radius = b.size / 2;

      const body = Matter.Bodies.circle(xStart, yStart, radius, {
        restitution: 0.65,
        friction: 0.005,
        frictionAir: 0.012,
        density: 0.001,
      });

      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: 2 });
      return { ...b, body };
    });

    Matter.World.add(world, bubblesWithPhysics.map(b => b.body));

    const updateBounds = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;

      // Update thick boundaries
      Matter.Body.setPosition(floor, { x: w / 2, y: h + 100 });
      Matter.Body.setPosition(leftWall, { x: -100, y: h / 2 });
      Matter.Body.setPosition(rightWall, { x: w + 100, y: h / 2 });
    };

    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(container);

    let renderFrame: number;
    let lastTime = performance.now();

    const syncReact = (time: number) => {
      let delta = time - lastTime;
      // Cap delta logic to prevent huge physics jumps on tab switch/lag
      if (delta > 30) delta = 16.66;
      lastTime = time;

      Matter.Engine.update(engine, delta);

      const newRenderData: BubbleRenderData[] = bubblesWithPhysics.map(b => ({
        id: b.body.id,
        label: b.label,
        size: b.size,
        x: b.body.position.x,
        y: b.body.position.y,
        angle: b.body.angle,
      }));

      setBubbleData(newRenderData);
      renderFrame = requestAnimationFrame(syncReact);
    };

    renderFrame = requestAnimationFrame(syncReact);

    return () => {
      cancelAnimationFrame(renderFrame);
      resizeObserver.disconnect();
      Matter.Engine.clear(engine);
      Matter.World.clear(engine.world, false);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {bubbleData.map(b => (
        <div
          key={b.id}
          className="bubble-3d absolute rounded-full flex items-center justify-center pointer-events-none"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.x - (b.size / 2)}px`,
            top: `${b.y - (b.size / 2)}px`,
            transform: `rotate(${b.angle}rad)`,
          }}
        >
          <span
            className="font-serif font-medium text-white text-center leading-[1.1] tracking-wide"
            style={{
              fontSize: b.size > 115 ? '16px' : '13px',
              transform: `rotate(${-b.angle}rad)`
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { login } = useAuthDispatch();
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');
  const showDevLogin = useSyncExternalStore(
    () => () => { },
    () => isLocalDev(),
    () => false,
  );

  const [reducedMotion, setReducedMotion] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      t = setTimeout(() => {
        setReducedMotion(true);
        setShowAnimations(false);
      }, 0);
    } else {
      t = setTimeout(() => setShowAnimations(false), 5500);
    }
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/explore');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
      </div>
    );
  }

  // Fade-in effect for the rest of the form
  const formRevealStyle = showAnimations && !reducedMotion
    ? { animation: 'fade-in 1.4s 3.8s cubic-bezier(0.16,1,0.3,1) both' }
    : undefined;

  return (
    <div className="flex min-h-dvh justify-center bg-cream pt-[80px] sm:items-center sm:px-6 sm:pt-0">
      <div className="relative w-full max-w-[393px] px-6 py-20 sm:rounded-2xl sm:shadow-[0px_0px_0px_1px_rgba(224,224,216,0.5),0px_25px_50px_-12px_rgba(0,0,0,0.05)]" style={{ overflow: showAnimations && !reducedMotion ? 'visible' : 'hidden' }}>

        {/* Intro Animations container - 3D Physics Bubbles */}
        {showAnimations && !reducedMotion && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: 20, animation: 'intro-exit 1s 4.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
          >
            <BouncingBubbles />
          </div>
        )}

        {/* Real Content container */}
        <div className="relative flex flex-col pointer-events-none" style={{ zIndex: 30 }}>
          {/* Logo */}
          <div className="mb-12 flex items-center justify-center pointer-events-auto" style={{ animation: !reducedMotion ? 'scale-in 0.8s 300ms cubic-bezier(0.16,1,0.3,1) both' : 'none' }}>
            <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
              Your
            </span>
            <span className="mx-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#111] bg-cream">
              <span className="text-[10px] leading-none">&#x1F399;&#xFE0F;</span>
            </span>
            <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
              Podcast
            </span>
          </div>

          <div style={formRevealStyle} className="pointer-events-auto">
            {/* Heading */}
            <h1 className="mb-4 text-center font-serif text-4xl leading-[40px] text-[#111]">
              Welcome
            </h1>
            <p className="mx-auto mb-12 max-w-[260px] text-center font-serif italic text-base leading-[26px] text-[#111]/60">
              Your daily tech podcast, curated just for you.
            </p>

            {/* Divider */}
            <div className="relative mb-6 flex items-center">
              <div className="flex-1 border-t border-border-warm" />
              <span className="bg-cream px-4 font-inter text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]">
                Sign in with
              </span>
              <div className="flex-1 border-t border-border-warm" />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={() => login('google')}
              className="mb-3 flex h-[56px] w-full items-center justify-between rounded-[10px] border border-border-warm px-[25px] tap-feedback transition-colors hover:bg-white bg-cream"
            >
              <span className="font-serif text-lg leading-[28px] text-[#111]">
                Continue with Google
              </span>
              <span className="font-inter text-xl font-bold text-[#111]">G</span>
            </button>

            {/* GitHub button */}
            <button
              type="button"
              onClick={() => login('github')}
              className="flex h-[56px] w-full items-center justify-between rounded-[10px] border border-border-warm px-[25px] tap-feedback transition-colors hover:bg-white bg-cream"
            >
              <span className="font-serif text-lg leading-[28px] text-[#111]">
                Continue with GitHub
              </span>
              <svg className="size-5 text-[#111]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </button>

            {/* Dev login — only visible in local development */}
            {showDevLogin && (
              <>
                <div className="relative mt-6 flex items-center">
                  <div className="flex-1 border-t border-border-warm" />
                  <span className="bg-cream px-4 font-inter text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]">
                    Dev only
                  </span>
                  <div className="flex-1 border-t border-border-warm" />
                </div>
                <button
                  type="button"
                  disabled={devLoading}
                  onClick={async () => {
                    setDevLoading(true);
                    setDevError('');
                    try {
                      await devLogin();
                      window.location.href = '/explore';
                    } catch (err) {
                      setDevError(err instanceof Error ? err.message : 'Dev login failed — is the backend running?');
                      setDevLoading(false);
                    }
                  }}
                  className="mt-3 flex h-[56px] w-full items-center justify-between rounded-[10px] border border-dashed border-[#c0c0b5] px-[25px] tap-feedback transition-colors hover:bg-[#f5f5ed]"
                >
                  <span className="font-serif text-lg leading-[28px] text-[#666]">
                    {devLoading ? 'Logging in...' : 'Dev Login (Seed User)'}
                  </span>
                  <span className="font-inter text-base text-[#666]">~</span>
                </button>
                {devError && (
                  <p className="mt-2 text-center font-inter text-[12px] text-[#c07060]">{devError}</p>
                )}
              </>
            )}

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 font-inter">
              <Link href="/privacy" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
                Privacy Policy
              </Link>
              <span className="text-[10px] leading-[15px] text-[#666]">|</span>
              <Link href="/terms" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
