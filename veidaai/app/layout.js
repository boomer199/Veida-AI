import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  ClerkLoaded,
  ClerkLoading,
} from '@clerk/nextjs';
import Navbar from '../components/navbar';
import { dark } from "@clerk/themes";
import Script from 'next/script';
import { NotificationProvider } from '../context/NotificationContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Veida AI - Revolutionizing Learning",
  description: "Veida AI is your all-in-one secret academic weapon, designed and developed by students, for students. With AI-generated notes, flashcards, and personalized study plans, Veida AI will transform your educational journey.",
  url: "https://veidaai.com",
  image: "/veida-logo.png",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>

      
      <html lang="en">
        <head>
        <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{metadata.title}</title>
          <meta name="description" content={metadata.description} />
          <meta name="keywords" content="AI learning, personalized education, study tools, Veida AI, educational technology" />

          {/* Open Graph / Facebook */}
          <meta property="og:title" content={metadata.title} />
          <meta property="og:description" content={metadata.description} />
          <meta property="og:image" content={metadata.image} />
          <meta property="og:url" content={metadata.url} />
          <meta property="og:type" content="website" />

          {/* Twitter */}
          <meta name="twitter:card" content="/veida-banner.jpg" />
          <meta name="twitter:title" content={metadata.title} />
          <meta name="twitter:description" content={metadata.description} />
          <meta name="twitter:image" content={metadata.image} />

          {/* Canonical URL */}
          <link rel="canonical" href={metadata.url} />

          {/* Structured Data (Schema.org) */}
          <Script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Veida AI",
                "url": metadata.url,
                "logo": metadata.image,
                "description": metadata.description
              }),
            }}
          />

          {/* Google Fonts */}
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
          {/* Google Analytics */}
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `,
            }}
          />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"></link>
        </head>
        <body className={inter.className}>
          <ClerkLoading>
            <div className="loading">Loading...</div>
          </ClerkLoading>
          <ClerkLoaded>
            <div className="container">
              <div className="c2">
                <NotificationProvider>
                  <Navbar />
                  {children}
                </NotificationProvider>
              </div>
            </div>
          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  );
}