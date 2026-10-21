import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { HeroPreview } from './HeroPreview';

const HEADLINE = ['Waiting less.', 'Knowing more.'];

/**
 * Marketing hero: staggered headline reveal, an animated mesh gradient
 * background, and the floating queue preview.
 */
export function Hero() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative overflow-hidden bg-navy pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28">
      {/* Ambient gradient fields */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.42),transparent_68%)] blur-3xl animate-drift-a" />
        <div className="absolute -right-40 -bottom-32 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.2),transparent_68%)] blur-3xl animate-drift-b" />
        <div className="absolute inset-0 bg-grid-faint mask-fade-b" />
      </div>

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <motion.div variants={container} initial="hidden" animate="visible">
          {/* Live indicator */}
          <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex size-1.5">
              {!reduceMotion && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
              )}
              <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
            </span>
            <span className="text-[11.5px] font-medium tracking-wide text-mint">
              Simulated live queue
            </span>
            <span className="text-[11.5px] text-white/35">·</span>
            <span className="text-[11.5px] text-white/50">8 visitors waiting</span>
          </motion.div>

          {/* Headline */}
          <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:text-[3.5rem] lg:text-[4.1rem]">
            {HEADLINE.map((line, index) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  variants={item}
                  className="block"
                  style={
                    index === 1
                      ? {
                          backgroundImage:
                            'linear-gradient(100deg, #5EEAD4 0%, #A7F3E4 45%, #5EEAD4 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                        }
                      : undefined
                  }
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Supporting copy */}
          <motion.p
            variants={item}
            className="mt-6 max-w-[30rem] text-[16px] leading-relaxed text-white/65 sm:text-[17px]"
          >
            Know your place in line, track your estimated wait, and stay informed as your queue
            moves — before you are called.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/join" className="sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                variant="mint"
                trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />}
              >
                Join a queue
              </Button>
            </Link>
            <Link to="/staff" className="sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                variant="outline-dark"
                icon={<Play aria-hidden className="size-3.5" strokeWidth={2.4} />}
              >
                Explore live demo
              </Button>
            </Link>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            variants={item}
            className="mt-6 max-w-md text-[12px] leading-relaxed text-white/40"
          >
            This is a product demo. Every visitor, token, and wait time shown is simulated in the
            browser — it is not live clinic data, and no messages are actually sent.
          </motion.p>

          <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
            {['No app download', 'Works on any device', 'Demo uses simulated data'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-[12px] text-white/45">
                <Sparkles aria-hidden className="size-3 text-mint/60" strokeWidth={2.2} />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative lg:pl-6">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}