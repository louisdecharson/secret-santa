import type { PropsWithChildren } from 'react';
import React from 'react';

function Page({ children }: PropsWithChildren) {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>Secret Santa 🎅</title>
                <meta name="description" content="Secret Santa" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.simplecss.org/simple.min.css"
                />
                <link
                    rel="stylesheet"
                    href="./public/assets/css/santa.css"
                    type="text/css"
                    media="screen"
                />
            </head>
            <body>
                <div className="container">
                    <h1>
                        <a href="/" className="nodecorate">
                            Secret Santa 🎁
                        </a>
                    </h1>
                    {children}
                </div>
            </body>
        </html>
    );
}
export default Page;
