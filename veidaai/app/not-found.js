"use client";

import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Page Not Found</h2>
      <p className={styles.message}>The resource you are looking for does not exist.</p>
      <button onClick={() => window.location.href = '/'} className={styles.returnButton}>Return Home</button>
    </div>
  );
}