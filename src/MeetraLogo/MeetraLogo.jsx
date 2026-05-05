import React from 'react';

const MeetraLogo = ({ className = "w-64 h-64" }) => {
    return (
        <div className={`flex justify-center items-center ${className}`}>
            <svg
                viewBox="0 0 400 400"
                className="w-full h-full drop-shadow-md"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="grad-left-head" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#0e7ca1', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#01b4b7', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient id="grad-left-body" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#16398c', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#038da1', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#01bfb7', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient id="grad-right-head" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#a23cf4', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#6524d6', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient id="grad-right-body" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#3a1cb3', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#8233ea', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#a741f6', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient id="grad-play" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#065691', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#058eb4', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>

                {/* Left Figure Body */}
                <path
                    d="M 160 160 C 90 160, 80 270, 150 280 C 190 285, 210 220, 210 220"
                    fill="none"
                    stroke="url(#grad-left-body)"
                    strokeWidth="35"
                    strokeLinecap="round"
                />

                {/* Right Figure Body */}
                <path
                    d="M 240 160 C 310 160, 320 270, 250 280 C 210 285, 190 220, 190 220"
                    fill="none"
                    stroke="url(#grad-right-body)"
                    strokeWidth="35"
                    strokeLinecap="round"
                />

                {/* Left Head */}
                <circle cx="160" cy="120" r="20" fill="url(#grad-left-head)" />

                {/* Right Head */}
                <circle cx="240" cy="120" r="20" fill="url(#grad-right-head)" />

                {/* Center Play Button Overlay */}
                <path
                    d="M 183 195 L 183 245 L 225 220 Z"
                    fill="url(#grad-play)"
                    stroke="#07e6f6"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default MeetraLogo;