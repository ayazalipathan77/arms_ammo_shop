import React, { useState, useEffect } from 'react';

export const ScrambleText = ({ text, className = '' }: { text: string; className?: string }) => {
    const [display, setDisplay] = useState(text);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    const scramble = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(
                text
                    .split('')
                    .map((letter, index) => {
                        if (index < iterations) {
                            return text[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('')
            );

            if (iterations >= text.length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 30);
    };

    useEffect(() => {
        scramble();
    }, [text]);

    return (
        <span className={className} onMouseEnter={scramble}>
            {display}
        </span>
    );
};
