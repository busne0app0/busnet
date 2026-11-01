import { useEffect, useState } from 'react';

interface Options {
    active?: boolean;
    typeMs?: number;
    eraseMs?: number;
    holdMs?: number;
    pauseMs?: number;
    staticText?: string;
    reducedText?: string;
}

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTypingPlaceholder(words: string[], options: Options = {}) {
    const {
        active = true,
        typeMs = 110,
        eraseMs = 55,
        holdMs = 1600,
        pauseMs = 450,
        staticText = '',
        reducedText,
    } = options;

    const [reduced] = useState(prefersReducedMotion);
    const [text, setText] = useState('');

    useEffect(() => {
        if (!active || reduced || words.length === 0) {
            setText('');
            return;
        }

        let wordIdx = 0;
        let charIdx = 0;
        let erasing = false;
        let timer: ReturnType<typeof setTimeout>;

        const step = () => {
            const word = words[wordIdx];

            if (!erasing) {
                charIdx += 1;
                setText(word.slice(0, charIdx));
                if (charIdx >= word.length) {
                    erasing = true;
                    timer = setTimeout(step, holdMs);
                    return;
                }
                timer = setTimeout(step, typeMs);
            } else {
                charIdx -= 1;
                setText(word.slice(0, charIdx));
                if (charIdx <= 0) {
                    erasing = false;
                    wordIdx = (wordIdx + 1) % words.length;
                    timer = setTimeout(step, pauseMs);
                    return;
                }
                timer = setTimeout(step, eraseMs);
            }
        };

        timer = setTimeout(step, pauseMs);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, reduced, words.join('|'), typeMs, eraseMs, holdMs, pauseMs]);

    if (!active) return staticText;
    if (reduced) return reducedText ?? staticText;
    return text || '\u00A0';
}